import { LocalStorage, StorageKeys } from './storage';
import {
  seedProfiles,
  seedFriendships,
  seedTrophies,
  seedChatThreads,
  seedMessages,
  seedTournaments,
  seedNotifications,
  currentUserId,
} from './seedData';
import { ProfileStore } from '../modules/profiles/store/profileStore';

export async function initializeModules() {
  try {
    const currentUser = await ProfileStore.getCurrentUser();
    if (currentUser) {
      console.log('Modules already initialized');
      return;
    }

    console.log('Initializing modules with seed data...');

    await LocalStorage.setArray(StorageKeys.PROFILES, seedProfiles);
    await LocalStorage.setArray(StorageKeys.FRIENDSHIPS, seedFriendships);
    await LocalStorage.setArray(StorageKeys.TROPHIES, seedTrophies);
    await LocalStorage.setArray(StorageKeys.CHAT_THREADS, seedChatThreads);
    await LocalStorage.setArray(StorageKeys.MESSAGES, seedMessages);
    await LocalStorage.setArray(StorageKeys.TOURNAMENTS, seedTournaments);
    await LocalStorage.setArray(StorageKeys.NOTIFICATIONS, seedNotifications);

    await ProfileStore.setCurrentUser(
      seedProfiles.find(p => p.id === currentUserId)!
    );

    console.log('Modules initialized successfully!');
  } catch (error) {
    console.error('Error initializing modules:', error);
  }
}

export async function clearAllData() {
  await LocalStorage.clear();
  console.log('All data cleared');
}
