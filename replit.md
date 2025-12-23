# Tournament Management Platform

## Overview

This project is a web application featuring mobile preview pages and a comprehensive tournament management platform. It provides a Discord-style server system for creating and managing gaming communities with public channels and a private "Tournament Dashboard" for tournament organization. The platform supports various tournament formats (Round Robin, Single Elimination, Swiss System), bracket visualization, team standings, match tracking, and score submission. Its primary purpose is to enable server owners to efficiently organize and manage competitive gaming tournaments through a centralized, private dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### December 23, 2025 (Tournament Creation Multi-Step Form & Payment Method - COMPLETE ✅)
- **Converted tournament creation to 3-step form**:
  - ✅ Step 1: Basic Information (name, game, organizer name)
  - ✅ Step 2: Format & Teams (format, total teams, swiss rounds if applicable)
  - ✅ Step 3: Payments & Appearance (payment method, entry fee, prize reward, image URL, image fit)
  
- **Added Payment Method field to Step 3**:
  - ✅ Dropdown with options: "No Payment Required", "Stripe", "PayPal", "Cryptocurrency"
  - ✅ Field description explains: "How participants will pay entry fees (if applicable)"
  - ✅ Entry fee and Prize fields now grouped together with payment method on Step 3
  - ✅ Image URL and Image Fit settings also on Step 3
  - ✅ Progress indicator bar at top shows Step 1/2/3
  
- **Multi-step form navigation**:
  - ✅ Previous/Next buttons for moving between steps
  - ✅ Create Tournament button appears only on final step
  - ✅ Visual step indicator fills as user progresses
  - ✅ All form data persists as user moves between steps

### December 23, 2025 (Profile Picture Cache Fix - COMPLETE ✅)
- **Fixed profile picture caching issue**:
  - ✅ Changed auth context staleTime from `Infinity` to `5 * 60 * 1000` (5 minutes)
  - ✅ Added explicit `refetchUser()` call after profile updates
  - ✅ Profile pictures now update immediately across entire app (chat, account, match chat, etc.)
  - ✅ Ensures all components using `useAuth()` see updated avatar instantly

### December 20, 2025 (Match Chat System - PERMANENT IMPLEMENTATION ✅)
- **PERMANENT: Match chats automatically appear in ALL participants' Messages inbox**:
  - ✅ `createMatchThreadsForAllMembers()` helper function automatically creates threads for all team members when a match is created
  - ✅ Called automatically at ALL 4 match creation points in routes.ts
  - ✅ Thread title format: "Match Chat: @username1 vs @username2" (matches dashboard)
  - ✅ Messages synced to inbox via `getOrCreateMatchThread()` on every message send
  
- **PERMANENT: Message send validation prevents silent failures**:
  - ✅ Match message endpoint validates userId is present
  - ✅ Both endpoints validate message content or image is provided
  - ✅ Fixed undefined `replyToId` variable in preview-messages.tsx (set to null)
  
- **Storage methods for match threads**:
  - ✅ `getMatchThreadForUser()` - Get existing thread for user/match
  - ✅ `getOrCreateMatchThread()` - Create or return existing thread
  - ✅ Fixed duplicate display by excluding match threads from direct threads query (matchId IS NULL)

### December 18, 2025 (Reply Feature Removed)
- **Removed reply functionality from all chat interfaces** (user requested removal)

### December 17, 2025 (Message Edit/Delete Functionality - COMPLETE ✅)
- **Implemented message editing and deletion across all chat interfaces**:
  - ✅ Added storage methods: `updateChatMessage`, `deleteChatMessage`, `updateThreadMessage`, `deleteThreadMessage`
  - ✅ Added API endpoints: PATCH/DELETE for match messages, thread messages, and channel messages
  - ✅ Single click on own message shows vertical action menu with Edit, Delete, Close options
  - ✅ ChatChannel.tsx, RichMatchChat.tsx, preview-messages.tsx all support click-to-edit interaction
  - ✅ All chat interfaces maintain auto-scroll to latest message via messagesEndRef
  - ✅ Delete actions require confirmation dialog before execution
  - ✅ Vertical action menu positioned absolutely over the message content
  - ✅ Click message again or press Close to dismiss menu

### December 16, 2025 (Tournament Management Features - COMPLETE ✅)
- **Fixed unlimited players showing "-1/-1" on tournament posters**:
  - ✅ preview-home.tsx: Shows "Unlimited" instead of "-1/-1" for participant count
  - ✅ mobile-preview-home.tsx: Shows "Unlimited" for teams display
  - ✅ tournament-register.tsx: Shows "Unlimited" for Total Teams

- **Added delete tournament functionality**:
  - ✅ DELETE /api/tournaments/:id endpoint with authorization check
  - ✅ Only tournament organizer or server owner can delete
  - ✅ Uses query parameter for userId (DELETE body limitations)
  - ✅ Confirmation dialog with destructive action button
  - ✅ Trash icon button in tournament detail header

- **Added share tournament feature on homepage**:
  - ✅ Share button on each tournament poster opens dialog
  - ✅ Enter username to send tournament via DM
  - ✅ Creates/finds message thread with recipient
  - ✅ Sends tournament link message to recipient

### December 14, 2025 (Friend Request System - COMPLETE ✅)
- **Implemented complete friend request system**:
  - ✅ Created `friend_requests` table with status tracking (pending/accepted/declined)
  - ✅ Added storage methods for CRUD operations on friend requests
  - ✅ Added API endpoints: send request, get status, accept, decline, get pending, get friends list
  - ✅ Updated UserProfileModal to show correct button state based on friend status
  - ✅ Shows "Add Friend" when no request exists
  - ✅ Shows "Request Sent" when pending request from current user
  - ✅ Shows "Accept/Decline" when pending request to current user
  - ✅ Shows "Friends" when accepted
  - ✅ Added Friends section to profile page with avatars grid
  - ✅ Click on friend opens their profile modal
  - ✅ Friend count in profile shows actual count from API

### December 14, 2025 (DM System & Inbox Improvements - COMPLETE ✅)
- **Fixed chat text alignment**:
  - ✅ All messages now consistently left-aligned

- **Fixed direct messages linking**:
  - ✅ Messages now visible to both sender and recipient
  - ✅ Thread creation checks for existing thread between users via `participantId`
  - ✅ Existing threads are reused instead of creating duplicates
  - ✅ Both `userId` (creator) and `participantId` (recipient) stored in thread
  - ✅ GET /api/message-threads now shows correct name based on viewer (creator sees recipient, recipient sees creator)

- **Fixed Add Friend button functionality**:
  - ✅ Friend request endpoint properly creates notifications
  - ✅ Notification includes sender ID for proper attribution

- **Fixed inbox preview to show sender and message**:
  - ✅ Thread updates track `lastMessageSenderId` when messages sent
  - ✅ Inbox displays "SenderName: message" format
  - ✅ Optimized with batch user lookup to avoid N+1 queries
  - ✅ Batch fetches all user info (creators, participants, senders) for efficiency

### December 7, 2025 (Mention System Implementation - COMPLETE ✅)
- **Fixed mention dropdown to only trigger on "@" symbol**:
  - ✅ Removed PopoverTrigger that was auto-opening dropdown
  - ✅ Dropdown now only appears when typing "@"
  - ✅ Mentions don't open on input focus
  - ✅ Positioned dropdown controlled purely by mention state

- **Made mentions clickable and visually distinct**:
  - ✅ Added `renderMessageWithMentions()` parser function
  - ✅ Parses @username patterns using regex
  - ✅ Mentions render as styled buttons with primary color background
  - ✅ Clicking a mention opens that user's profile modal
  - ✅ Visual distinction: primary/10 background with hover effect

- **Implemented mention notifications**:
  - ✅ When sending a message with mentions, toast notification shows who was mentioned
  - ✅ Detection logic extracts all @usernames from message text
  - ✅ Notification displays "You mentioned: @user1, @user2" etc.

### November 27, 2025 (Registration Fields Save Fix - COMPLETE ✅)
- **Fixed registration fields not being saved to database**:
  - ✅ Auto-initialize registration config with default "Team Name" field when registration is enabled
  - ✅ Ensures config is never undefined - fields now always reach the backend
  - ✅ No longer requires users to click "Save Registration Form" button explicitly
  - ✅ Updated all 17 existing tournaments with default fields via database migration
  - ✅ New tournaments now save registration fields automatically

### November 25, 2025 (Achievements Visibility & Team Game Field - COMPLETE ✅)
- **Fixed achievements visibility for visitors**:
  - ✅ Achievements now display when visiting other players' profiles
  - ✅ Achievements section visible to all visitors, not just profile owner
  - ✅ Implementation: Fetch viewed user by username via `/api/users/username/:username`, then use their ID to fetch achievements
  - ✅ Fixed TypeScript: Added `User | undefined` type annotation for viewed user data query
  - ✅ Fixed Button variant from "link" to "ghost" for achievement server links

- **Added "Game" field to teams**:
  - ✅ Added `game` column to teams schema 
  - ✅ Added game input field to team creation form
  - ✅ Game displays in team profile modals for both owner and visitors

- **Fixed homepage filters to work together**:
  - ✅ Changed from single active filter to multiple selectable filters using `Set<FilterType>`
  - ✅ Prize + No Prize can combine, Free Entry + Paid Entry can combine
  - ✅ Example: Select "Prize" + "Free Entry" to show free tournaments with prize pools
  - ✅ "All" button resets all filters

## System Architecture

### Frontend Architecture

*   **Technology Stack**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, Radix UI primitives with shadcn/ui for UI components, Tailwind CSS for styling, and Vite for building.
*   **Design System**: Gaming-inspired aesthetic (Discord, Challonge/Battlefy, Linear) with custom typography, responsive 12-column grid layouts, standardized spacing, and dark/light theme support.
*   **Key Features**: Server and channel management (including a dedicated Tournament Dashboard with access enforcement), robust member permissions system, tournament creation and visualization (brackets, standings, match tracking), and real-time match chat.
*   **Routing**: Structured for mobile preview pages, server-specific views (`/server/:serverId`), tournament details (`/tournament/:id`), a home page, and user account management.
*   **Channel System**: Supports unlimited custom channels with 35 icons. New servers auto-create "Tournament Dashboard", "Announcements", and "General Chat".
*   **User Account Management**: Account settings for profile management, avatar upload, password change, language, and account disable/delete.
*   **Server Settings**: Overview for name, description, icon/background upload; Roles management with comprehensive permissions; Bans management; and Invite link generation.
*   **Tournament Features**: Entry fee and prize fields support custom text. Robust tournament poster upload system with live preview.
*   **Homepage Filters**: Functional filter badges for "All", "Prize", "No Prize", "Free Entry", "Paid Entry" with smart matching logic.

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

## External Dependencies

*   **Database**: Neon PostgreSQL.
*   **Object Storage**: Replit Object Storage (Google Cloud Storage backend).
*   **UI Libraries**: Radix UI, shadcn/ui, Lucide React, class-variance-authority, tailwind-merge, clsx.
*   **Form Management**: React Hook Form, @hookform/resolvers.
*   **Data Fetching**: TanStack Query.
*   **File Upload**: Uppy Core, Uppy Dashboard, Uppy AWS S3 plugin, Uppy Drag Drop, Uppy React.
*   **Date Utilities**: date-fns.
*   **Development Tools**: tsx, esbuild, drizzle-kit, Vite plugins.
*   **Fonts**: Google Fonts (Inter, Space Grotesk).
*   **Real-time Communication**: `ws` library (server), native WebSocket API (client).