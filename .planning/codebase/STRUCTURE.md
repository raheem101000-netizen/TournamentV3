# Directory Structure

## Top-Level Layout

```
TournamentV3-main/
├── client/              # React frontend (Vite)
│   ├── index.html       # HTML entry point
│   ├── public/          # Static assets
│   └── src/             # Application source
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── app.ts           # Express app setup
│   ├── routes.ts        # All API routes + WebSocket
│   ├── storage.ts       # Data access layer
│   ├── db.ts            # Database connection
│   ├── email.ts         # Email service (Resend)
│   ├── cache.ts         # In-memory caching
│   ├── bracket-generator.ts  # Tournament bracket logic
│   ├── objectStorage.ts # File storage abstraction
│   ├── objectAcl.ts     # Object access control
│   └── lib/             # Utilities (skyview.ts)
├── shared/              # Shared between client & server
│   ├── schema.ts        # Drizzle DB schema + Zod validators
│   └── types.ts         # Shared TypeScript types
├── migrations/          # Drizzle SQL migrations
├── k6-tests/            # Load testing (k6)
├── scripts/             # Admin/utility scripts
├── mobile/              # React Native mobile app
├── ios/                 # iOS Capacitor bridge
├── attached_assets/     # Reference assets & legacy code
├── dist/                # Build output
└── uploads/             # Local file uploads
```

## Client Structure (`client/src/`)

```
client/src/
├── App.tsx              # Root component with routing
├── main.tsx             # React DOM entry point
├── index.css            # Global styles (Tailwind)
├── pages/               # Route-level page components
│   ├── login.tsx
│   ├── register.tsx
│   ├── profile.tsx
│   ├── admin-panel.tsx
│   ├── create-tournament.tsx
│   ├── tournament-match.tsx
│   ├── tournament-public-view.tsx
│   ├── team-builder.tsx
│   ├── team-profile.tsx
│   ├── chat-room.tsx
│   ├── create-server.tsx
│   ├── server-preview.tsx
│   ├── server-settings.tsx
│   ├── account-settings.tsx
│   ├── preview-*.tsx    # Mobile preview pages
│   └── ...
├── components/          # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   ├── layouts/         # Layout wrappers
│   ├── loaders/         # Loading states
│   ├── channels/        # Server channel components
│   ├── chat/            # Chat-related components
│   ├── mobile-chat/     # Mobile chat components
│   ├── BracketView.tsx
│   ├── TournamentCard.tsx
│   ├── MatchCard.tsx
│   ├── StandingsTable.tsx
│   └── ...
├── contexts/            # React Context providers
│   └── AuthContext.tsx   # Authentication state
├── hooks/               # Custom React hooks
│   ├── use-mobile.tsx   # Mobile detection
│   ├── use-toast.ts     # Toast notifications
│   └── use-upload.ts    # File upload logic
├── modules/             # Feature modules
└── lib/                 # Utility functions
```

## Server Structure (`server/`)

| File | Purpose |
|------|---------|
| `index.ts` | Entry point, starts HTTP server |
| `app.ts` | Express app configuration, middleware, session setup |
| `routes.ts` | All REST API routes + WebSocket handlers (~monolithic) |
| `storage.ts` | `DatabaseStorage` class — data access layer |
| `db.ts` | Neon PostgreSQL connection pool + Drizzle instance |
| `email.ts` | Resend email client |
| `cache.ts` | In-memory cache with TTL |
| `bracket-generator.ts` | Tournament bracket generation algorithms |
| `objectStorage.ts` | `ObjectStorageService` — file storage abstraction |
| `objectAcl.ts` | `ObjectPermission` — file access control |
| `vite.ts` | Vite dev server integration |
| `lib/skyview.ts` | Observability/tracing wrapper |

## Key File Locations

| What | Where |
|------|-------|
| Database schema | `shared/schema.ts` |
| API routes | `server/routes.ts` |
| Auth context | `client/src/contexts/AuthContext.tsx` |
| App routing | `client/src/App.tsx` |
| UI primitives | `client/src/components/ui/` |
| Page components | `client/src/pages/` |
| Build config | `vite.config.ts` + `package.json` build script |
| DB migrations | `migrations/` |
| Load tests | `k6-tests/scenarios/` |
| Admin scripts | `scripts/` |

## Naming Conventions

### Files
- **Pages:** kebab-case (`tournament-match.tsx`, `admin-panel.tsx`)
- **Components:** PascalCase (`BracketView.tsx`, `TournamentCard.tsx`)
- **Hooks:** kebab-case with `use-` prefix (`use-mobile.tsx`, `use-toast.ts`)
- **Server files:** kebab-case (`bracket-generator.ts`, `objectStorage.ts`)

### Code
- **Components:** PascalCase (`CreateTournamentDialog`)
- **Functions/variables:** camelCase (`sendVerificationEmail`, `authRateLimiter`)
- **Constants:** UPPER_SNAKE_CASE (`CACHE_KEYS`, `CACHE_TTL`, `SESSION_SECRET`)
- **Types/Interfaces:** PascalCase (from Drizzle schema)

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/set-admin.ts` | Set user admin privileges |
| `scripts/fix-tournament-owners.ts` | Fix tournament ownership data |
| `scripts/reassign-tournament.ts` | Reassign tournament to another user |
| `scripts/transfer-all-tournaments.ts` | Bulk tournament transfer |
| `scripts/list-tournaments.ts` | List all tournaments |
| `scripts/test-skyview.ts` | Test observability integration |
