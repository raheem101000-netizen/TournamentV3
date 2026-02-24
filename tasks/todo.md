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
