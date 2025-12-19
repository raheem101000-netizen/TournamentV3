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

export async function initializeApp() {
  const isInitialized = await LocalStorage.getItem(StorageKeys.INITIALIZED);
  
  if (isInitialized) {
    return;
  }

  await LocalStorage.setArray(StorageKeys.PROFILES, seedProfiles);
  await LocalStorage.setItem(StorageKeys.CURRENT_USER, seedProfiles[0]);
  await LocalStorage.setArray(StorageKeys.FRIENDSHIPS, seedFriendships);
  await LocalStorage.setArray(StorageKeys.TROPHIES, seedTrophies);
  await LocalStorage.setArray(StorageKeys.CHAT_THREADS, seedChatThreads);
  await LocalStorage.setArray(StorageKeys.MESSAGES, seedMessages);
  await LocalStorage.setArray(StorageKeys.TOURNAMENTS, seedTournaments);
  await LocalStorage.setArray(StorageKeys.NOTIFICATIONS, seedNotifications);
  await LocalStorage.setArray(StorageKeys.FRIEND_REQUESTS, []);
  await LocalStorage.setArray(StorageKeys.DM_REQUESTS, []);

  await LocalStorage.setItem(StorageKeys.INITIALIZED, true);
  
  console.log('App initialized with seed data for user:', currentUserId);
}
