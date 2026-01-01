import { LocalStorage, StorageKeys } from '../storage';
import type { Notification } from '@shared/types';

export class NotificationStore {
  static async getAll(userId: string): Promise<Notification[]> {
    const all = await LocalStorage.getArray<Notification>(StorageKeys.NOTIFICATIONS);
    return all
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getUnread(userId: string): Promise<Notification[]> {
    const all = await this.getAll(userId);
    return all.filter(n => !n.isRead);
  }

  static async markAsRead(notificationId: string): Promise<void> {
    await LocalStorage.updateInArray<Notification>(
      StorageKeys.NOTIFICATIONS,
      notificationId,
      { isRead: true }
    );
  }

  static async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.getAll(userId);
    for (const n of notifications) {
      if (!n.isRead) {
        await this.markAsRead(n.id);
      }
    }
  }

  static async delete(notificationId: string): Promise<void> {
    await LocalStorage.removeFromArray(StorageKeys.NOTIFICATIONS, notificationId);
  }
}
