# 10-on-10 + Mobile App Integration - Expo Snack Ready

## What Was Integrated

This is your 10-on-10 Expo Router app with mobile features (Discovery, Messages, Notifications) integrated.

## Key Files Added/Modified for Integration

### 1. New Tab Screens
- `src/app/main/tabs/Discovery.tsx` - Re-exports mobile Discovery screen
- `src/app/main/tabs/Messages.tsx` - Re-exports mobile Messages screen  
- `src/app/main/tabs/Notifications.tsx` - Re-exports mobile Notifications screen

### 2. Mobile App Modules (NEW)
- `src/modules/discovery/` - Tournament discovery module
- `src/modules/messaging/` - Chat/messaging module
- `src/modules/notifications/` - Notifications module
- `src/modules/profiles/` - User profiles module
- `src/modules/tournaments/` - Tournament data module

### 3. Data Initialization
- `src/lib/initializeModules.ts` - Initializes mobile app data on startup
- `src/lib/seedData.ts` - Sample data (profiles, messages, tournaments, etc.)
- `src/lib/storage.ts` - AsyncStorage wrapper for data persistence

### 4. Navigation Updates
- `src/app/main/tabs/_layout.tsx` - Added 3 new tabs (Discovery, Messages, Notifications)
- `src/utils/constants/Tabs.ts` - Added new tab constants
- `src/components/Tabs/TabBarIcon.tsx` - Added icons for new tabs

### 5. Root Layout
- `src/app/_layout.tsx` - Added initializeModules() call on startup

## Total Tabs (6)
1. Home (existing)
2. Discovery (new - tournament discovery)
3. Messages (new - chat threads)
4. Notifications (new - alerts)
5. MyServers (existing)
6. Account (existing)

## For Expo Snack

Upload the contents of the `src/` folder and the config files:
- All files in `src/` directory
- `package.json`
- `app.config.ts`
- `tsconfig.json`

The app will auto-initialize with sample data on first launch.
