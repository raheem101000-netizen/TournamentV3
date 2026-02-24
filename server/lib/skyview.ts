
import { AsyncLocalStorage } from 'async_hooks';

// --- CONFIGURATION ---
const ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://46.62.229.59:4319';
const API_KEY = process.env.SKYVIEW_API_KEY || 'sk_live_Gu_Zs_rpwYdRXl-WB1fTg62RF5k99HzR';
const SERVICE_NAME = 'tourni-app';
const TENANT_ID = 'Tourni1010'; // <--- 🔴 REQUIRED FOR SKYVIEW
const FLUSH_TIMEOUT_MS = Number(process.env.SKYVIEW_FLUSH_TIMEOUT_MS || 400);

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
export function startTrace(
  name: string,
  parentContext?: { traceId: string; parentSpanId: string },
  userContext?: { userId?: string; username?: string }
): string {
  const traceId = parentContext?.traceId || randomId(32);
  const spanId = randomId(16);
  const parentSpanId = parentContext?.parentSpanId;

  traceContext.enterWith({ traceId, spanId });

  pendingSpans.push({
    name, traceId, spanId, parentSpanId, startTime: Date.now(),
    attributes: {
      'service.name': SERVICE_NAME,
      'tenant_id': TENANT_ID,
      'user.id': userContext?.userId || 'anonymous',
      'user.name': userContext?.username || 'unknown'
    }
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
// 5. Flush Data (Send to SkyView)
export async function flush() {
  // Snapshot and clear immediately to prevent race conditions
  const spansToSend = [...pendingSpans];
  const logsToSend = [...pendingLogs];
  const metricsToSend = [...pendingMetrics];

  pendingSpans.length = 0;
  pendingLogs.length = 0;
  pendingMetrics.length = 0;

  if (spansToSend.length === 0 && logsToSend.length === 0 && metricsToSend.length === 0) {
    return;
  }

  const headers = { 'Content-Type': 'application/json', 'X-API-Key': API_KEY };
  const send = async (path: string, payload: any) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FLUSH_TIMEOUT_MS);

    try {
      const res = await fetch(`${ENDPOINT}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`[SkyView] API Error ${res.status}: ${text}`);
      }
    }
    catch (e: any) {
      if (e?.name === 'AbortError') {
        console.warn(`[SkyView] Request timeout after ${FLUSH_TIMEOUT_MS}ms: ${path}`);
      } else {
        console.error('[SkyView] Network Error:', e);
      }
    } finally {
      clearTimeout(timeout);
    }
  };

  // SEND TRACES
  if (spansToSend.length) {
    await send('/v1/traces', {
      resourceSpans: [{
        resource: { attributes: [{ key: 'tenant_id', value: { stringValue: TENANT_ID } }] }, scopeSpans: [{
          spans: spansToSend.map(s => ({
            name: s.name, traceId: s.traceId, spanId: s.spanId,
            parentSpanId: s.parentSpanId,
            startTimeUnixNano: s.startTime + '000000', endTimeUnixNano: (s.endTime || Date.now()) + '000000',
            status: { code: s.status === 'ERROR' ? 2 : 1 },
            attributes: [
              { key: 'user.id', value: { stringValue: s.attributes['user.id'] || 'anonymous' } },
              { key: 'user.name', value: { stringValue: s.attributes['user.name'] || 'unknown' } },
              { key: 'service.name', value: { stringValue: s.attributes['service.name'] || SERVICE_NAME } }
            ]
          }))
        }]
      }]
    });
  }

  // SEND LOGS
  if (logsToSend.length) {
    await send('/v1/logs', {
      resourceLogs: [{
        resource: { attributes: [{ key: 'tenant_id', value: { stringValue: TENANT_ID } }] }, scopeLogs: [{
          logRecords: logsToSend.map(l => ({
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
  if (metricsToSend.length) {
    await send('/v1/metrics', {
      resourceMetrics: [{
        resource: { attributes: [{ key: 'tenant_id', value: { stringValue: TENANT_ID } }] }, scopeMetrics: [{
          metrics: metricsToSend.map(m => ({
            name: m.name, gauge: { dataPoints: [{ timeUnixNano: m.timestamp + '000000', asDouble: m.value }] }
          }))
        }]
      }]
    });
  }
}

// --- GLOBAL ERROR TRACKING MIDDLEWARE ---

/**
 * Express middleware to automatically log all errors to SkyView
 * Add this AFTER all routes: app.use(skyviewErrorHandler)
 */
export function skyviewErrorHandler(err: any, req: any, res: any, next: any) {
  const routeName = `${req.method} ${req.originalUrl}`;

  // Start a trace for this error if not already in one
  startTrace(`ERROR: ${routeName}`);

  log('ERROR', `Unhandled error: ${err.message}`, {
    endpoint: routeName,
    userId: req.session?.userId || 'anonymous',
    errorName: err.name,
    errorStack: err.stack?.substring(0, 500), // Truncate stack
    statusCode: res.statusCode || 500,
    requestBody: JSON.stringify(req.body || {}).substring(0, 200),
    userAgent: req.headers?.['user-agent']?.substring(0, 100)
  });

  endTrace('ERROR');

  // Flush async - don't block the response
  flush().catch(console.error);

  // Pass to next error handler
  next(err);
}

/**
 * Express middleware to track 4xx/5xx responses
 * Add this BEFORE routes: app.use(skyviewResponseTracker)
 */
export function skyviewResponseTracker(req: any, res: any, next: any) {
  const originalSend = res.send;

  res.send = function (body: any) {
    const routeName = `${req.method} ${req.originalUrl}`;

    // Track 4xx and 5xx responses
    if (res.statusCode >= 400) {
      const level = res.statusCode >= 500 ? 'ERROR' : 'WARN';

      log(level, `HTTP ${res.statusCode}: ${routeName}`, {
        endpoint: routeName,
        statusCode: res.statusCode,
        userId: req.session?.userId || 'anonymous',
        responseBody: typeof body === 'string' ? body.substring(0, 200) : JSON.stringify(body).substring(0, 200),
        requestBody: JSON.stringify(req.body || {}).substring(0, 200)
      });

      // Flush for errors
      flush().catch(console.error);
    }

    return originalSend.call(this, body);
  };

  next();
}

/**
 * Log an error directly to SkyView (use for catch blocks)
 */
export function logError(error: Error, context?: Record<string, any>) {
  log('ERROR', error.message, {
    errorName: error.name,
    errorStack: error.stack?.substring(0, 500),
    ...context
  });
  flush().catch(console.error);
}

/**
 * Initialize global error handlers (call in server startup)
 */
export function initGlobalErrorTracking() {
  // Catch unhandled promise rejections
  process.on('unhandledRejection', (reason: any) => {
    log('ERROR', `Unhandled Promise Rejection: ${reason?.message || reason}`, {
      type: 'unhandledRejection',
      stack: reason?.stack?.substring(0, 500)
    });
    flush().catch(console.error);
  });

  // Catch uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    log('ERROR', `Uncaught Exception: ${error.message}`, {
      type: 'uncaughtException',
      errorName: error.name,
      stack: error.stack?.substring(0, 500)
    });
    flush().catch(console.error);
  });

  console.log('🔭 SkyView Global Error Tracking: ENABLED');
}
