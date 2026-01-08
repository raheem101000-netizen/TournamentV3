
import { AsyncLocalStorage } from 'async_hooks';

// --- CONFIGURATION ---
const ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://46.62.229.59:4318';
const API_KEY = process.env.SKYVIEW_API_KEY || 'demo123';
const SERVICE_NAME = 'tourni1010-backend';
const TENANT_ID = 'Tourni1010'; // <--- 🔴 REQUIRED FOR SKYVIEW

// --- IMPORTANT ROUTES TO TRACE ---
// Critical, High, and Medium priority routes (all write operations)
export const IMPORTANT_ROUTES = [
  // ========== 🔴 CRITICAL (Authentication & Account) ==========
  'POST /api/auth/login',
  'POST /api/auth/register',
  'POST /api/auth/logout',
  'POST /api/auth/resend-verification',
  'PATCH /api/users/:id',
  'POST /api/users/:id/password',
  'POST /api/users/:id/disable',
  'DELETE /api/users/:id',

  // ========== 🟠 HIGH PRIORITY (Tournament Operations) ==========
  'POST /api/tournaments',
  'PATCH /api/tournaments/:id',
  'DELETE /api/tournaments/:id',
  'POST /api/tournaments/:tournamentId/generate-fixtures',
  'POST /api/tournaments/:tournamentId/matches/custom',
  'POST /api/tournaments/:tournamentId/registrations',
  'POST /api/tournaments/:tournamentId/registration-config',
  'PUT /api/tournaments/:id/registration/config',

  // ========== 🟠 HIGH PRIORITY (Match Operations) ==========
  'PATCH /api/matches/:id',
  'DELETE /api/matches/:id',
  'POST /api/matches/:matchId/winner',
  'DELETE /api/matches/:matchId/participants/:participantId',

  // ========== 🟡 MEDIUM PRIORITY (Server Management) ==========
  'POST /api/servers',
  'PATCH /api/servers/:id',
  'DELETE /api/servers/:id',
  'POST /api/servers/:serverId/join',
  'POST /api/servers/:serverId/channels',
  'DELETE /api/servers/:serverId/members/:userId',

  // ========== 🟡 MEDIUM PRIORITY (Team Management) ==========
  'POST /api/teams',
  'PATCH /api/teams/:id',
  'PATCH /api/teams/:id/members/:memberId',
  'POST /api/team-members',
  'DELETE /api/team-members/:id',
  'POST /api/team-profiles',
  'PATCH /api/team-profiles/:id',

  // ========== 🟡 MEDIUM PRIORITY (Registration Management) ==========
  'PATCH /api/registrations/:id',

  // ========== 🟡 MEDIUM PRIORITY (Achievements & Content) ==========
  'POST /api/achievements',
  'POST /api/poster-templates',
  'PATCH /api/poster-templates/:id',
  'DELETE /api/poster-templates/:id',
];

// Helper to check if a route should be traced
export function shouldTrace(routeName: string): boolean {
  return IMPORTANT_ROUTES.some(pattern => {
    const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
    return regex.test(routeName);
  });
}

const traceContext = new AsyncLocalStorage<{ traceId: string; spanId: string }>();
const pendingSpans: any[] = [];
const pendingLogs: any[] = [];
const pendingMetrics: any[] = [];

// --- INTERNAL HELPERS ---
const randomId = (len: number) => [...Array(len)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

// --- PUBLIC API ---

// 1. Start a Trace (with optional parent context for distributed tracing)
export function startTrace(name: string, parentContext?: { traceId: string; parentSpanId: string }): string {
  const traceId = parentContext?.traceId || randomId(32);
  const spanId = randomId(16);
  const parentSpanId = parentContext?.parentSpanId;

  traceContext.enterWith({ traceId, spanId });

  pendingSpans.push({
    name, traceId, spanId, parentSpanId, startTime: Date.now(),
    attributes: { 'service.name': SERVICE_NAME, 'tenant_id': TENANT_ID }
  });
  return traceId;
}

// 2. End a Trace
export function endTrace(status: 'OK' | 'ERROR' = 'OK') {
  const store = traceContext.getStore();
  if (!store) return;
  const span = pendingSpans.find(s => s.spanId === store.spanId);
  if (span) { span.endTime = Date.now(); span.status = status; }
}

// 3. Log an Event
export function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, attrs?: Record<string, any>) {
  const store = traceContext.getStore();
  pendingLogs.push({
    message, level, timestamp: Date.now(),
    attributes: { traceId: store?.traceId, spanId: store?.spanId, ...attrs }
  });
}

// 4. Record a Metric
export function metric(name: string, value: number) {
  pendingMetrics.push({ name, value, timestamp: Date.now() });
}

// 5. Flush Data (Send to SkyView)
export async function flush() {
  const headers = { 'Content-Type': 'application/json', 'X-API-Key': API_KEY };
  const send = async (path: string, payload: any) => {
    try { await fetch(`${ENDPOINT}${path}`, { method: 'POST', headers, body: JSON.stringify(payload) }); }
    catch (e) { console.error('[SkyView] Error:', e); }
  };

  // SEND TRACES
  if (pendingSpans.length) {
    await send('/v1/traces', {
      resourceSpans: [{
        resource: { attributes: [{ key: 'tenant_id', value: { stringValue: TENANT_ID } }] }, scopeSpans: [{
          spans: pendingSpans.map(s => ({
            name: s.name, traceId: s.traceId, spanId: s.spanId,
            parentSpanId: s.parentSpanId,
            startTimeUnixNano: s.startTime + '000000', endTimeUnixNano: (s.endTime || Date.now()) + '000000',
            status: { code: s.status === 'ERROR' ? 2 : 1 }, attributes: []
          }))
        }]
      }]
    });
  }

  // SEND LOGS
  if (pendingLogs.length) {
    await send('/v1/logs', {
      resourceLogs: [{
        resource: { attributes: [{ key: 'tenant_id', value: { stringValue: TENANT_ID } }] }, scopeLogs: [{
          logRecords: pendingLogs.map(l => ({
            timeUnixNano: l.timestamp + '000000', severityText: l.level, severityNumber: l.level === 'ERROR' ? 17 : l.level === 'WARN' ? 13 : 9,
            body: { stringValue: l.message },
            attributes: Object.entries(l.attributes || {}).map(([key, value]) => ({
              key,
              value: { stringValue: String(value) }
            }))
          }))
        }]
      }]
    });
  }

  // SEND METRICS
  if (pendingMetrics.length) {
    await send('/v1/metrics', {
      resourceMetrics: [{
        resource: { attributes: [{ key: 'tenant_id', value: { stringValue: TENANT_ID } }] }, scopeMetrics: [{
          metrics: pendingMetrics.map(m => ({
            name: m.name, gauge: { dataPoints: [{ timeUnixNano: m.timestamp + '000000', asDouble: m.value }] }
          }))
        }]
      }]
    });
  }

  pendingSpans.length = 0; pendingLogs.length = 0; pendingMetrics.length = 0;
}
