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
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `https://46.62.229.59:4319` |

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
