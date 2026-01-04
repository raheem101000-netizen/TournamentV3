# SkyView OpenTelemetry Implementation 🔭

This project uses **SkyView** for full-stack observability, implementing OpenTelemetry traces, logs, and metrics across key API endpoints.

## 🛠 Configuration
The SkyView client is implemented in `server/lib/skyview.ts` and handles:
- **Trace Context**: Manages `traceId` propagation using `AsyncLocalStorage`.
- **Batching**: Collects logs and metrics during a request.
- **Flushing**: Sends telemetry data to the SkyView via OTLP over HTTP.

### Configuration
The SkyView client (`server/lib/skyview.ts`) is pre-configured with:
- **Service Name**: `tourni1010-backend`
- **Tenant ID**: `Tourni1010` (Hardcoded for correlation)

### Environment Variables
Required in your `.env` or Vercel config:
- `OTEL_EXPORTER_OTLP_ENDPOINT`: Your SkyView endpoint URL.
- `SKYVIEW_API_KEY`: Authentication key for SkyView.

## 📊 Instrumentation Overview

### Key Instrumented Endpoints
The following API routes in `server/routes.ts` are fully instrumented:

| Method | Endpoint | Description | Telemetry |
|--------|----------|-------------|-----------|
| `POST` | `/api/auth/login` | User login | Traces, Logs, Metrics (`logins_total`, `login_failures_total`, `login_duration_ms`) |
| `POST` | `/api/auth/register` | User registration | Traces, Logs, Metrics (`registrations_total`) |
| `GET` | `/api/tournaments` | List tournaments | Traces, Logs (count) |
| `POST` | `/api/tournaments` | Create tournament | Traces, Logs, Metrics (`tournaments_created_total`) |
| `PATCH` | `/api/matches/:id` | Update match score | Traces, Logs, Metrics (`matches_updated_total`) |
| `POST` | `/api/matches/:id/winner` | Set match winner | Traces, Logs, Metrics (`matches_completed_total`) |

## 📈 Metrics Reference

| Metric Name | Type | Description |
|-------------|------|-------------|
| `logins_total` | Counter | Total number of successful logins |
| `login_failures_total` | Counter | Total number of failed login attempts |
| `login_duration_ms` | Histogram/Gauge | Time taken for login process in milliseconds |
| `registrations_total` | Counter | Total number of new user registrations |
| `tournaments_created_total` | Counter | Total number of tournaments created |
| `matches_updated_total` | Counter | Total number of match score updates |
| `matches_completed_total` | Counter | Total number of matches marked as completed (winner selected) |

## 📝 Logging Standards

Logs are automatically correlated with the current Trace ID.

| Level | Severity | Use Case | SkyView Display |
|-------|----------|----------|-----------------|
| **INFO** | 9 | Normal operations (e.g., "Login successful") | 🔵 Blue Badge |
| **WARN** | 13 | Business logic issues (e.g., "Invalid password", "Email exists") | 🟡 Yellow Badge |
| **ERROR** | 17 | System failures / Exceptions | 🔴 Red Badge + **AI Debug** |

## 💻 Code Usage Example

To instrument a new endpoint, follow this pattern:

```typescript
import { startTrace, endTrace, log, metric, flush } from './lib/skyview.js';

app.post("/api/new-feature", async (req, res) => {
  // 1. Start Trace
  startTrace('POST /api/new-feature'); 
  const startTime = Date.now();

  try {
    // 2. Log Info
    log('INFO', 'Starting operation', { userId: req.session.userId });

    // ... business logic ...

    if (!valid) {
      // 3. Log Warning
      log('WARN', 'Validation failed', { reason: 'invalid_input' });
      endTrace('ERROR'); // Mark trace as error
      await flush();     // Send data
      return res.status(400).json({ error: "Invalid" });
    }

    // 4. Log Success & Metric
    log('INFO', 'Operation successful');
    metric('feature_usage_total', 1);
    
    // 5. End Trace & Flush
    endTrace('OK');
    await flush();
    res.json({ success: true });

  } catch (error) {
    // 6. Log Error (triggers AI Debug)
    log('ERROR', 'System failure', { error: error.message });
    endTrace('ERROR');
    await flush();
    res.status(500).json({ error: "Internal Server Error" });
  }
});
```
