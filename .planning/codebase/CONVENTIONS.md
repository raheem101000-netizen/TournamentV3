# Coding Conventions

**Analysis Date:** 2026-02-16

## Naming Patterns

**Files:**
- Component files (React): PascalCase with `.tsx` extension - `BracketView.tsx`, `MatchCard.tsx`
- Page files: kebab-case with `.tsx` extension - `tournament-match.tsx`, `create-server.tsx`
- Utility/helper files: camelCase with `.ts` extension - `queryClient.ts`, `achievement-utils.ts`
- Hooks: camelCase with `use` prefix - `use-mobile.tsx`, `use-toast.ts`
- Types/schema files: lowercase - `schema.ts`, `types.ts`
- Server/backend files: camelCase with `.ts` extension - `routes.ts`, `storage.ts`, `bracket-generator.ts`

**Functions:**
- React components: PascalCase - `function BracketView()`, `export default function MatchCard()`
- Regular functions: camelCase - `getTeamById()`, `getTeamDisplayName()`, `throwIfResNotOk()`
- Hook functions: camelCase with `use` prefix - `useAuth()`, `useQuery()`, `useMutation()`
- Async functions: camelCase - `apiRequest()`, `sendVerificationEmail()`

**Variables:**
- Local variables: camelCase - `isAuthenticated`, `getTeamAvatar`, `statusColors`
- Constants (module-level): UPPER_SNAKE_CASE - `SESSION_SECRET`, `MOBILE_BREAKPOINT`, `TOAST_LIMIT`, `IMPORTANT_ROUTES`
- TypeScript types/interfaces: PascalCase - `AuthContextType`, `MatchCardProps`, `User`, `TeamWithMembers`
- API endpoints/routes: lowercase with slashes - `/api/auth/login`, `/api/tournaments/:id`, `/api/matches/:matchId`

**Types:**
- Exported interfaces: PascalCase - `User`, `AuthContextType`, `MatchCardProps`, `Team`
- Exported types: PascalCase - `UnauthorizedBehavior`
- Generic type parameters: Single uppercase letters or descriptive names - `<T>`, `<T = any>`

## Code Style

**Formatting:**
- Indentation: 2 spaces (implicit in codebase, enforced via TypeScript/Vite)
- Semicolons: Always present at statement ends
- Quotes: Double quotes preferred for strings (`"string"` not `'string'`)
- Trailing commas: Used in multiline objects, arrays, and function signatures
- Line length: No strict limit observed, but generally keep under 100 characters where practical

**Linting:**
- No explicit ESLint config found in root (using TypeScript strict mode)
- Strict TypeScript enabled: `"strict": true` in `tsconfig.json`
- Module resolution: `bundler` strategy for modern module handling
- No Prettier config - formatting appears to be manual/IDE-based

## Import Organization

**Order:**
1. External library imports (React, third-party packages) - `import { useState, useEffect } from "react"`
2. Internal path-aliased imports (`@/` prefix) - `import { useAuth } from "@/contexts/AuthContext"`
3. Shared imports (`@shared/` prefix) - `import type { Match, Team } from "@shared/schema"`
4. Relative imports (if any) - rarely used, prefer path aliases
5. Type imports: Use `import type { }` for TypeScript-only imports

**Path Aliases:**
- `@/` → `./client/src/` (client app root)
- `@shared/` → `./shared/` (shared types and schema)
- `@assets/` → `./attached_assets/` (static assets)

**Example import structure:**
```typescript
import { useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { Match, Team } from "@shared/schema";
```

## Error Handling

**Patterns:**
- Try-catch blocks with specific error messages: `throw new Error(\`${res.status}: ${text}\`)`
- HTTP response validation before parsing: Check `res.ok`, get error text from response
- Async error handling: Functions check for status codes (401, 404, etc.) before proceeding
- Error logging: console.error for critical errors, console.log for info - `console.error('[EMAIL] Failed to send...')`
- Tagged logging: Prefix messages with service name in brackets - `[DB]`, `[EMAIL]`, `[REQUEST]`

**Example from `queryClient.ts`:**
```typescript
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}
```

**Special handling:**
- 401 responses: Can return `null` (if configured with `on401: "returnNull"`) or throw error
- DELETE requests: Return empty object `{}` instead of null
- Missing JSON responses: Return empty object or message object as fallback

## Logging

**Framework:** Native `console` object

**Patterns:**
- `console.log()` for informational messages with tag prefix
- `console.error()` for error conditions with tag prefix
- Tagged format: `[SERVICE_NAME] Message here` - Examples: `[DB]`, `[EMAIL]`, `[REQUEST]`, `🔭 SkyView Observability`
- Include context in logs: User ID, operation type, counts of items processed
- In routes: Use centralized logging via `skyview.ts` for critical operations

**Examples:**
```typescript
console.log("[DB] Initializing database connection...");
console.error('[DB] Pool error:', err);
console.log('[EMAIL] Verification email sent successfully:', { to: email, userId });
console.log('🚀 Starting image migration to Vercel Blob...');
```

## Comments

**When to Comment:**
- Complex business logic that isn't obvious from code - bracket generation, tournament logic
- Configuration explanations - session settings, rate limiter values
- Workarounds and why they exist - "Vercel compatibility", "Reduced from 100 to 20 for serverless stability"
- Integration details - external service setup, environment assumptions

**What NOT to comment:**
- Obvious variable assignments
- Loop operations that are clear from context
- Standard React patterns

**JSDoc/TSDoc:**
- Minimal usage observed
- Function signatures often include inline TypeScript type documentation
- Example from `app.ts`: No JSDoc; types are explicit in function signatures

## Function Design

**Size:** Functions are generally 20-100 lines, larger when handling complex business logic like bracket generation (brackets-generator.ts: ~200 lines)

**Parameters:**
- Use destructuring for component props: `function MatchCard({ match, team1, team2, onSubmitScore }: MatchCardProps)`
- React Query hooks receive options objects: `useQuery({ queryKey: [...], queryFn: ... })`
- HTTP functions use specific parameters: `apiRequest<T>(method: string, url: string, data?: unknown)`

**Return Values:**
- React components return JSX
- API functions return typed generics: `Promise<T>`
- Query functions: Return data directly or `null` on auth failure
- Helper functions return typed values matching their purpose

**Async/await:**
- Preferred over `.then()` chains throughout codebase
- Error handling with try-catch in async contexts

## Module Design

**Exports:**
- Named exports for utilities: `export const queryClient = new QueryClient()`
- Default exports for React components: `export default function BracketView() { ... }`
- Mixed exports in some utility files: Both named and default exports

**Example from `queryClient.ts`:**
```typescript
export async function apiRequest<T = any>(...) { ... }
export const getQueryFn = (...) => ... ;
export const queryClient = new QueryClient({ ... });
```

**Barrel Files:**
- UI components organized in `components/ui/` directory (shadcn-based)
- Each component in own file: `card.tsx`, `button.tsx`, `badge.tsx`
- Explicit imports preferred over barrel exports

**Module organization:**
- Server: Route handlers in `routes.ts`, storage logic in `storage.ts`, utilities in `lib/`
- Client: Pages in `pages/`, components in `components/`, hooks in `hooks/`, utilities in `lib/`, contexts in `contexts/`
- Shared: Database schema in `schema.ts`, additional types in `types.ts`

---

*Convention analysis: 2026-02-16*
