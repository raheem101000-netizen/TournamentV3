import { nanoid } from 'nanoid';
import { LocalStorage, StorageKeys } from '../storage';
import type { UserProfile, FriendRequest, Friendship, Trophy } from '@shared/types';

export class ProfileStore {
  static async getCurrentUser(): Promise<UserProfile | null> {
    return await LocalStorage.getItem<UserProfile>(StorageKeys.CURRENT_USER);
  }

  static async setCurrentUser(user: UserProfile): Promise<void> {
    await LocalStorage.setItem(StorageKeys.CURRENT_USER, user);
  }

  static async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      throw new Error('No current user found');
    }
    
    const updated = { ...currentUser, ...updates };
    await this.setCurrentUser(updated);
    
    await LocalStorage.updateInArray<UserProfile>(StorageKeys.PROFILES, currentUser.id, updates);
    
    return updated;
  }

  static async getAllProfiles(): Promise<UserProfile[]> {
    return await LocalStorage.getArray<UserProfile>(StorageKeys.PROFILES);
  }

  static async getProfileById(id: string): Promise<UserProfile | null> {
    const profiles = await this.getAllProfiles();
    return profiles.find(p => p.id === id) || null;
  }

  static async sendFriendRequest(toUserId: string): Promise<FriendRequest> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      throw new Error('No current user found');
    }

    const request: FriendRequest = {
      id: nanoid(),
      fromUserId: currentUser.id,
      toUserId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await LocalStorage.addToArray(StorageKeys.FRIEND_REQUESTS, request);
    return request;
  }

  static async getFriendRequests(userId: string): Promise<FriendRequest[]> {
    const all = await LocalStorage.getArray<FriendRequest>(StorageKeys.FRIEND_REQUESTS);
    return all.filter(r => r.toUserId === userId && r.status === 'pending');
  }

  static async getSentRequests(userId: string): Promise<FriendRequest[]> {
    const all = await LocalStorage.getArray<FriendRequest>(StorageKeys.FRIEND_REQUESTS);
    return all.filter(r => r.fromUserId === userId && r.status === 'pending');
  }

  static async respondToFriendRequest(requestId: string, accept: boolean): Promise<FriendRequest> {
    const requests = await LocalStorage.getArray<FriendRequest>(StorageKeys.FRIEND_REQUESTS);
    const request = requests.find(r => r.id === requestId);
    
    if (!request) {
      throw new Error('Request not found');
    }

    const status = accept ? 'accepted' : 'rejected';
    await LocalStorage.updateInArray<FriendRequest>(
      StorageKeys.FRIEND_REQUESTS,
      requestId,
      { status }
    );

    if (accept) {
      const friendship: Friendship = {
        id: nanoid(),
        user1Id: request.fromUserId,
        user2Id: request.toUserId,
        createdAt: new Date().toISOString(),
      };
      await LocalStorage.addToArray(StorageKeys.FRIENDSHIPS, friendship);
    }

    return { ...request, status };
  }

  static async getFriends(userId: string): Promise<UserProfile[]> {
    const friendships = await LocalStorage.getArray<Friendship>(StorageKeys.FRIENDSHIPS);
    const profiles = await this.getAllProfiles();
    
    const friendIds = friendships
      .filter(f => f.user1Id === userId || f.user2Id === userId)
      .map(f => f.user1Id === userId ? f.user2Id : f.user1Id);
    
    return profiles.filter(p => friendIds.includes(p.id));
  }

  static async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friendships = await LocalStorage.getArray<Friendship>(StorageKeys.FRIENDSHIPS);
    return friendships.some(
      f => (f.user1Id === userId1 && f.user2Id === userId2) ||
           (f.user1Id === userId2 && f.user2Id === userId1)
    );
  }

  static async getMutualFriends(viewerId: string, profileUserId: string): Promise<UserProfile[]> {
    const viewerFriends = await this.getFriends(viewerId);
    const profileUserFriends = await this.getFriends(profileUserId);
    
    const viewerFriendIds = new Set(viewerFriends.map(f => f.id));
    
    return profileUserFriends.filter(friend => viewerFriendIds.has(friend.id));
  }

  static async getTrophies(userId: string): Promise<Trophy[]> {
    const all = await LocalStorage.getArray<Trophy>(StorageKeys.TROPHIES);
    return all.filter(t => t.userId === userId);
  }

  static async awardTrophy(trophy: Omit<Trophy, 'id'>): Promise<Trophy> {
    const newTrophy: Trophy = {
      ...trophy,
      id: nanoid(),
    };
    await LocalStorage.addToArray(StorageKeys.TROPHIES, newTrophy);
    return newTrophy;
  }
}
