
import { AsyncLocalStorage } from 'async_hooks';

// --- CONFIGURATION ---
const ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://46.62.229.59:4318';
const API_KEY = process.env.SKYVIEW_API_KEY || 'demo123';
const SERVICE_NAME = 'tourni1010-backend';
const TENANT_ID = 'Tourni1010'; // <--- 🔴 REQUIRED FOR SKYVIEW

const traceContext = new AsyncLocalStorage<{ traceId: string; spanId: string }>();
const pendingSpans: any[] = [];
const pendingLogs: any[] = [];
const pendingMetrics: any[] = [];

// --- INTERNAL HELPERS ---
const randomId = (len: number) => [...Array(len)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

// --- PUBLIC API ---

// 1. Start a Trace
export function startTrace(name: string): string {
  const traceId = randomId(32);
  const spanId = randomId(16);
  traceContext.enterWith({ traceId, spanId });

  pendingSpans.push({
    name, traceId, spanId, startTime: Date.now(),
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
