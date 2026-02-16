# Testing

## Overview

The project uses **k6** for load/performance testing. There is **no unit testing framework** (no Jest, Vitest, or similar) configured for client or server code.

## Load Testing (k6)

### Structure

```
k6-tests/
├── README.md            # Setup and usage documentation
├── SETUP.md             # Installation instructions
├── config/
│   └── thresholds.js    # Performance threshold definitions
├── scenarios/
│   ├── smoke-test.js    # Minimal load (sanity check)
│   ├── load-test.js     # Normal expected load
│   ├── stress-test.js   # Beyond normal capacity
│   └── spike-test.js    # Sudden traffic spikes
├── scripts/             # Helper scripts
└── utils/
    └── helpers.js       # Shared test utilities
```

### Test Scenarios

| Scenario | Script | Purpose |
|----------|--------|---------|
| Smoke | `npm run test:k6:smoke` | Quick sanity check with minimal load |
| Load | `npm run test:k6:load` | Normal expected user load |
| Stress | `npm run test:k6:stress` | Push beyond normal capacity |
| Spike | `npm run test:k6:spike` | Sudden traffic burst simulation |
| All | `npm run test:k6:all` | Run all scenarios sequentially |

### Rate Limiter Adjustment

Rate limiters in `server/routes.ts` have been significantly increased for load testing:
- General: 5,000 → 100,000 requests/min
- Auth: 500 → 50,000 requests/15min
- Write: 1,000 → 50,000 requests/min

These values are marked with `// INCREASED for Load Testing` comments.

## Unit Testing

**Not configured.** No test runner, test files, or testing utilities exist in the project source code. The glob pattern `**/*.test.{ts,tsx}` returns only results from `node_modules/`.

### Notable Gaps

- No client component tests
- No server route/handler tests
- No storage/data layer tests
- No schema validation tests
- No integration tests (API endpoint testing)
- No E2E tests (Playwright, Cypress, etc.)

## Validation

Runtime validation is handled by **Zod** schemas generated from the Drizzle schema (`drizzle-zod`):
- Insert schemas for all entities (`insertTournamentSchema`, `insertTeamSchema`, etc.)
- Used in API routes for request body validation
- Shared between client and server via `shared/schema.ts`

## Observability as Testing

The project uses **SkyView + OpenTelemetry** for production observability:
- Server traces via `server/lib/skyview.ts`
- Client fetch instrumentation via OpenTelemetry
- Test script: `scripts/test-skyview.ts`
