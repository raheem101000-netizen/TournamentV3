
import { AsyncLocalStorage } from 'async_hooks';

// CONFIGURATION
const ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://46.62.229.59:4318';
const API_KEY = process.env.SKYVIEW_API_KEY || 'demo123';
const SERVICE_NAME = 'tourni1010-backend';
const TENANT_ID = 'touni1010'; // 🔴 CRITICAL

interface Span {
  name: string;
  traceId: string;
  spanId: string;
  startTime: number;
  endTime?: number;
  attributes?: Record<string, string | number>;
  status?: 'OK' | 'ERROR';
}

interface LogEntry {
  message: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  timestamp?: number;
  attributes?: Record<string, string | number>;
}

const traceContext = new AsyncLocalStorage<{ traceId: string; spanId: string }>();
const pendingSpans: Span[] = [];
const pendingLogs: LogEntry[] = [];
const pendingMetrics: { name: string; value: number; timestamp: number }[] = [];

// HELPERS
const randomId = (len: number) => [...Array(len)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

// --- PUBLIC API ---

export function startTrace(name: string): string {
  const traceId = randomId(32);
  const spanId = randomId(16);
  traceContext.enterWith({ traceId, spanId });

  pendingSpans.push({
    name,
    traceId,
    spanId,
    startTime: Date.now(),
    attributes: { 'service.name': SERVICE_NAME, 'tenant_id': TENANT_ID }
  });
  return traceId;
}

export function endTrace(status: 'OK' | 'ERROR' = 'OK') {
  const store = traceContext.getStore();
  if (!store) return;
  const span = pendingSpans.find(s => s.spanId === store.spanId);
  if (span) { span.endTime = Date.now(); span.status = status; }
}

export function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, attrs?: Record<string, any>) {
  const store = traceContext.getStore();
  pendingLogs.push({
    message,
    level,
    timestamp: Date.now(),
    attributes: { traceId: store?.traceId || '', spanId: store?.spanId || '', ...attrs }
  });
}

export function metric(name: string, value: number) {
  pendingMetrics.push({ name, value, timestamp: Date.now() });
}

// Debug environment
console.log(`[SkyView Init] Endpoint: ${ENDPOINT ? 'Set' : 'Missing'}, Key: ${API_KEY ? 'Set' : 'Missing'}`);

export async function flush() {
  if (!ENDPOINT || !API_KEY) {
    console.warn('[SkyView] Missing configuration, skipping flush');
    return;
  }

  const headers = { 'Content-Type': 'application/json', 'X-API-Key': API_KEY };

  const send = async (path: string, payload: any, type: string) => {
    try {
      console.log(`[SkyView] Sending ${type}...`);
      const res = await fetch(`${ENDPOINT}${path}`, { method: 'POST', headers, body: JSON.stringify(payload) });
      if (!res.ok) {
        const text = await res.text();
        console.error(`[SkyView] ${type} Failed: ${res.status} ${res.statusText} - ${text}`);
      } else {
        console.log(`[SkyView] ${type} Sent Successfully: ${res.status}`);
      }
    }
    catch (e: any) { console.error(`[SkyView] ${type} Network Error:`, e.message); }
  };

  // TRACES
  if (pendingSpans.length) {
    await send('/v1/traces', {
      resourceSpans: [{
        resource: { attributes: [{ key: 'tenant_id', value: { stringValue: TENANT_ID } }] },
        scopeSpans: [{
          spans: pendingSpans.map(s => ({
            name: s.name,
            traceId: s.traceId,
            spanId: s.spanId,
            startTimeUnixNano: String(s.startTime * 1_000_000),
            endTimeUnixNano: String((s.endTime || Date.now()) * 1_000_000),
            status: { code: s.status === 'ERROR' ? 2 : 1 },
            attributes: s.attributes ? Object.keys(s.attributes).map(k => ({
              key: k,
              value: { stringValue: String(s.attributes![k]) }
            })) : []
          }))
        }]
      }]
    }, 'Traces');
  }

  // LOGS
  if (pendingLogs.length) {
    const logsPayload = {
      resourceLogs: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: SERVICE_NAME } },
            { key: 'tenant_id', value: { stringValue: TENANT_ID } }
          ]
        },
        scopeLogs: [{
          logRecords: pendingLogs.map(l => {
            // OpenTelemetry severity numbers: INFO=9, WARN=13, ERROR=17
            const severityNumber = l.level === 'ERROR' ? 17 : l.level === 'WARN' ? 13 : 9;
            return {
              timeUnixNano: String((l.timestamp || Date.now()) * 1_000_000),
              severityText: l.level,
              severityNumber: severityNumber,
              body: { stringValue: l.message },
              attributes: Object.entries(l.attributes || {}).map(([k, v]) => ({
                key: k,
                value: typeof v === 'number' ? { intValue: v } : { stringValue: String(v) }
              }))
            };
          })
        }]
      }]
    };
    await send('/v1/logs', logsPayload, 'Logs');
  }

  // METRICS
  if (pendingMetrics.length) {
    const metricsPayload = {
      resourceMetrics: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: SERVICE_NAME } },
            { key: 'tenant_id', value: { stringValue: TENANT_ID } }
          ]
        },
        scopeMetrics: [{
          metrics: pendingMetrics.map(m => ({
            name: m.name,
            gauge: {
              dataPoints: [{
                timeUnixNano: String(m.timestamp * 1_000_000),
                asDouble: m.value,
              }]
            }
          }))
        }]
      }]
    };
    await send('/v1/metrics', metricsPayload, 'Metrics');
  }

  pendingSpans.length = 0;
  pendingLogs.length = 0;
  pendingMetrics.length = 0;
}
