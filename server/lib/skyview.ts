// server/lib/skyview.ts - Lightweight SkyView client for Vercel serverless
import { AsyncLocalStorage } from 'async_hooks';

const ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '';
const API_KEY = process.env.SKYVIEW_API_KEY || '';

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

// Generate random hex ID
const randomId = (len: number) =>
  [...Array(len)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

// Trace context storage
const traceContext = new AsyncLocalStorage<{ traceId: string; spanId: string }>();

const pendingSpans: Span[] = [];
const pendingLogs: LogEntry[] = [];
const pendingMetrics: { name: string; value: number; timestamp: number }[] = [];

export function startTrace(name: string): string {
  const currentTraceId = randomId(32);
  const currentSpanId = randomId(16);

  // Store context for this request
  traceContext.enterWith({ traceId: currentTraceId, spanId: currentSpanId });

  pendingSpans.push({
    name,
    traceId: currentTraceId,
    spanId: currentSpanId,
    startTime: Date.now(),
    attributes: { 'service.name': 'tournamentv3-backend' },
  });

  return currentTraceId;
}

export function endTrace(status: 'OK' | 'ERROR' = 'OK') {
  const store = traceContext.getStore();
  if (!store) return;

  const span = pendingSpans.find(s => s.spanId === store.spanId);
  if (span) {
    span.endTime = Date.now();
    span.status = status;
  }
}

export function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, attrs?: Record<string, any>) {
  const store = traceContext.getStore();
  pendingLogs.push({
    message,
    level,
    timestamp: Date.now(),
    attributes: {
      traceId: store?.traceId || '',
      ...attrs
    },
  });
}

export function metric(name: string, value: number) {
  pendingMetrics.push({ name, value, timestamp: Date.now() });
}

export async function flush() {
  if (!ENDPOINT || !API_KEY) return;

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  };

  // Send traces
  if (pendingSpans.length > 0) {
    const tracePayload = {
      resourceSpans: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'tournamentv3-backend' } },
            { key: 'service.version', value: { stringValue: '3.0.0' } },
          ]
        },
        scopeSpans: [{
          spans: pendingSpans.map(s => ({
            name: s.name,
            traceId: s.traceId,
            spanId: s.spanId,
            startTimeUnixNano: String(s.startTime * 1_000_000),
            endTimeUnixNano: String((s.endTime || Date.now()) * 1_000_000),
            status: { code: s.status === 'ERROR' ? 2 : 1 },
          }))
        }]
      }]
    };

    await fetch(`${ENDPOINT}/v1/traces`, {
      method: 'POST',
      headers,
      body: JSON.stringify(tracePayload),
    }).catch(err => console.error('SkyView Trace Error:', err));
  }

  // Send logs
  if (pendingLogs.length > 0) {
    const logsPayload = {
      resourceLogs: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'tournamentv3-backend' } },
          ]
        },
        scopeLogs: [{
          logRecords: pendingLogs.map(l => ({
            timeUnixNano: String((l.timestamp || Date.now()) * 1_000_000),
            severityText: l.level,
            body: { stringValue: l.message },
            attributes: Object.entries(l.attributes || {}).map(([k, v]) => ({
              key: k,
              value: typeof v === 'number' ? { intValue: v } : { stringValue: String(v) }
            }))
          }))
        }]
      }]
    };

    await fetch(`${ENDPOINT}/v1/logs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(logsPayload),
    }).catch(err => console.error('SkyView Log Error:', err));
  }

  // Send metrics
  if (pendingMetrics.length > 0) {
    const metricsPayload = {
      resourceMetrics: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'tournamentv3-backend' } },
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

    await fetch(`${ENDPOINT}/v1/metrics`, {
      method: 'POST',
      headers,
      body: JSON.stringify(metricsPayload),
    }).catch(err => console.error('SkyView Metric Error:', err));
  }

  // Clear all - careful with concurrency here in a real app, 
  // but for Vercel lambda this array is per-instance and often one request at a time.
  // In a real sustained server, we'd filter by traceId or just clear what we sent.
  // For simplicity and matching the user snippet, we clear.
  pendingSpans.length = 0;
  pendingLogs.length = 0;
  pendingMetrics.length = 0;
}
