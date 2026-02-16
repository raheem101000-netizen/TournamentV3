# Technology Stack

## Languages & Runtime

| Technology | Version | Usage |
|-----------|---------|-------|
| TypeScript | 5.6.3 | Full-stack (client + server + shared) |
| Node.js | (ESM modules) | Server runtime |
| SQL | PostgreSQL | Database |

## Frameworks & Libraries

### Backend
- **Express** 4.21.2 — HTTP server (`server/app.ts`, `server/routes.ts`)
- **Drizzle ORM** 0.39.1 — Database ORM with Neon serverless driver (`server/db.ts`)
- **WebSocket (ws)** 8.18.0 — Real-time communication (`server/routes.ts`)
- **Passport** 0.7.0 + passport-local — Authentication
- **express-session** 1.18.1 + connect-pg-simple — Session management (PostgreSQL-backed)
- **express-rate-limit** 8.2.1 — Three-tier rate limiting (general/auth/write)
- **multer** 2.0.2 — File upload handling (memory storage)
- **bcrypt** 6.0.0 — Password hashing
- **sharp** 0.34.5 — Image processing
- **Resend** 4.0.0 — Email delivery (`server/email.ts`)
- **zod** 3.24.2 — Schema validation (with drizzle-zod integration)

### Frontend
- **React** 18.3.1 — UI framework
- **Vite** 5.4.20 — Build tool + dev server (`vite.config.ts`)
- **Tailwind CSS** 3.4.17 — Utility-first CSS (with tailwindcss-animate)
- **Radix UI** — Extensive component primitives (dialog, dropdown, tabs, accordion, etc.)
- **TanStack React Query** 5.60.5 — Server state management
- **wouter** 3.3.5 — Client-side routing
- **Framer Motion** 11.13.1 — Animations
- **React Hook Form** 7.55.0 + @hookform/resolvers — Form management
- **Recharts** 2.15.2 — Data visualization / charts
- **Lucide React** 0.453.0 — Icon library
- **shadcn/ui** — UI component system (via `components.json`)
- **cmdk** 1.1.1 — Command palette
- **Embla Carousel** 8.6.0 — Carousel component
- **Uppy** — File upload UI (dashboard, drag-drop, progress bar)
- **next-themes** 0.4.6 — Dark/light theme toggle

### Observability
- **OpenTelemetry** — Client-side tracing (context-zone, fetch instrumentation, OTLP export)
- **SkyView** — Custom observability wrapper (`server/lib/skyview.ts`)

### Mobile
- **React Native** — Mobile app (`mobile/` directory, separate package.json)
- **Capacitor** — iOS bridge (`ios/` directory)

## Build & Tooling

| Tool | Purpose |
|------|---------|
| Vite | Frontend bundling + HMR |
| esbuild | Server bundling (`npm run build`) |
| tsx | Development server runner |
| drizzle-kit | Database migrations (`npm run db:push`) |
| PostCSS + Autoprefixer | CSS processing |
| k6 | Load/stress testing |

## Path Aliases

Configured in `vite.config.ts`:
- `@` → `client/src/`
- `@shared` → `shared/`
- `@assets` → `attached_assets/`

## Key Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies + scripts |
| `tsconfig.json` | TypeScript configuration |
| `vite.config.ts` | Vite build configuration |
| `drizzle.config.ts` | Database migration config |
| `tailwind.config.ts` | Tailwind CSS customization |
| `postcss.config.js` | PostCSS plugins |
| `components.json` | shadcn/ui component config |
| `vercel.json` | Vercel deployment config |

## Environment Variables

Required:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `RESEND_API_KEY` — Email service API key
- `RESEND_FROM_EMAIL` — Sender email address
- `SESSION_SECRET` — Express session secret (via `server/app.ts`)

Optional:
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob storage
- Google Cloud Storage credentials
- Replit connector credentials (fallback for Resend)
