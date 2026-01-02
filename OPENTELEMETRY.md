# SkyView OpenTelemetry Integration

This document describes the observability setup for TournamentV3, integrating with SkyView/ObseraCloud.

## Overview

TournamentV3 sends **traces** and **metrics** to SkyView for monitoring:

| Component | Service Name | What it tracks |
|-----------|--------------|----------------|
| Backend | `tournamentv3-backend` | API requests, database queries, Express middleware |
| Frontend | `tournamentv3-frontend` | Fetch calls, page interactions |

**SkyView Endpoint**: `http://46.62.229.59:4319`

---

## Files Created

### Backend: `server/instrumentation.ts`

Initializes OpenTelemetry SDK with:
- **Trace Exporter** → sends spans to `/v1/traces`
- **Metric Exporter** → sends metrics to `/v1/metrics` every 30s
- **Auto-instrumentation** → automatically traces Express, HTTP, database calls

```typescript
// Key configuration
traceExporter: new OTLPTraceExporter({
  url: `${OTEL_ENDPOINT}/v1/traces`,
  headers: { 'X-API-Key': API_KEY },
}),
```

### Backend: `server/index.ts`

Added import at top of file:
```typescript
import './instrumentation.js';  // Must be first!
```

### Frontend: `client/src/tracing.ts`

Lazy-loaded OpenTelemetry for browser:
- Uses **dynamic imports** to avoid Rollup build issues
- Instruments **fetch** calls automatically
- Exports `initTracing()` function

### Frontend: `client/src/main.tsx`

Calls tracing after React loads:
```typescript
import('./tracing').then(({ initTracing }) => initTracing());
```

---

## Environment Variables

### Backend (Server)
```env
SKYVIEW_API_KEY=TIZmGdT-VDtRe60pckQTX5_NuMes9OhcMDyaOJhh0wA
OTEL_EXPORTER_OTLP_ENDPOINT=http://46.62.229.59:4319
```

### Frontend (Vite - baked at build time)
```env
VITE_SKYVIEW_API_KEY=TIZmGdT-VDtRe60pckQTX5_NuMes9OhcMDyaOJhh0wA
VITE_OTEL_ENDPOINT=http://46.62.229.59:4319/v1/traces
```

> ⚠️ **Vercel**: Add these in Dashboard → Settings → Environment Variables

---

## Dependencies Installed

### Backend (root package.json)
```
@opentelemetry/api
@opentelemetry/sdk-node
@opentelemetry/auto-instrumentations-node
@opentelemetry/exporter-trace-otlp-proto
@opentelemetry/exporter-metrics-otlp-proto
@opentelemetry/exporter-logs-otlp-proto
@opentelemetry/resources
@opentelemetry/sdk-metrics
```

### Frontend (client)
```
@opentelemetry/sdk-trace-web
@opentelemetry/sdk-trace-base
@opentelemetry/exporter-trace-otlp-http
@opentelemetry/context-zone
@opentelemetry/instrumentation-fetch
@opentelemetry/instrumentation
@opentelemetry/resources
```

---

## What Gets Traced

### Backend Traces
| Type | Example |
|------|---------|
| HTTP requests | `GET /api/tournaments` |
| Database queries | `SELECT * FROM users` |
| Express middleware | `bodyParser`, `cors` |

### Frontend Traces
| Type | Example |
|------|---------|
| Fetch calls | `fetch('/api/auth/me')` |
| XHR requests | Any AJAX call |

---

## Verifying Integration

1. **Console logs** when running:
   - `✅ OpenTelemetry instrumentation started` (backend)
   - `✅ Frontend OpenTelemetry tracing started` (frontend)

2. **SkyView Dashboard** at `http://46.62.229.59/`:
   - Look for `tournamentv3-backend` service
   - Look for `tournamentv3-frontend` service

3. **Perform actions** in the app (login, view tournaments) to generate traces

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing env vars" warning | Add `SKYVIEW_API_KEY` and `OTEL_*` to Vercel env vars |
| No traces in SkyView | Check if port 4319 is open on the SkyView server |
| Frontend traces missing | Ensure `VITE_*` vars are set, then redeploy |
| Build fails | Dynamic imports should fix Rollup issues |
