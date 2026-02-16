# Codebase Concerns

**Analysis Date:** 2026-02-16

## Tech Debt

**Excessive Rate Limiting Relaxation:**
- Issue: Rate limiters have been increased dramatically for load testing but remain at production-unsafe levels
- Files: `server/routes.ts` (lines 17-42)
- Current state:
  - General limiter: 100,000 requests/60s (increased from 5,000)
  - Auth limiter: 50,000 requests/15min (increased from 500)
  - Write limiter: 50,000 requests/60s (increased from 1,000)
- Impact: System is vulnerable to brute force attacks and DoS. These limits must be reset before production
- Fix approach: Define environment-based rate limits (development vs production). Use proper env vars with strict production defaults

**Rate Limiting IP Validation Disabled:**
- Issue: IP validation disabled on all rate limiters (`validate: { ip: false }`)
- Files: `server/routes.ts` (lines 23, 32, 41)
- Impact: Rate limiting cannot distinguish between users, only counts globally. Enables distributed attacks
- Fix approach: Re-enable IP validation for production deployments

**Debug Logging Left in Production Code:**
- Issue: Console.log statements for debugging left throughout codebase
- Files:
  - `server/routes.ts` (lines 1459-1461 DEBUG logs)
  - `server/storage.ts` (lines 1102, 1134, 1463 DEBUG logs)
- Impact: Performance degradation, log noise, potential info leakage
- Current count: 213 console.log/error/warn calls across 11 server files
- Fix approach: Replace with structured logging via skyview/monitoring. Remove debug output before production

**Duplicate Interface Definitions:**
- Issue: Interface declared twice with conflicting signatures
- Files: `client/src/components/channels/TournamentDashboardChannel.tsx` (lines 66-74)
- Problem: Two `TournamentDashboardChannelProps` interfaces - second one has additional optional fields
- Impact: Type confusion, first definition is ignored/overridden
- Fix approach: Merge into single interface definition

**Unsafe Type Assertions:**
- Issue: `as any` used sparingly but still present in critical paths
- Files: `server/routes.ts` (4+ instances including line 1356)
- Examples: `tournamentWithOwner as any`, type assertions bypassing validation
- Impact: Loss of type safety, harder to catch errors at compile time
- Fix approach: Replace with proper type guards and validation

## Known Issues

**N+1 Query Problem - Team Data Loading:**
- Symptom: When fetching tournament teams, for each team member, additional database queries execute
- Files: `server/routes.ts` (nested Promise.all with storage calls around fixture generation)
- Trigger: GET requests for tournament data with team member details
- Pattern:
  ```
  enrichedTeams = await Promise.all(
    teams.map(team =>
      Promise.all(
        members.map(member =>
          storage.getUser(member.userId)  // N+1: One query per member
        )
      )
    )
  )
  ```
- Current workaround: None - inefficiency is inherent to current architecture
- Scaling impact: Multiplies database load by factor of (teams × members per team)

**Achievement Orphan Records:**
- Symptom: Achievements exist for deleted servers, causing data integrity issues
- Files: `server/storage.ts` (lines 1128-1136)
- Cause: No cascade delete or foreign key constraint when servers are deleted
- Fix approach: Implement cascade delete for server deletions or add referential integrity constraints

**Empty/Stub File:**
- Issue: Empty TypeScript file exists at root level
- Files: `list-users.ts` (0 bytes)
- Impact: Clutters codebase, unclear purpose
- Fix approach: Either implement functionality or delete

## Security Considerations

**Password Storage - Low Hash Cost:**
- Risk: bcrypt cost factor is hardcoded at 10 (relatively fast)
- Files: `server/routes.ts` (line 641)
- Current mitigation: bcrypt is used (good), cost factor is reasonable
- Recommendations: Consider increasing to 12-14 for enhanced security, make configurable via env var

**Email Verification Bypass:**
- Risk: Email verification can be completely disabled via env var `SKIP_EMAIL_VERIFICATION=true`
- Files: `server/routes.ts` (line 626, 657-658)
- Current mitigation: Only activates if env var explicitly set
- Recommendations: Log all email verification bypasses, consider requiring approval for accounts created with verification skipped

**Error Message Information Leakage:**
- Risk: Generic vs specific error messages may leak information about registered users
- Files: `server/routes.ts` (line 635, 741)
- Examples: "An account with this email already exists" reveals user enumeration
- Recommendations: Use generic errors in auth endpoints; specific errors only for authenticated users

**Session Secret Single Source:**
- Risk: SESSION_SECRET imported from single location with no backup/rotation mechanism
- Files: `server/routes.ts` (line 12)
- Impact: Session compromise affects entire system, no rotation capability
- Recommendations: Implement session secret rotation mechanism, support multiple secrets for graceful rollover

## Performance Bottlenecks

**Monolithic routes.ts File:**
- Problem: Single routes file is 6,424 lines - contains all endpoint handlers
- Files: `server/routes.ts`
- Impact: Difficult to navigate, test, and optimize; cognitive overload
- Current organization: All endpoint handlers in single switch-like structure
- Improvement path: Split into feature-based route modules (tournaments, auth, users, channels, etc.)

**Nested Promise.all Anti-pattern:**
- Problem: Multiple nested Promise.all calls create unnecessary sequential waits
- Files: `server/routes.ts` (registration steps with fields loading, team enrichment)
- Example: Load steps, then for each step load fields, instead of loading all in parallel
- Improvement path: Use batch queries or pre-load related data in single operation

**Dashboard Component Complexity:**
- Problem: Single React component is 2,387 lines
- Files: `client/src/components/channels/TournamentDashboardChannel.tsx`
- Current state: Manages tournament creation, editing, matches, achievements, registration, all in one component
- Impact: Component is hard to test, reuse, and optimize; excessive re-renders possible
- Improvement path: Extract sub-components (TournamentCreator, MatchManager, AchievementAwarder, etc.)

**In-Memory File Upload (5MB limit):**
- Problem: All uploads stored in memory via `multer.memoryStorage()`
- Files: `server/routes.ts` (lines 47-51)
- Impact: Memory spikes with concurrent uploads, 5MB limit too small for many use cases
- Current scaling: Each upload allocates full file size in RAM
- Improvement path: Switch to streaming storage (disk or cloud) with proper cleanup

**Promise-Based Achievement Lookup:**
- Problem: Achievement server names fetched one-by-one via Promise.all
- Files: `server/storage.ts` (lines 1459-1468)
- Pattern: For each achievement, query database for server name separately
- Improvement path: Use single JOIN query instead of N sequential queries

## Fragile Areas

**Bracket Generation Logic:**
- Files: `server/bracket-generator.ts`, `server/routes.ts` (fixture generation code)
- Why fragile: Complex combinatorial logic for round-robin, single elimination, Swiss system; easy to introduce off-by-one errors
- Safe modification: Add unit tests for each bracket type with edge cases (odd team counts, byes, knockouts)
- Test coverage gaps: No automated tests found for bracket generation; manual testing only
- Critical paths: Tournament creation depends on bracket correctness - broken brackets break entire tournament

**WebSocket Broadcasting:**
- Files: `server/routes.ts` (lines 582-604)
- Why fragile: Manual client tracking in memory, no persistence. Crashes lose all connected clients
- Safe modification: Add reconnection logic, implement message queue for offline clients
- Test coverage gaps: No test coverage for WebSocket logic, edge cases like network failures untested

**Database Schema Migrations:**
- Files: `migrations/` directory
- Why fragile: Drizzle-kit auto-migrations can fail silently on certain databases
- Safe modification: Always test migrations on production-like database first
- Test coverage gaps: No migration rollback tests

**Match Chat Thread Creation:**
- Files: `server/routes.ts` (lines 94-200+)
- Why fragile: Creates threads for all team members asynchronously; if partial failure occurs, some members won't have threads
- Safe modification: Wrap in transaction or implement retry logic with dead letter queue
- Test coverage gaps: No testing of partial failures or race conditions

## Scaling Limits

**Database Connections:**
- Current capacity: Using connection pool from Neon via Drizzle-ORM
- Limit: Not explicitly configured visible in codebase; relies on Neon defaults
- Scaling path: Configure explicit pool size in `server/db.ts` as load increases
- Concern: No visible connection pool management or monitoring

**WebSocket Connections:**
- Current capacity: Single Node.js process, memory-limited
- Limit: Approximately 10,000 concurrent connections (OS file descriptor limit)
- Scaling path: Implement Redis adapter for horizontal scaling, enable multi-process clustering
- Current state: No horizontal scaling capability, single instance only

**In-Memory Cache:**
- Files: `server/cache.ts`
- Current capacity: Memorystore backend, single instance
- Limit: Limited by Node.js heap (typically <2GB)
- Scaling path: Migrate to Redis for shared cache across instances

**File Storage:**
- Current: Memory-based for uploaded files during request
- Limit: Request size limits of 5MB; memory pressure with concurrent uploads
- Scaling path: Move to cloud storage (Vercel Blob, Google Cloud Storage) for unlimited capacity

**Tournament Fixture Generation:**
- Current: Synchronous generation at request time
- Limit: Very large tournaments (100+ teams) will block request for seconds
- Scaling path: Implement async job queue (Bull, RabbitMQ) for fixture generation

## Dependencies at Risk

**Drizzle-ORM Version Lock:**
- Risk: Using `^0.39.1` - may have breaking changes in future versions
- Files: `package.json` (line 82)
- Impact: Auto-updates could break queries
- Migration plan: Pin to exact version `0.39.1`, test before upgrading

**Express + Custom Middleware Stack:**
- Risk: Express is unmaintained (request for maintenance passed to Express TC)
- Impact: Security patches may be slow
- Alternative: Consider Fastify or Hono for new projects
- Current mitigation: Community-maintained forks available

**Passport.js Authentication:**
- Risk: Passport ecosystem fragmented, local strategy maintenance questionable
- Files: Imported but usage pattern shows custom auth implementation instead
- Alternative: Consider @auth/core or similar modern solutions
- Current mitigation: Mostly replaced with custom implementation already

## Missing Critical Features

**No Request/Response Validation Logging:**
- Problem: Validation errors exist but aren't tracked for trending
- Impact: Can't identify common client errors or API misuse patterns
- Blocking: Makes it hard to improve API usability

**No API Rate Limiting per User:**
- Problem: Rate limits are global, not per-user or per-IP
- Impact: Single malicious user can affect all users
- Blocking: Production deployments should have user-level rate limiting

**No Database Query Performance Monitoring:**
- Problem: No query execution time tracking or slow query logs
- Impact: Can't identify performance regressions
- Blocking: Critical for scaling investigations

**No Graceful Shutdown Handling:**
- Problem: Server shutdown kills active WebSocket connections and pending requests
- Impact: Data loss in progress, poor user experience
- Blocking: Can cause data corruption in concurrent operations

**No Circuit Breaker for External Services:**
- Problem: Email service calls fail immediately without retry
- Files: `server/email.ts`
- Impact: Failed emails aren't queued or retried
- Blocking: Critical emails (verification, password reset) won't deliver

## Test Coverage Gaps

**No Unit Tests:**
- What's not tested: Storage layer, bracket generation, achievement logic, permission checks
- Files: `server/storage.ts`, `server/bracket-generator.ts`, entire routes
- Risk: Critical business logic has zero test coverage
- Priority: High - bracket generation alone deserves comprehensive test suite

**No API Integration Tests:**
- What's not tested: Endpoint-to-endpoint flows, auth flows, tournament creation-to-completion
- Files: All routes in `server/routes.ts`
- Risk: Breaking changes caught only in production or manual testing
- Priority: High - critical for API reliability

**No WebSocket Tests:**
- What's not tested: Connection/disconnection, message broadcasting, reconnection logic
- Files: `server/routes.ts` (WebSocket handlers)
- Risk: Real-time features untested, failures only found when deployed
- Priority: Medium - affects user experience but not data integrity

**No Database Migration Tests:**
- What's not tested: Migration reversibility, data preservation across versions
- Files: `migrations/`
- Risk: Can't safely roll back or upgrade schemas
- Priority: High - database migrations are high-risk

**No E2E Tests:**
- What's not tested: Full user flows (registration → tournament creation → matches)
- Files: Entire application
- Risk: Critical workflows only tested manually
- Priority: Medium - would catch integration issues early

**No Performance Tests:**
- What's not tested: Load testing, N+1 detection, memory leaks
- Files: K6 tests exist but are informal/incomplete
- Risk: Performance regressions go undetected until production
- Priority: Medium - important for scaling

---

*Concerns audit: 2026-02-16*
