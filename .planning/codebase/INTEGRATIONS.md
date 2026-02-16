# External Integrations

## Database

### PostgreSQL via Neon Serverless
- **Driver:** `@neondatabase/serverless` with WebSocket transport
- **ORM:** Drizzle ORM (`server/db.ts`)
- **Connection:** Pool-based, max 20 connections, min 0 (serverless-optimized)
- **Schema:** `shared/schema.ts` (shared between client and server)
- **Migrations:** `migrations/` directory, managed by drizzle-kit
- **Session storage:** `connect-pg-simple` stores sessions in PostgreSQL

## Email

### Resend
- **Client:** `server/email.ts`
- **Functions:** `sendVerificationEmail()`, `sendPasswordResetEmail()`
- **Config:** `RESEND_API_KEY` env var (with Replit connector fallback)
- **From address:** Configurable via `RESEND_FROM_EMAIL`

## File Storage

### Vercel Blob
- **Package:** `@vercel/blob` 2.0.0
- **Usage:** Primary cloud file storage
- **Config:** `BLOB_READ_WRITE_TOKEN` env var

### Google Cloud Storage
- **Package:** `@google-cloud/storage` 7.17.3
- **Auth:** `google-auth-library` 10.5.0
- **Usage:** Alternative/additional object storage

### Object Storage Service
- **Custom layer:** `server/objectStorage.ts` — abstraction over storage backends
- **ACL:** `server/objectAcl.ts` — `ObjectPermission` access control
- **Upload:** Multer with memory storage, 5MB limit
- **Migration script:** `server/migrate-images-to-blob.ts`

## Authentication

### Custom Auth (Passport.js)
- **Strategy:** Local (username/password via `passport-local`)
- **Password hashing:** bcrypt with salt rounds
- **Sessions:** Express sessions persisted to PostgreSQL
- **Features:**
  - Email verification flow
  - Password reset flow (with email)
  - Rate-limited auth endpoints (separate limiter)

## Observability

### SkyView + OpenTelemetry
- **Server:** `server/lib/skyview.ts` — `startTrace()`, `endTrace()`, `log()`, `metric()`, `flush()`
- **Client:** OpenTelemetry SDK with:
  - `@opentelemetry/sdk-trace-web` — Browser tracing
  - `@opentelemetry/instrumentation-fetch` — Auto-instrument fetch calls
  - `@opentelemetry/exporter-trace-otlp-http` — Export traces via OTLP
  - `@opentelemetry/context-zone` — Zone.js context propagation

## Real-time Communication

### WebSocket
- **Library:** `ws` 8.18.0
- **Server:** WebSocket server created in `server/routes.ts`
- **Endpoints:**
  - `/ws/chat` — Match/tournament chat
  - `/ws/channel` — Server channel messaging
- **Auth:** Cookie-based session validation on WebSocket upgrade

## Deployment

### Vercel
- **Config:** `vercel.json`
- **Build:** Vite (frontend) + esbuild (backend)
- **Output:** `dist/` directory

## Rate Limiting

Three-tier rate limiting via `express-rate-limit`:

| Tier | Window | Max Requests | Applied To |
|------|--------|-------------|------------|
| General | 1 min | 100,000* | All routes |
| Auth | 15 min | 50,000* | Auth endpoints |
| Write | 1 min | 50,000* | Mutation endpoints |

*Values increased for load testing (original values in comments)

## Image Processing

### Sharp
- **Package:** `sharp` 0.34.5
- **Usage:** Server-side image processing/optimization for uploads
