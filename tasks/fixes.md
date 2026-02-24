# Fixes Applied

## 2026-02-24

### Authentication/Login freeze
- Updated telemetry flushing to be timeout-bounded in `server/lib/skyview.ts` using `AbortController` and `SKYVIEW_FLUSH_TIMEOUT_MS` (default `400ms`).
- Changed login telemetry in `server/routes.ts` to non-blocking (`void flush().catch(...)`) so responses are not delayed by observability network calls.

### Build/type safety regressions found during verification
- Fixed broken JSX tree in `client/src/pages/profile.tsx` (unbalanced tags and misplaced section blocks).
- Fixed invalid button variant in `client/src/pages/preview-account.tsx` (`link` -> `ghost`).

### Intermittent refresh-required issues (join/create/achievements)
- Fixed server tournaments cache TTL unit bug in `server/routes.ts` (`300 * 1000` -> `300` seconds) so public tournament cache actually expires as intended.
- Made tournament creation route telemetry non-blocking in `server/routes.ts` to avoid slow responses that cause stale UI perception.
- Made tournament registration route telemetry non-blocking in `server/routes.ts` for the same reason.
- Improved create flow immediacy in `client/src/pages/create-tournament.tsx`:
  - Optimistically inserts created tournament into `/api/tournaments` cache.
  - Awaits invalidation before redirecting home.
- Improved join flow immediacy in `client/src/components/TournamentRegistrationForm.tsx`:
  - Optimistically appends the returned registration to `/api/tournaments/:id/registrations` cache.
  - Immediately toggles already-registered UI state.
  - Awaits invalidations for related tournament queries.
- Fixed achievement invalidation target in `client/src/components/channels/TournamentDashboardChannel.tsx`:
  - Invalidates awarded player achievements using `variables.playerId` instead of organizer ID.

### User/profile + tournament security + award-scope fixes
- Updated user modal identity rendering in `client/src/components/UserProfileModal.tsx`:
  - Removed email line under display name.
  - Replaced with `@username`.
- Added strict match access control in `server/routes.ts` via `canAccessMatch(...)`:
  - Allows only match participants, tournament organizer, server owner, and admins.
  - Enforced on:
    - `GET /api/matches/:id`
    - `GET /api/tournaments/:tournamentId/matches/:matchId/details`
    - `GET /api/matches/:matchId/messages`
    - `POST /api/matches/:matchId/messages`
    - `GET /api/matches/:matchId/thread`
    - match WebSocket connections/messages.
- Hardened message posting auth in `server/routes.ts`:
  - Match chat POST now uses `req.session.userId` instead of trusting `req.body.userId`.
- Restricted team achievement search scope in `server/routes.ts` + `client/src/components/channels/TournamentDashboardChannel.tsx`:
  - Team search endpoint now accepts `tournamentId` and only returns team profiles from non-rejected registrations in that tournament.
  - Award dialog passes `tournamentId` to team search and team award payload.
  - Team award endpoint validates the team is registered in the provided tournament context.
