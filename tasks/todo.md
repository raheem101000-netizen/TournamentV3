# Bug Fix Plan

- [completed] Document completed fixes and current bug scope
- [completed] Fix intermittent stale tournament visibility after create/join
- [completed] Fix achievement visibility refresh issue on profile bio
- [completed] Run typecheck and verify behavior-sensitive paths
- [completed] Add final review notes and outcomes

## Notes

- User reported intermittent UI updates requiring manual refresh for:
  - tournament join state
  - newly created tournament visibility
  - newly awarded achievements on profile

## Review

- Implemented end-to-end fixes across server response timing, server cache TTL correctness, and client cache update strategy.
- Verified with `npm run check` (passes).
- Added persistent documentation in `tasks/fixes.md` and process learnings in `tasks/lessons.md`.

## Next Fix Batch (2026-02-24)

- [completed] Replace profile modal email line with username
- [completed] Enforce match-chat authorization for HTTP and WebSocket routes
- [completed] Restrict team achievement awarding to tournament-registered teams only
- [completed] Run typecheck and verify updated behavior

### Batch Review

- Updated profile modal identity line to show `@username` under display name.
- Added server-side authorization checks for match access across match details, match metadata, match messages, match thread lookup, and WebSocket match chat connections.
- Scoped team search in the award dialog to `tournamentId` and added backend validation so team achievements cannot be awarded to teams not registered in that tournament context.
- Verified with `npm run check` (passes).

## Discovery Card Sizing Sync (2026-03-02)

- [completed] Compare `/discovery` and `/` card layout classes
- [completed] Update discovery server grid to match home card sizing behavior
- [in_progress] Run `npm run check` to validate no type or build regressions
- [pending] Add review notes for this sizing sync

## My Page Section Scroll Isolation (2026-03-02)

- [completed] Inspect `/myservers` layout and identify why page-level scrolling still occurs
- [completed] Refactor `/myservers` container sizing so the viewport itself does not scroll
- [completed] Keep independent scroll for Servers and Tournaments columns (matching current tournaments section behavior)
- [in_progress] Run `npm run check` to confirm no regressions
- [pending] Add review notes and validation outcome

## Discover Filter Packaging (2026-03-03)

- [completed] Replace always-visible game pill row with a single expandable filters button
- [completed] Convert game filtering from single-select to multi-select
- [completed] Show compact selected-game chips when collapsed to keep selected filters visible
- [completed] Auto-close expanded filters panel on scroll so only selected summary remains
- [completed] Run `npm run check` and capture review notes

### Batch Review

- Updated `/` discover filter UX in `client/src/pages/mobile-preview-home.tsx` to keep an inline horizontal pill row, with `Filter` as the lead chip.
- `Filter` now toggles horizontal expansion to the right, showing all game chips in-row (multi-select), matching the original side-flow interaction.
- Collapsed mode keeps only selected chips (plus `+N` overflow) next to `Filter`, and scroll auto-collapses back to this compact state.
- Verified with `npm run check` (passes).

## Hide Messaging Entry Points (2026-03-03)

- [completed] Remove Messages tab from bottom navigation
- [completed] Remove message CTA from account/profile surfaces
- [completed] Run `npm run check` and verify no type regressions

### Batch Review

- Removed the `Messages` nav item from `client/src/components/BottomNavigation.tsx` so messaging is no longer visible in primary navigation.
- Removed message action buttons from `client/src/pages/preview-account.tsx`, `client/src/components/UserProfileModal.tsx`, and `client/src/pages/profile.tsx` while keeping friend actions intact.
- Verified with `npm run check` (passes).

## Messaging Feature Flag (2026-03-03)

- [completed] Add a central frontend feature flag for messaging visibility
- [completed] Restore message UI codepaths behind the new flag for quick re-enable later
- [completed] Keep messaging hidden while preserving implementation code
- [completed] Run `npm run check` and verify no regressions

### Batch Review

- Added `client/src/config/features.ts` with `FEATURE_MESSAGES_ENABLED = false` as the single switch.
- Reintroduced message-related UI/actions in nav and profile surfaces, but gated all of them with `FEATURE_MESSAGES_ENABLED`.
- Messaging remains hidden now, and can be restored later by flipping one flag instead of rebuilding deleted code.
- Verified with `npm run check` (passes).

## My Page Registered Tournament Navigation (2026-03-03)

- [completed] Update registered tournament "View Tournament" action to avoid registration page
- [completed] Route registered tournaments to dashboard context when available
- [completed] Run `npm run check` and verify no regressions

### Batch Review

- Updated `client/src/pages/preview-my-servers.tsx` so `Registered` list cards route to `/server/:serverId` when the tournament has a server.
- Added fallback routing to `/tournament/:id/view` for cases without `serverId` and for saved tournaments.
- Verified with `npm run check` (passes).
