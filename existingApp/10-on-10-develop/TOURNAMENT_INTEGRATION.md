# Tournament Management System Integration

## Overview
This document describes the integration of a tournament management system into the existing React Native Expo Router app. The tournament dashboard functions as a special channel type within servers, accessible only to server owners.

## Architecture

### Tournament Channel Model
- Tournament channels are identified by `channel.tournament === true` flag
- **Critical Link**: Tournament records use the channel ID as their primary ID
  - When creating a tournament for a channel, use `TournamentStore.createTournamentForChannel(channelId, data)`
  - This ensures the dashboard can load tournament data via `getTournamentByChannelId(channelId)`

### Module Structure
```
src/modules/tournaments/
├── screens/
│   └── TournamentDashboardScreen.tsx    # Main dashboard with tab navigation
├── components/
│   ├── OverviewTab.tsx                  # Tournament overview and stats
│   ├── RegistrationsTab.tsx             # Team registrations management
│   ├── BracketsTab.tsx                  # Tournament brackets display
│   └── SettingsTab.tsx                  # Tournament settings
└── store/
    └── tournamentStore.ts               # Tournament CRUD operations
```

### Data Persistence
- Uses AsyncStorage for local data persistence
- Storage wrapper at `src/lib/storage.ts` provides consistent API
- Related stores:
  - `TournamentStore` - Tournament management
  - `RegistrationStore` - Team registration tracking

## Navigation Flow

1. **Server → Channel List**: User views available channels
2. **Select Tournament Channel**: Channel has `tournament: true` flag
3. **Permission Check**: Verify user is server owner (serverHostId === currentUserId)
4. **Dashboard Access**: If authorized, render `TournamentDashboardScreen`
5. **Permission Denied**: Non-owners see "Access Denied" message

### Route Handler
Location: `src/app/main/[serverInfo]/[channel].tsx`

```typescript
// Check if tournament channel
const isTournamentChannel = channelDetails?.tournament === true

// Verify permissions
const currentUserId = userData?.users?.user?.me?._id
const isServerOwner = serverHostId === currentUserId

// Show dashboard if authorized
if (isTournamentChannel && isServerOwner) {
  return <TournamentDashboardScreen />
}
```

## Tournament Dashboard Features

### Tabs
1. **Overview**: Tournament details, status, participant count
2. **Registrations**: Team list, registration management
3. **Brackets**: Tournament bracket visualization
4. **Settings**: Tournament configuration (name, game, format, prizes)

### Data Loading
The dashboard loads tournament data using the channel ID:

```typescript
const channelTournament = await TournamentStore.getTournamentByChannelId(channel)
```

## Creating Tournaments for Channels

**IMPORTANT**: Always create tournaments using the channel-specific method:

```typescript
// Correct - Links tournament to channel
await TournamentStore.createTournamentForChannel(channelId, {
  name: "Summer Championship",
  game: "League of Legends",
  format: "single-elimination",
  maxTeams: 16,
  organizerId: userId,
  status: "upcoming",
  startDate: new Date().toISOString(),
  // ... other tournament fields
})

// Wrong - Creates tournament with random ID, won't be found by dashboard
await TournamentStore.createTournament({
  id: nanoid(), // Don't do this!
  name: "Summer Championship",
  // ...
})
```

## Type Definitions

Key types defined in `src/types/domain.ts`:

- `Tournament` - Main tournament data structure
- `TournamentTeam` - Team information
- `TournamentRegistration` - Registration records
- `BracketMatch` - Match data for brackets
- `BracketRound` - Round structure

## Security & Permissions

- **Server Owner Only**: Tournament dashboard restricted to server owners
- **Permission Check**: Performed before rendering dashboard
- **Graceful Denial**: Non-owners see friendly "Access Denied" message
- **User ID Comparison**: Uses GraphQL-provided serverHostId and currentUserId

## AsyncStorage Keys

Defined in `src/lib/storage.ts`:

```typescript
export const StorageKeys = {
  TOURNAMENTS: 'tournaments',
  REGISTRATIONS: 'registrations',
  MESSAGES: 'messages',
  PROFILES: 'profiles',
  // ...
}
```

## Testing Integration

To test the tournament integration:

1. **Create a Server**: Use existing server creation flow
2. **Add Tournament Channel**: Create channel with `tournament: true` flag
3. **Access as Owner**: Server owner should see Tournament Dashboard
4. **Access as Non-Owner**: Other users should see permission denied
5. **Create Tournament Data**: Use `TournamentStore.createTournamentForChannel()`
6. **Verify Dashboard**: Check all tabs load and display data correctly

## Development Notes

### TypeScript Paths
- Base URL: `./src`
- Alias: `@/*` maps to `src/*`
- Import example: `import { TournamentStore } from '@/modules/tournaments'`

### AsyncStorage Methods
- `LocalStorage.getItem<T>(key)` - Retrieve single item
- `LocalStorage.setItem<T>(key, value)` - Store single item
- `LocalStorage.getArray<T>(key)` - Retrieve array
- `LocalStorage.addToArray<T>(key, item)` - Add to array
- `LocalStorage.updateInArray<T>(key, id, updates)` - Update array item
- `LocalStorage.removeFromArray(key, id)` - Remove from array

## Future Enhancements

Potential improvements for the tournament system:

1. **Real-time Updates**: Add WebSocket support for live bracket updates
2. **Team Chat**: Integrate team messaging within tournament context
3. **Match Scheduling**: Automated match scheduling and notifications
4. **Statistics Tracking**: Detailed player/team performance analytics
5. **Seeding System**: Automatic team seeding based on rankings
6. **Multi-format Support**: Double elimination, round robin, swiss
7. **Prize Distribution**: Automated prize tracking and distribution

## Troubleshooting

### Tournament Not Found
- **Cause**: Tournament wasn't created with `createTournamentForChannel()`
- **Fix**: Ensure tournament ID matches channel ID

### Permission Denied
- **Cause**: User is not the server owner
- **Fix**: Only server owners can access tournament channels

### Data Not Persisting
- **Cause**: AsyncStorage errors or permission issues
- **Fix**: Check console logs for AsyncStorage errors

### Tab Content Empty
- **Cause**: Tournament data not loaded or missing fields
- **Fix**: Verify tournament was created with all required fields

## Integration Checklist

- ✅ Tournament module created with dashboard screen
- ✅ Navigation routing configured for tournament channels
- ✅ Permission checks implemented for server owners only
- ✅ AsyncStorage integration for data persistence
- ✅ Type definitions for all tournament entities
- ✅ Tab-based UI for dashboard (Overview, Registrations, Brackets, Settings)
- ✅ Tournament-channel linkage via channelId as tournamentId
- ✅ Access control with graceful permission denied handling
- ⏳ End-to-end testing pending

## Code References

### Key Files
- **Dashboard Screen**: `src/modules/tournaments/screens/TournamentDashboardScreen.tsx`
- **Tournament Store**: `src/modules/tournaments/store/tournamentStore.ts`
- **Route Handler**: `src/app/main/[serverInfo]/[channel].tsx`
- **Type Definitions**: `src/types/domain.ts`
- **Storage Wrapper**: `src/lib/storage.ts`

### Export Index
Tournament module exports available at `src/modules/tournaments/index.ts`:

```typescript
export { TournamentDashboardScreen } from './screens/TournamentDashboardScreen'
export { TournamentStore } from './store/tournamentStore'
```

---

**Last Updated**: November 13, 2025
**Integration Status**: Complete - Ready for Testing
