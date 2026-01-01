# Tournament Management Platform

## Overview
This project is a web application offering a comprehensive tournament management platform with mobile preview capabilities. It provides a Discord-style server system for creating and managing gaming communities, featuring public channels and a private "Tournament Dashboard" for organization. The platform supports various tournament formats (Round Robin, Single Elimination, Swiss System), bracket visualization, team standings, match tracking, and score submission. Its core purpose is to empower server owners to efficiently organize and manage competitive gaming tournaments through a centralized, private dashboard, aiming to be a leading solution in esports and competitive gaming.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
*   **Technology Stack**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, Radix UI primitives with shadcn/ui for UI components, Tailwind CSS for styling, and Vite for building.
*   **Authentication**: Session-based with bcrypt. Optimized for zero-latency UI updates. 
    *   **Login Flow**: Uses `queryClient.setQueryData` for instant state updates and `wouter` for smooth client-side redirection. Includes a themed loading spinner in `App.tsx` to prevent white screens.
    *   **Logout Flow**: Centralized in `AuthContext.tsx`. Immediately clears local state via `queryClient.setQueryData(['/api/auth/me'], null)` and `queryClient.clear()`, then performs an instant client-side redirect using `setLocation('/login')` from `wouter`. This avoids full page reloads and eliminates white screen delays.
    *   **Security**: Uses `window.location.replace` or `setLocation` after state clearing to ensure session termination and prevent unauthorized back-button access.
*   **Design System**: Gaming-inspired aesthetic (Discord, Challonge/Battlefy, Linear) with custom typography, responsive 12-column grid layouts, standardized spacing, and dark/light theme support. Login and registration pages feature a distinctive "10/10" circular logo design with monospace typography on a dark background (inspired by the 'dara' visual style).
*   **Key Features**: Server and channel management (including a dedicated Tournament Dashboard with access enforcement), robust member permissions system, tournament creation and visualization (brackets, standings, match tracking), and real-time match chat.
*   **Routing**: Structured for mobile preview pages, server-specific views (`/server/:serverId`), tournament details (`/tournament/:id`), a home page, and user account management.
*   **Channel System**: Supports unlimited custom channels with 35 icons. New servers auto-create "Tournament Dashboard", "Announcements", and "General Chat".
*   **User Account Management**: Account settings for profile management, avatar upload, password change, language, and account disable/delete.
*   **Server Settings**: Overview for name, description, icon/background upload; Roles management with comprehensive permissions; Bans management; and Invite link generation.
*   **Tournament Features**: Entry fee and prize fields support custom text. Robust tournament poster upload system with live preview. Homepage filters for "All", "Prize", "No Prize", "Free Entry", "Paid Entry" with smart matching logic. Tournament visibility control (Public/Private) - private tournaments are hidden from the public homepage and appear only to organizers.
*   **Tournament Visibility**: Implemented in Step 3 of tournament creation. Field stores "public" or "private" enum value. **CRITICAL**: When adding visibility to poster objects during mapping (preview-home.tsx line 204), MUST include `visibility: t.visibility` so the filter at line 230 can properly exclude private tournaments. Without this mapping, the visibility field is undefined and the filter fails.

### Backend Architecture
*   **Technology Stack**: Node.js with Express, TypeScript (ESM), Drizzle ORM, Neon Serverless for PostgreSQL, and `ws` for WebSocket communication.
*   **API Design**: RESTful endpoints under `/api`, WebSocket connections for real-time match chat, and JSON-based communication.
*   **Tournament Logic**: Implements bracket generation algorithms for Round Robin, Single Elimination (with bye handling), and Swiss System formats.
*   **WebSocket Implementation**: Dedicated WebSocket connections per match for real-time chat message broadcasting.
*   **Security**: Zod validation on all critical endpoints. Access enforcement for Tournament Dashboard based on `tournament_dashboard_access` permission or server ownership.
*   **Permissions Model**: Hybrid role-based and explicit member permissions.

### Data Storage
*   **Database**: PostgreSQL via Neon Serverless.
*   **Schema Design**: Key tables include `servers`, `channels`, `channelCategories`, `serverRoles`, `serverMembers`, `serverBans`, `serverInvites`, `tournaments`, `teams`, `matches`, `channelMessages`, and `users`.
*   **Data Relationships**: Employs one-to-many and many-to-many relationships.
*   **Validation**: Utilizes Zod schemas generated from Drizzle tables for type-safe data validation.
*   **File Uploads**: Uses Replit Object Storage with presigned URLs for persistent file storage. The upload flow:
    1. Client requests a presigned URL via `POST /api/uploads/request-url`
    2. Client uploads file directly to the presigned URL
    3. Client normalizes the object path via `POST /api/objects/normalize` to set public ACL
    4. Files are served via `/objects/{objectPath}` route
*   **Legacy Upload Support**: Old uploads using `/api/uploads/{fileId}` are still supported for backward compatibility.

## Development Rules

### Cache Invalidation (CRITICAL)
When making admin mutations that affect data displayed on public pages, **ALWAYS invalidate ALL related query keys**:

**Server changes (verification, bans, etc.):**
```typescript
queryClient.invalidateQueries({ queryKey: ["/api/admin/servers"] });
queryClient.invalidateQueries({ queryKey: ["/api/mobile-preview/servers"] });
queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] }); // Tournaments display server verified badge
```

**Tournament changes (deletion, visibility, etc.):**
```typescript
queryClient.invalidateQueries({ queryKey: ["/api/admin/tournaments"] });
queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
```

**User changes (bans, permissions, etc.):**
```typescript
queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
// Add any public user-related endpoints as needed
```

**Rule of thumb:** If admin panel changes something, ask "Where else is this data displayed?" and invalidate those caches too.

### Verified Server Badge
The verified badge system:
- `servers.isVerified` field (integer: 0=not verified, 1=verified)
- Admin panel toggles verification via `/api/admin/servers/:id/verify`
- Badge displays on: Discovery page, My Servers, Server Detail, Tournament posters (homepage)
- Uses `isServerVerified(serverId)` helper function that checks server data from `/api/mobile-preview/servers`

## Scaling Optimizations (20K Users Target)

### Database Indexes
Comprehensive indexes added to all high-traffic tables for fast queries:
- `servers`: owner_id, is_verified, created_at
- `tournaments`: server_id, status, created_at
- `matches`: tournament_id, status, created_at
- `server_members`: server_id, user_id, joined_at, role_id
- `teams`: tournament_id, registration_date
- `users`: email, username

### Caching Layer (server/cache.ts)
In-memory LRU cache with TTL support:
- `SERVERS_LIST`: 60s TTL for discovery/server list endpoints
- `TOURNAMENTS_PUBLIC`: 60s TTL for homepage tournament list
- Pattern-based cache invalidation on mutations
- Automatic TTL cleanup

### Rate Limiting
Three-tier rate limiting with express-rate-limit:
- **General API**: 100 requests/minute per IP
- **Auth endpoints**: 10 requests/15 minutes per IP (brute force protection)
- **Write operations**: 30 requests/minute per IP

### WebSocket Hardening
- Connection limit: 10 connections per user
- Message size limit: 64KB
- Heartbeat interval: 30 seconds
- Automatic cleanup of stale connections
- Connection tracking per user/IP

### Frontend Optimization
- React.lazy code splitting for non-critical pages
- Suspense fallback with loading spinner
- Critical pages (Login, Register, PreviewHome) eagerly loaded
- All other pages lazy loaded

### Image Optimization (Mobile Performance)
**OptimizedImage Component** (`client/src/components/ui/optimized-image.tsx`):
- Lazy loading via IntersectionObserver (100px rootMargin)
- Thumbnail-first loading (64px, 150px, 300px WebP thumbnails)
- Auto-upgrade to full resolution when:
  - `priority={true}` (modals, detail views)
  - `loadFullOnTap={false}` (non-interactive views)
- Click-to-load full resolution for interactive images
- Client-side image cache (Map) to prevent refetching

**Server-side Thumbnail Generation**:
- Sharp generates WebP thumbnails on upload
- Three sizes: 64px (sm), 150px (md), 300px (lg)
- Stored alongside originals: `{fileId}_thumb_{size}.webp`

**API Endpoints**:
- `GET /api/uploads/:fileId` - Full image with cache headers
- `GET /api/uploads/:fileId/thumbnail?size=150` - Thumbnail with cache headers
- Cache-Control: `public, max-age=31536000, immutable`
- ETag support for browser caching

**Usage**:
```tsx
import { OptimizedImage } from "@/components/ui/optimized-image";

// Lazy-loaded thumbnail in list (click to load full)
<OptimizedImage src={imageUrl} alt="Image" thumbnailSize="lg" />

// Priority image in modal (auto-loads full res)
<OptimizedImage src={imageUrl} alt="Image" priority={true} />

// Non-interactive detail view (auto-loads full res)
<OptimizedImage src={imageUrl} alt="Image" loadFullOnTap={false} />
```

### Express Configuration
- `trust proxy` enabled for proper rate limiting behind Replit's proxy
- Session storage with PostgreSQL (connect-pg-simple) with indexed expire column

## External Dependencies
*   **Database**: Neon PostgreSQL.
*   **Object Storage**: Replit Object Storage (Google Cloud Storage backend).
*   **UI Libraries**: Radix UI, shadcn/ui, Lucide React, class-variance-authority, tailwind-merge, clsx.
*   **Form Management**: React Hook Form, @hookform/resolvers.
*   **Data Fetching**: TanStack Query.
*   **File Upload**: Uppy Core, Uppy Dashboard, Uppy AWS S3 plugin, Uppy Drag Drop, Uppy React.
*   **Date Utilities**: date-fns.
*   **Real-time Communication**: `ws` library (server), native WebSocket API (client).