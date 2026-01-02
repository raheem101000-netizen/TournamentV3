# SkyView Integration (Lightweight)

This document describes the observability setup for TournamentV3 using a custom lightweight client for Vercel/Serverless compatibility.

## Overview

We use a custom manual telemetry client (`server/lib/skyview.ts`) instead of the official OpenTelemetry SDK. This avoids bundle size limits and compatibility issues with Vercel/Rollup.

**SkyView Endpoint**: `https://46.62.229.59:4319`

---

## Files

### `server/lib/skyview.ts`
A lightweight client that:
- Uses `fetch` to send data directly to SkyView OTLP HTTP endpoints
- Manages trace context using `AsyncLocalStorage`
- Buffers traces/logs and flushes them at the end of the request
- **No external dependencies** (uses native node fetch/async_hooks)

### `server/routes.ts`
Includes global middleware that:
1. Starts a trace for every incoming request (`Request Started`)
2. Log request details (method, url, user-agent)
3. Captures response finish event
4. Ends the trace (`Request Completed` with status code)
5. **Flushes** telemetry to SkyView before response closes

---

## Environment Variables

Ensure these are set in Vercel:

| Variable | Value |
|----------|-------|
| `SKYVIEW_API_KEY` | `pjDYo7sDwWF26nacUaPvfYQd4xTNGQHb-H633H04he0` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://46.62.229.59:80` |

## Usage Guide

You can instrument any API route or function using the helpers exported from `server/lib/skyview.ts`.

### Basic Route Tracing

```typescript
import { startTrace, endTrace, log, metric, flush } from '../lib/skyview';

export default async function handler(req, res) {
  // 1. Start Trace
  startTrace(`${req.method} ${req.url}`);
  const startTime = Date.now();

  try {
    // 2. Log Context
    log('INFO', 'Processing request', { path: req.url, userId: req.session?.userId });
    
    // ... business logic ...
    
    // 3. Track Custom Metrics
    metric('db_query_count', 1);
    
    endTrace('OK');
    res.json({ success: true });
  } catch (error) {
    // 4. Log Errors
    log('ERROR', 'Request failed', { error: error.message });
    endTrace('ERROR');
    res.status(500).json({ error: 'Internal Error' });
  } finally {
    // 5. CRITICAL: Flush before Vercel freezes the generic function
    metric('response_time_ms', Date.now() - startTime);
    await flush(); 
  }
}
```

### Custom Metrics

Track business KPIs directly in your code:

```typescript
// Count events
metric('new_user_signups', 1);
metric('match_created', 1);

// Track values/money
metric('order_value', 49.99);

// Measure durations
const start = Date.now();
await db.query(...);
metric('db_query_duration_ms', Date.now() - start);
```

### Structured Logging

Logs are automatically correlated with the current trace:

```typescript
log('INFO', 'User logged in', { userId: '123', plan: 'pro' });
log('WARN', 'Rate limit approaching', { remaining: 5 });
log('ERROR', 'Payment gateway timeout', { gateway: 'stripe' });
```

---

## Verification

1. **Deploy** to Vercel
2. **Perform actions** (Log in, view tournaments)
3. **Check SkyView Dashboard**:
   - Service: `tournamentv3-backend`
   - You should see traces for `GET /api/tournaments`, `POST /api/auth/login`, etc.

## Troubleshooting

- **No traces?** Check Vercel logs. The client logs errors to console: `SkyView Trace Error: ...`
- **500 Errors?** The manual client is wrapped in try/catch blocks so it shouldn't crash the app.
