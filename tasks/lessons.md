# Lessons Learned

## 2026-02-24

- When fixing one issue, always run full `npm run check` before handing off; unrelated parser/type failures can block validation and hide confidence in the main fix.
- If a user reports "works after refresh", check both client cache invalidation timing and server-side cache TTL units (seconds vs milliseconds).
- For UX-critical endpoints (auth, create, join), never block API responses on telemetry/observability calls.
