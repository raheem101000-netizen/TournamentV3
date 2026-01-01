import AsyncStorage from '@react-native-async-storage/async-storage';

export class LocalStorage {
  private static async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  }

  private static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
    }
  }

  private static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  }

  static async getArray<T>(key: string): Promise<T[]> {
    const data = await this.getItem<T[]>(key);
    return data || [];
  }

  static async setArray<T>(key: string, value: T[]): Promise<void> {
    await this.setItem(key, value);
  }

  static async addToArray<T extends { id: string }>(key: string, item: T): Promise<T[]> {
    const array = await this.getArray<T>(key);
    array.push(item);
    await this.setArray(key, array);
    return array;
  }

  static async updateInArray<T extends { id: string }>(
    key: string,
    id: string,
    updates: Partial<T>
  ): Promise<T[]> {
    const array = await this.getArray<T>(key);
    const index = array.findIndex(item => item.id === id);
    if (index !== -1) {
      array[index] = { ...array[index], ...updates };
      await this.setArray(key, array);
    }
    return array;
  }

  static async removeFromArray<T extends { id: string }>(key: string, id: string): Promise<T[]> {
    const array = await this.getArray<T>(key);
    const filtered = array.filter(item => item.id !== id);
    await this.setArray(key, filtered);
    return filtered;
  }

  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

export const StorageKeys = {
  CURRENT_USER: 'current_user',
  PROFILES: 'profiles',
  FRIEND_REQUESTS: 'friend_requests',
  FRIENDSHIPS: 'friendships',
  TROPHIES: 'trophies',
  CHAT_THREADS: 'chat_threads',
  MESSAGES: 'messages',
  DM_REQUESTS: 'dm_requests',
  TOURNAMENTS: 'tournaments',
  NOTIFICATIONS: 'notifications',
} as const;
