# Tournament Manager - Mobile App Modules

This directory contains **4 self-contained, modular React Native features** for your tournament management mobile application. Each module is designed to work independently and can be integrated into your existing tournament dashboard.

## 📦 Modules

### 1️⃣ **User Profiles** (`modules/profiles`)
Complete user profile management with social features.

**Features:**
- Upload and edit profile pictures
- Editable bio and display name
- Friend system with requests (send, accept, reject)
- Display trophies awarded by tournament organizers
- View friend lists and manage connections

**Components:**
- `ProfileScreen` - Main profile view with stats and trophies
- `FriendsScreen` - Friend list and friend requests management
- `ProfileHeader` - Reusable profile header component
- `TrophyCard` - Display trophy information
- `FriendRequestCard` - Friend request UI

**Usage:**
```tsx
import { ProfileScreen, FriendsScreen, ProfileStore } from './modules/profiles';

// Display current user's profile
<ProfileScreen />

// Display another user's profile
<ProfileScreen userId="user-id-123" />

// Friends management
<FriendsScreen onNavigateToProfile={(userId) => {/* navigate */}} />

// Award a trophy
await ProfileStore.awardTrophy({
  userId: 'user-id',
  tournamentId: 'tournament-id',
  title: '🏆 Champion',
  description: 'Won the championship!',
  awardedBy: 'Tournament Organizer',
  awardedAt: new Date().toISOString(),
});
```

---

### 2️⃣ **Messaging** (`modules/messaging`)
Full-featured group chats and direct messaging with DM request system.

**Features:**
- Create and join group chats
- Send text messages and images
- Direct messaging (1:1) between users
- DM request system for non-friends
- Read receipts and message timestamps
- Image support in messages

**Components:**
- `ThreadsListScreen` - List of all conversations
- `ChatScreen` - Individual chat/conversation view
- `ThreadListItem` - Chat preview in list
- `MessageBubble` - Individual message display

**Usage:**
```tsx
import { ThreadsListScreen, ChatScreen, MessagingStore } from './modules/messaging';

// Messages list
<ThreadsListScreen
  onNavigateToThread={(threadId) => {/* navigate to chat */}}
  onNavigateToNewChat={() => {/* create new chat */}}
/>

// Chat view
<ChatScreen threadId="thread-123" />

// Create group chat
const thread = await MessagingStore.createGroupThread(
  currentUserId,
  'My Team',
  ['user-1', 'user-2', 'user-3']
);

// Send message
await MessagingStore.sendMessage(
  threadId,
  currentUserId,
  'Hello everyone!',
  optionalImageUri
);
```

---

### 3️⃣ **Tournament Discovery** (`modules/discovery`)
Scrollable feed of tournament posters with join functionality.

**Features:**
- Scrollable tournament feed
- Search tournaments by name, game, or organizer
- Display tournament details (prize, format, entry fee)
- Filter by status (upcoming, in progress, completed)
- Join tournaments directly from the feed

**Components:**
- `DiscoveryScreen` - Main tournament discovery feed
- `TournamentPosterCard` - Tournament poster card with details

**Usage:**
```tsx
import { DiscoveryScreen, DiscoveryStore } from './modules/discovery';

// Discovery feed
<DiscoveryScreen
  onNavigateToTournament={(tournamentId) => {/* view tournament */}}
  onJoinTournament={(tournamentId) => {/* join tournament */}}
/>

// Get tournaments
const allTournaments = await DiscoveryStore.getAllTournaments();
const upcomingOnly = await DiscoveryStore.getUpcomingTournaments();
const byGame = await DiscoveryStore.getTournamentsByGame('Valorant');
```

---

### 4️⃣ **Notifications** (`modules/notifications`)
Alert system for messages, tournament invites, and mentions.

**Features:**
- Notification center with all alerts
- Filter by all/unread notifications
- Badge for unread count
- Different notification types (message, friend request, DM request, tournament invite, mention)
- Mark as read functionality
- Delete individual notifications
- Clear all notifications

**Components:**
- `NotificationsScreen` - Main notifications center
- `NotificationItem` - Individual notification card

**Usage:**
```tsx
import { NotificationsScreen, NotificationsStore } from './modules/notifications';

// Notifications screen
<NotificationsScreen
  onNavigateToThread={(threadId) => {/* open message */}}
  onNavigateToProfile={(userId) => {/* view profile */}}
  onNavigateToTournament={(tournamentId) => {/* view tournament */}}
/>

// Create notification
await NotificationsStore.createNotification({
  userId: 'user-id',
  type: 'tournament_invite',
  title: 'Tournament Invitation',
  body: 'You have been invited to Summer Championship',
  data: { tournamentId: 'tournament-id' },
  isRead: false,
});

// Get unread count for badge
const unreadCount = await NotificationsStore.getUnreadCount(userId);
```

---

## 🚀 Getting Started

### 1. Installation

```bash
cd mobile
npm install
```

**Important**: The app uses `nanoid` for ID generation, which requires a polyfill for React Native. This is already included in `package.json` (`react-native-get-random-values`) and imported at the top of `App.tsx`. No additional setup needed.

### 2. Running the App

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

### 3. Initialize with Seed Data

The app automatically initializes with placeholder data on first launch. The seed data includes:

- **Users**: 4 sample user profiles (including yourself)
- **Friends**: 2 pre-established friendships
- **Trophies**: 3 sample trophies
- **Chat Threads**: 3 sample conversations (1 group, 2 direct)
- **Messages**: Sample chat history
- **Tournaments**: 4 sample tournaments
- **Notifications**: 3 sample notifications

You can test immediately without any backend setup!

---

## 📁 Project Structure

```
mobile/
├── modules/
│   ├── profiles/          # User profiles module
│   │   ├── components/
│   │   ├── screens/
│   │   ├── store/
│   │   └── index.ts       # Module exports
│   ├── messaging/         # Messaging module
│   │   ├── components/
│   │   ├── screens/
│   │   ├── store/
│   │   └── index.ts
│   ├── discovery/         # Tournament discovery
│   │   ├── components/
│   │   ├── screens/
│   │   ├── store/
│   │   └── index.ts
│   └── notifications/     # Notifications module
│       ├── components/
│       ├── screens/
│       ├── store/
│       └── index.ts
├── lib/
│   ├── storage.ts         # Local storage abstraction
│   ├── seedData.ts        # Placeholder data
│   └── initializeModules.ts
├── types/
│   └── domain.ts          # TypeScript interfaces
├── App.tsx                # Main app with navigation
├── package.json
└── README.md
```

---

## 🔌 Integrating with Your Tournament Dashboard

### Option 1: Standalone App
The provided `App.tsx` works as a complete standalone app with bottom tab navigation.

### Option 2: Integrate Individual Modules

Each module exports its screens and stores independently:

```tsx
// In your existing app
import { ProfileScreen } from './mobile/modules/profiles';
import { DiscoveryScreen } from './mobile/modules/discovery';

// Add to your navigation stack
<Stack.Screen name="Profile" component={ProfileScreen} />
<Stack.Screen name="Discovery" component={DiscoveryScreen} />
```

### Option 3: Use as Drawer/Modal Screens

```tsx
import { NotificationsScreen } from './mobile/modules/notifications';
import { ThreadsListScreen } from './mobile/modules/messaging';

// In a drawer or modal
<Drawer.Screen name="Notifications" component={NotificationsScreen} />
<Drawer.Screen name="Messages" component={ThreadsListScreen} />
```

---

## 💾 Data Storage

All modules use **local-first storage** via AsyncStorage:

- **Offline-first**: All data persists locally
- **Fast access**: No network dependency
- **Backend-ready**: Easy to add API sync layer later

### Connecting to Backend (Future)

To connect to your backend API, modify the store files:

```tsx
// Before (local only)
async sendMessage(threadId, senderId, content) {
  const message = { id: nanoid(), threadId, senderId, content, createdAt: new Date().toISOString() };
  await LocalStorage.addToArray(StorageKeys.MESSAGES, message);
  return message;
}

// After (with backend sync)
async sendMessage(threadId, senderId, content) {
  // Save locally first (optimistic update)
  const message = { id: nanoid(), threadId, senderId, content, createdAt: new Date().toISOString() };
  await LocalStorage.addToArray(StorageKeys.MESSAGES, message);
  
  // Sync to backend
  try {
    await fetch(`${API_URL}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  } catch (error) {
    // Handle sync error
  }
  
  return message;
}
```

---

## 🎨 Customization

### Theming

All modules use consistent colors that can be easily customized:

```tsx
// Update colors in any component's StyleSheet
const styles = StyleSheet.create({
  primary: '#4F46E5',    // Primary brand color
  secondary: '#10B981',  // Success/positive actions
  danger: '#EF4444',     // Destructive actions
  // ... etc
});
```

### Typography

Font sizes and weights are consistent across modules for easy theming.

---

## 📱 Navigation Callbacks

All screens accept navigation callbacks as props, making them flexible:

```tsx
<ProfileScreen
  userId="user-123"
  onNavigateToEdit={() => navigation.navigate('EditProfile')}
  onNavigateToFriends={() => navigation.navigate('Friends')}
/>

<MessagingScreen
  onNavigateToThread={(threadId) => navigation.navigate('Chat', { threadId })}
  onNavigateToNewChat={() => navigation.navigate('NewChat')}
/>
```

---

## 🧪 Testing

The modules come with placeholder data for immediate testing:

1. Launch the app
2. All features work offline with seed data
3. Test friend requests, messaging, notifications
4. Award trophies, create chats, join tournaments

---

## 🔄 Syncing with Tournament System

### Tournament Integration

When a user joins a tournament from the Discovery feed:

```tsx
<DiscoveryScreen
  onJoinTournament={async (tournamentId) => {
    // Your tournament join logic here
    await yourTournamentAPI.joinTournament(tournamentId, currentUserId);
    
    // Create notification
    await NotificationsStore.createNotification({
      userId: currentUserId,
      type: 'tournament_invite',
      title: 'Joined Tournament',
      body: 'You successfully joined the tournament!',
      data: { tournamentId },
      isRead: false,
    });
  }}
/>
```

### Trophy Awards

When a tournament organizer awards a trophy:

```tsx
import { ProfileStore } from './mobile/modules/profiles';

// After tournament completion
await ProfileStore.awardTrophy({
  userId: winnerId,
  tournamentId: tournament.id,
  title: '🏆 Champion',
  description: `Won ${tournament.name}`,
  awardedBy: organizerName,
  awardedAt: new Date().toISOString(),
});
```

---

## 📞 Support

For questions or issues:
1. Check module-specific README files
2. Review code examples in this guide
3. Test with provided seed data first

---

## ✅ Features Checklist

- ✅ User Profiles (avatar, bio, friends, trophies)
- ✅ Group Chats (create, join, send messages)
- ✅ Direct Messaging (1:1 chats with request system)
- ✅ Image support in messages
- ✅ Tournament Discovery (scrollable feed)
- ✅ Notifications (all types with badges)
- ✅ Local storage (offline-first)
- ✅ Modular architecture
- ✅ TypeScript types
- ✅ Placeholder data
- ✅ Mobile-friendly UI
- ✅ React Native compatible
- ✅ Backend-ready structure

---

Enjoy building with these modules! 🚀
