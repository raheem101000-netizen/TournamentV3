import { nanoid } from 'nanoid';
import { LocalStorage, StorageKeys } from '@lib/storage';
import type { Notification } from '../../../types/domain';

export class NotificationsStore {
  static async getAllNotifications(userId: string): Promise<Notification[]> {
    const notifications = await LocalStorage.getArray<Notification>(StorageKeys.NOTIFICATIONS);
    return notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const all = await this.getAllNotifications(userId);
    return all.filter(n => !n.isRead);
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const unread = await this.getUnreadNotifications(userId);
    return unread.length;
  }

  static async createNotification(
    notification: Omit<Notification, 'id' | 'createdAt'>
  ): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: nanoid(),
      createdAt: new Date().toISOString(),
    };

    await LocalStorage.addToArray(StorageKeys.NOTIFICATIONS, newNotification);
    return newNotification;
  }

  static async markAsRead(notificationId: string): Promise<void> {
    await LocalStorage.updateInArray<Notification>(
      StorageKeys.NOTIFICATIONS,
      notificationId,
      { isRead: true }
    );
  }

  static async markAllAsRead(userId: string): Promise<void> {
    const notifications = await LocalStorage.getArray<Notification>(StorageKeys.NOTIFICATIONS);
    const updated = notifications.map(n =>
      n.userId === userId ? { ...n, isRead: true } : n
    );
    await LocalStorage.setArray(StorageKeys.NOTIFICATIONS, updated);
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    await LocalStorage.removeFromArray(StorageKeys.NOTIFICATIONS, notificationId);
  }

  static async clearAll(userId: string): Promise<void> {
    const all = await LocalStorage.getArray<Notification>(StorageKeys.NOTIFICATIONS);
    const filtered = all.filter(n => n.userId !== userId);
    await LocalStorage.setArray(StorageKeys.NOTIFICATIONS, filtered);
  }
}
