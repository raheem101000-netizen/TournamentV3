# Module Integration Guide

This guide explains how to integrate each module into your existing tournament dashboard.

## Quick Integration

### 1. Import the Module

```tsx
import { ProfileScreen, ProfileStore } from './mobile/modules/profiles';
import { ThreadsListScreen, MessagingStore } from './mobile/modules/messaging';
import { DiscoveryScreen, DiscoveryStore } from './mobile/modules/discovery';
import { NotificationsScreen, NotificationsStore } from './mobile/modules/notifications';
```

### 2. Initialize Data (First Time Only)

```tsx
import { initializeModules } from './mobile/lib/initializeModules';

// Call once when app starts
useEffect(() => {
  initializeModules();
}, []);
```

### 3. Add to Navigation

#### Stack Navigator
```tsx
<Stack.Screen name="Profile" component={ProfileScreen} />
<Stack.Screen name="Messages" component={ThreadsListScreen} />
<Stack.Screen name="Discovery" component={DiscoveryScreen} />
<Stack.Screen name="Notifications" component={NotificationsScreen} />
```

#### Tab Navigator
```tsx
<Tab.Navigator>
  <Tab.Screen name="Tournaments" component={YourTournamentDashboard} />
  <Tab.Screen name="Discover" component={DiscoveryScreen} />
  <Tab.Screen name="Messages" component={ThreadsListScreen} />
  <Tab.Screen name="Profile" component={ProfileScreen} />
</Tab.Navigator>
```

## Module-Specific Integration

### Profiles Module

```tsx
// In your tournament results page
import { ProfileStore } from './mobile/modules/profiles';

// Award trophy to winner
const awardTrophyToWinner = async (userId, tournamentId) => {
  await ProfileStore.awardTrophy({
    userId,
    tournamentId,
    title: '🏆 Tournament Champion',
    description: `Winner of ${tournamentName}`,
    awardedBy: 'Tournament System',
    awardedAt: new Date().toISOString(),
  });
};

// Display user profile
<ProfileScreen userId={playerId} />
```

### Messaging Module

```tsx
// Create team chat when tournament starts
import { MessagingStore } from './mobile/modules/messaging';

const createTeamChat = async (teamName, memberIds) => {
  const thread = await MessagingStore.createGroupThread(
    currentUserId,
    `${teamName} Chat`,
    memberIds
  );
  return thread;
};

// Open chat from tournament page
<Button onPress={() => navigation.navigate('Chat', { threadId })} />
```

### Discovery Module

```tsx
// Show in main navigation
<DiscoveryScreen
  onNavigateToTournament={(tournamentId) => {
    navigation.navigate('TournamentDetails', { tournamentId });
  }}
  onJoinTournament={async (tournamentId) => {
    // Your existing tournament join logic
    await yourAPI.joinTournament(tournamentId);
  }}
/>
```

### Notifications Module

```tsx
// Send notification when user is invited
import { NotificationsStore } from './mobile/modules/notifications';

const inviteToTournament = async (userId, tournamentId) => {
  await NotificationsStore.createNotification({
    userId,
    type: 'tournament_invite',
    title: 'Tournament Invitation',
    body: `You've been invited to ${tournamentName}`,
    data: { tournamentId },
    isRead: false,
  });
};

// Show notification badge
const unreadCount = await NotificationsStore.getUnreadCount(currentUserId);
<Badge count={unreadCount} />
```

## Navigation Props

All screens accept navigation callbacks:

```tsx
// Profiles
<ProfileScreen
  userId="optional-user-id"
  onNavigateToEdit={() => {}}
  onNavigateToFriends={() => {}}
/>

// Messaging
<ThreadsListScreen
  onNavigateToThread={(threadId) => {}}
  onNavigateToNewChat={() => {}}
/>

<ChatScreen
  threadId="required"
  onNavigateToProfile={(userId) => {}}
/>

// Discovery
<DiscoveryScreen
  onNavigateToTournament={(tournamentId) => {}}
  onJoinTournament={(tournamentId) => {}}
/>

// Notifications
<NotificationsScreen
  onNavigateToThread={(threadId) => {}}
  onNavigateToProfile={(userId) => {}}
  onNavigateToTournament={(tournamentId) => {}}
/>
```

## Storage Keys

All modules use these storage keys (defined in `lib/storage.ts`):

- `CURRENT_USER` - Current user profile
- `PROFILES` - All user profiles
- `FRIEND_REQUESTS` - Friend requests
- `FRIENDSHIPS` - Friend relationships
- `TROPHIES` - User trophies
- `CHAT_THREADS` - Chat conversations
- `MESSAGES` - All messages
- `DM_REQUESTS` - DM requests
- `TOURNAMENTS` - Tournament data
- `NOTIFICATIONS` - User notifications

## Best Practices

1. **Initialize Once**: Call `initializeModules()` only on first app launch
2. **Navigation**: Always provide navigation callbacks
3. **User Context**: Modules get current user from `ProfileStore.getCurrentUser()`
4. **Offline First**: All data works offline, sync to backend later
5. **Modular**: Import only what you need

## Example: Complete Integration

```tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { initializeModules } from './mobile/lib/initializeModules';

// Your existing screens
import TournamentDashboard from './screens/TournamentDashboard';

// Mobile modules
import { DiscoveryScreen } from './mobile/modules/discovery';
import { ThreadsListScreen } from './mobile/modules/messaging';
import { NotificationsScreen } from './mobile/modules/notifications';
import { ProfileScreen } from './mobile/modules/profiles';

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    initializeModules();
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Dashboard" component={TournamentDashboard} />
        <Tab.Screen name="Discover" component={DiscoveryScreen} />
        <Tab.Screen name="Messages" component={ThreadsListScreen} />
        <Tab.Screen name="Notifications" component={NotificationsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```
