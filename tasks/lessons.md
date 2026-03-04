# Lessons Learned

## 2026-02-24

- When fixing one issue, always run full `npm run check` before handing off; unrelated parser/type failures can block validation and hide confidence in the main fix.
- If a user reports "works after refresh", check both client cache invalidation timing and server-side cache TTL units (seconds vs milliseconds).
- For UX-critical endpoints (auth, create, join), never block API responses on telemetry/observability calls.

## 2026-03-03

- For UI requests that reference an existing layout direction (e.g. "goes horizontal" and "to the side"), preserve the original inline flow unless the user explicitly asks for overlay/popover behavior.
- When a user asks to hide a feature temporarily, prefer a feature flag over removing code paths; this keeps rollback to a single-switch change.
