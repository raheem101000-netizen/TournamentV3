# Architecture

**Analysis Date:** 2026-02-16

## Pattern Overview

**Overall:** Full-stack monolithic application with client-server separation, using a React frontend connected to an Express backend with PostgreSQL database.

**Key Characteristics:**
- Client-server architecture with REST API communication
- Shared schema definitions between client and server via `shared/schema.ts`
- WebSocket support for real-time messaging
- Session-based authentication with PostgreSQL session store
- Server-side rendering capability via Vite
- In-memory caching layer on backend
- Drizzle ORM for type-safe database operations

## Layers

**Frontend (React + TypeScript):**
- Purpose: User interface, client-side routing, form handling, real-time message display
- Location: `client/src/`
- Contains: Pages, components, hooks, contexts, utilities
- Depends on: TanStack React Query for server state, React Router (wouter), Radix UI components
- Used by: Browser clients

**Backend API (Express + TypeScript):**
- Purpose: Request routing, authentication, business logic, database operations
- Location: `server/`
- Contains: Route handlers, database storage layer, middleware, utilities
- Depends on: PostgreSQL database, external services (email, storage, observability)
- Used by: Frontend, WebSocket connections, external services

**Database Layer (PostgreSQL + Drizzle ORM):**
- Purpose: Persistent data storage with transactional integrity
- Location: `shared/schema.ts`, `server/db.ts`, `server/storage.ts`
- Contains: Schema definitions, connection pooling, CRUD operations via DatabaseStorage
- Depends on: Neon serverless PostgreSQL database
- Used by: Backend API, server utilities

**Shared Definitions:**
- Purpose: Type definitions, schema validators, common types
- Location: `shared/schema.ts`, `shared/types.ts`
- Contains: Drizzle table definitions, Zod insert schemas, TypeScript types
- Used by: Both frontend and backend for type safety

**Storage Abstraction:**
- Purpose: Provide uniform interface to database operations
- Location: `server/storage.ts`
- Contains: `DatabaseStorage` class implementing `IStorage` interface with 100+ methods
- Pattern: Service layer pattern - all database access goes through this singleton

## Data Flow

**Authentication Flow:**

1. User submits credentials on `/login` page (`client/src/pages/login.tsx`)
2. Frontend calls `POST /api/auth/login` with email/password
3. Backend validates credentials, creates session record in PostgreSQL
4. Backend returns user object and sets secure HTTP-only cookie
5. Frontend stores user in React Query cache via `AuthContext`
6. Subsequent requests include session cookie automatically (credentials: "include")
7. Backend middleware validates session on each request

**Tournament Registration Flow:**

1. User navigates to `/tournament/:id/register`
2. Frontend fetches registration config via `GET /api/tournaments/:id/registration/config`
3. Backend retrieves config, steps, and fields from database
4. User fills multi-step registration form
5. Frontend posts to `POST /api/registrations` with form responses
6. Backend creates registration record and response records in transaction
7. Organizer approves registration via admin panel
8. System creates match threads for all team members via `createMatchThreadsForAllMembers()`

**Match Messaging Flow:**

1. User opens match chat room at `/tournament/:tournamentId/match/:matchId`
2. Frontend fetches messages via `GET /api/matches/:matchId/chat-messages`
3. Frontend establishes WebSocket connection for real-time updates
4. User sends message via WebSocket
5. Backend receives via WebSocket, creates `ThreadMessage` record, broadcasts to participants
6. Frontend receives via WebSocket, updates UI optimistically

**Server/Channel Model:**

1. User creates server via `/create-server`
2. Server record created with owner, description, visibility settings
3. Default channels auto-created (general, announcements)
4. Other users discover server in `/discovery`, join via invite code
5. Server members can create additional channels under categories
6. Messages posted to channels stored with channel and user references

## Key Abstractions

**DatabaseStorage (IStorage interface):**
- Purpose: Centralized data access abstraction
- Examples: `server/storage.ts` (2000+ lines)
- Pattern: Repository/DAO pattern - encapsulates all Drizzle ORM queries
- Operations: 100+ methods covering tournaments, teams, matches, registrations, users, servers, channels, achievements, team profiles

**MessageThreads (Direct Messages + Match Chat):**
- Purpose: Unified messaging interface for both DM and match chats
- Examples: `messageThreads` table in schema
- Pattern: Polymorphic entity - `matchId` null = DM thread, `matchId` set = match chat
- Optimization: `getMessageThreadsForParticipant()` uses single OR query instead of separate fetches

**Authentication Context:**
- Purpose: Global auth state and methods
- Examples: `client/src/contexts/AuthContext.tsx`
- Pattern: React Context API + useAuth() hook
- State: user object, isLoading, isAuthenticated
- Methods: logout(), refetchUser()

**Protected Routes:**
- Purpose: Route-level access control
- Examples: `ProtectedRoute` component in `client/src/App.tsx`
- Pattern: Higher-order component checking `useAuth().isAuthenticated`
- Behavior: Redirects unauthenticated users to `/login`

**Query Client:**
- Purpose: Server state management and caching
- Examples: `client/src/lib/queryClient.ts`
- Pattern: TanStack React Query with custom query function
- Settings: staleTime: Infinity (no auto-refetch), retry: false, manual refetch on focus

**Bracket Generators:**
- Purpose: Generate match schedules for tournaments
- Examples: `server/bracket-generator.ts`
- Generators: `generateRoundRobinBracket()`, `generateSingleEliminationBracket()`, `generateSwissSystemRound()`
- Pattern: Pure functions receiving teams, returning match objects

## Entry Points

**Server Bootstrap:**
- Location: `server/index.ts`
- Triggers: `npm run dev` (development) or `npm run start` (production)
- Responsibilities: Initialize app, register routes, setup Vite/static serving, start HTTP server on port 8080/5000

**Frontend Bootstrap:**
- Location: `client/src/main.tsx`
- Triggers: Loaded by browser via Vite development server or built dist/
- Responsibilities: Render React root, initialize QueryClient, setup AuthProvider

**App Component:**
- Location: `client/src/App.tsx`
- Triggers: Rendered by main.tsx
- Responsibilities: Setup Router with wouter, load lazy components, prefetch data, setup providers (QueryClient, AuthProvider, TooltipProvider)

**Route Registration:**
- Location: `server/routes.ts`
- Triggers: Called from `server/index.ts` at startup
- Responsibilities: Register 100+ route handlers, setup WebSocket server, configure rate limiters, attach middleware

## Error Handling

**Strategy:** Layered error handling with observability integration (SkyView)

**Patterns:**

**Frontend:**
- Try-catch in async handlers
- Query/mutation error states in React Query
- Error fallback UI pages (e.g., `/not-found`)
- Toast notifications via `useToast()` hook
- Redirect to login on 401 errors

**Backend:**
- Express error middleware at end of chain in `server/index.ts`
- SkyView integration: `skyviewErrorHandler` middleware captures errors
- Try-catch blocks in route handlers with res.status().json() responses
- Validation errors via Zod schema failures
- Database transaction rollback on errors
- Rate limiting with error responses

**Global Error Tracking:**
- SkyView service: tenant ID "Tourni1010", service "tourni1010-backend"
- Automatic 4xx/5xx response tracking via `skyviewResponseTracker` middleware
- Manual metric reporting via `metric()` function in routes
- Error spans via `startTrace()` / `endTrace()`

## Cross-Cutting Concerns

**Logging:**
- Backend: Console.log with contextual messages (e.g., "[DB]", "[MSG-THREADS]", "[DEBUG]")
- Frontend: Conditional console.log on errors only
- No persistent logging configured

**Validation:**
- Backend: Zod schemas for request bodies (e.g., `insertTournamentSchema`)
- Frontend: React Hook Form with built-in validation
- Database: PostgreSQL constraints (NOT NULL, UNIQUE, FK)

**Authentication:**
- Session-based with PostgreSQL store via connect-pg-simple
- HTTP-only secure cookies
- Session TTL: 30 days
- Middleware check on protected routes

**Authorization:**
- User roles: admin, organizer, regular user
- Server roles with explicit permissions
- Owner-based access control for servers/tournaments
- Tournament approval-based gating for match visibility

**Caching:**
- Backend: In-memory cache via `cache` singleton in `server/cache.ts`
- TTL strategies: SHORT (30s), MEDIUM (60s), LONG (300s), VERY_LONG (600s)
- Cache invalidation: Pattern-based (e.g., `servers:*`)
- Frontend: React Query with staleTime: Infinity

**Rate Limiting:**
- Three tier system: general (100k/min), auth (50k/15min), write (50k/min)
- Applied globally to `/api/*` POST/PUT/DELETE
- Returns 429 with error message
- IP validation disabled for serverless compatibility

**File Storage:**
- Frontend: Uppy for file uploads with AWS S3 integration
- Backend: Memory storage with 5MB file size limit
- Images: Stored in Vercel Blob or GCS depending on environment
- Avatar/poster images: Persisted with URLs in database

**Real-time Communication:**
- WebSocket server via ws package
- Session authentication shared with Express via SESSION_SECRET
- Message broadcasting to match participants
- No persistent WebSocket reconnection logic (stateless design)

---

*Architecture analysis: 2026-02-16*
