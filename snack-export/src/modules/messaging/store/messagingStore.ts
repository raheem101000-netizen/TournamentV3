import { nanoid } from 'nanoid';
import { LocalStorage, StorageKeys } from '@lib/storage';
import type { ChatThread, Message, DMRequest } from '../../../types/domain';
import { ProfileStore } from '../../profiles/store/profileStore';

export class MessagingStore {
  static async getAllThreads(userId: string): Promise<ChatThread[]> {
    const threads = await LocalStorage.getArray<ChatThread>(StorageKeys.CHAT_THREADS);
    return threads
      .filter(t => t.participantIds.includes(userId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  static async getThread(threadId: string): Promise<ChatThread | null> {
    const threads = await LocalStorage.getArray<ChatThread>(StorageKeys.CHAT_THREADS);
    return threads.find(t => t.id === threadId) || null;
  }

  static async createGroupThread(
    creatorId: string,
    name: string,
    participantIds: string[]
  ): Promise<ChatThread> {
    const thread: ChatThread = {
      id: nanoid(),
      type: 'group',
      name,
      participantIds: [creatorId, ...participantIds],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await LocalStorage.addToArray(StorageKeys.CHAT_THREADS, thread);
    return thread;
  }

  static async createDirectThread(user1Id: string, user2Id: string): Promise<ChatThread> {
    const areFriends = await ProfileStore.areFriends(user1Id, user2Id);

    if (!areFriends) {
      const existingRequest = await this.getDMRequest(user1Id, user2Id);
      if (existingRequest) {
        throw new Error('DM request already sent');
      }

      const thread: ChatThread = {
        id: nanoid(),
        type: 'direct',
        participantIds: [user1Id, user2Id],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await LocalStorage.addToArray(StorageKeys.CHAT_THREADS, thread);

      const dmRequest: DMRequest = {
        id: nanoid(),
        fromUserId: user1Id,
        toUserId: user2Id,
        threadId: thread.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await LocalStorage.addToArray(StorageKeys.DM_REQUESTS, dmRequest);
      return thread;
    }

    const thread: ChatThread = {
      id: nanoid(),
      type: 'direct',
      participantIds: [user1Id, user2Id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await LocalStorage.addToArray(StorageKeys.CHAT_THREADS, thread);
    return thread;
  }

  static async getDMRequests(userId: string): Promise<DMRequest[]> {
    const requests = await LocalStorage.getArray<DMRequest>(StorageKeys.DM_REQUESTS);
    return requests.filter(r => r.toUserId === userId && r.status === 'pending');
  }

  static async getDMRequest(fromUserId: string, toUserId: string): Promise<DMRequest | null> {
    const requests = await LocalStorage.getArray<DMRequest>(StorageKeys.DM_REQUESTS);
    return requests.find(
      r => r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === 'pending'
    ) || null;
  }

  static async respondToDMRequest(requestId: string, accept: boolean): Promise<void> {
    const status = accept ? 'accepted' : 'rejected';
    await LocalStorage.updateInArray<DMRequest>(StorageKeys.DM_REQUESTS, requestId, { status });
  }

  static async getMessages(threadId: string): Promise<Message[]> {
    const messages = await LocalStorage.getArray<Message>(StorageKeys.MESSAGES);
    return messages
      .filter(m => m.threadId === threadId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  static async sendMessage(
    threadId: string,
    senderId: string,
    content: string,
    imageUri?: string
  ): Promise<Message> {
    const message: Message = {
      id: nanoid(),
      threadId,
      senderId,
      content,
      imageUri,
      createdAt: new Date().toISOString(),
      readBy: [senderId],
    };

    await LocalStorage.addToArray(StorageKeys.MESSAGES, message);
    
    await LocalStorage.updateInArray<ChatThread>(StorageKeys.CHAT_THREADS, threadId, {
      lastMessage: message,
      updatedAt: new Date().toISOString(),
    });

    return message;
  }

  static async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const messages = await LocalStorage.getArray<Message>(StorageKeys.MESSAGES);
    const message = messages.find(m => m.id === messageId);
    
    if (message && !message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await LocalStorage.setArray(StorageKeys.MESSAGES, messages);
    }
  }
}
