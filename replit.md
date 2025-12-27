# Tournament Management Platform

## Overview
This project is a web application offering a comprehensive tournament management platform with mobile preview capabilities. It provides a Discord-style server system for creating and managing gaming communities, featuring public channels and a private "Tournament Dashboard" for organization. The platform supports various tournament formats (Round Robin, Single Elimination, Swiss System), bracket visualization, team standings, match tracking, and score submission. Its core purpose is to empower server owners to efficiently organize and manage competitive gaming tournaments through a centralized, private dashboard, aiming to be a leading solution in esports and competitive gaming.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
*   **Technology Stack**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, Radix UI primitives with shadcn/ui for UI components, Tailwind CSS for styling, and Vite for building.
*   **Authentication**: Session-based with bcrypt. Optimized for zero-latency UI updates by using `queryClient.setQueryData` on login and instant client-side redirection via `wouter`. Includes a themed loading spinner in `App.tsx` to prevent white screens during state transitions.
*   **Design System**: Gaming-inspired aesthetic (Discord, Challonge/Battlefy, Linear) with custom typography, responsive 12-column grid layouts, standardized spacing, and dark/light theme support. Login and registration pages feature a distinctive "10/10" circular logo design with monospace typography on a dark background (inspired by the 'dara' visual style).
*   **Key Features**: Server and channel management (including a dedicated Tournament Dashboard with access enforcement), robust member permissions system, tournament creation and visualization (brackets, standings, match tracking), and real-time match chat.
*   **Routing**: Structured for mobile preview pages, server-specific views (`/server/:serverId`), tournament details (`/tournament/:id`), a home page, and user account management.
*   **Channel System**: Supports unlimited custom channels with 35 icons. New servers auto-create "Tournament Dashboard", "Announcements", and "General Chat".
*   **User Account Management**: Account settings for profile management, avatar upload, password change, language, and account disable/delete.
*   **Server Settings**: Overview for name, description, icon/background upload; Roles management with comprehensive permissions; Bans management; and Invite link generation.
*   **Tournament Features**: Entry fee and prize fields support custom text. Robust tournament poster upload system with live preview. Homepage filters for "All", "Prize", "No Prize", "Free Entry", "Paid Entry" with smart matching logic.

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

## External Dependencies
*   **Database**: Neon PostgreSQL.
*   **Object Storage**: Replit Object Storage (Google Cloud Storage backend).
*   **UI Libraries**: Radix UI, shadcn/ui, Lucide React, class-variance-authority, tailwind-merge, clsx.
*   **Form Management**: React Hook Form, @hookform/resolvers.
*   **Data Fetching**: TanStack Query.
*   **File Upload**: Uppy Core, Uppy Dashboard, Uppy AWS S3 plugin, Uppy Drag Drop, Uppy React.
*   **Date Utilities**: date-fns.
*   **Real-time Communication**: `ws` library (server), native WebSocket API (client).