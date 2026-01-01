import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { NotificationItem } from '../components/NotificationItem';
import { NotificationsStore } from '../store/notificationsStore';
import { ProfileStore } from '../../profiles/store/profileStore';
import type { Notification } from '../../../types/domain';

interface NotificationsScreenProps {
  onNavigateToThread?: (threadId: string) => void;
  onNavigateToProfile?: (userId: string) => void;
  onNavigateToTournament?: (tournamentId: string) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onNavigateToThread,
  onNavigateToProfile,
  onNavigateToTournament,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      const currentUser = await ProfileStore.getCurrentUser();
      if (!currentUser) return;

      const data = filter === 'unread'
        ? await NotificationsStore.getUnreadNotifications(currentUser.id)
        : await NotificationsStore.getAllNotifications(currentUser.id);

      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    await NotificationsStore.markAsRead(notification.id);
    
    switch (notification.type) {
      case 'message':
        if (notification.data?.threadId) {
          onNavigateToThread?.(notification.data.threadId);
        }
        break;
      case 'friend_request':
      case 'dm_request':
        if (notification.data?.userId) {
          onNavigateToProfile?.(notification.data.userId);
        }
        break;
      case 'tournament_invite':
        if (notification.data?.tournamentId) {
          onNavigateToTournament?.(notification.data.tournamentId);
        }
        break;
    }

    await loadNotifications();
  };

  const handleDelete = async (notificationId: string) => {
    await NotificationsStore.deleteNotification(notificationId);
    await loadNotifications();
  };

  const handleMarkAllRead = async () => {
    const currentUser = await ProfileStore.getCurrentUser();
    if (!currentUser) return;

    await NotificationsStore.markAllAsRead(currentUser.id);
    await loadNotifications();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'unread' && styles.activeFilter]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>
              Unread
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {notifications.length > 0 && filter === 'all' && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.actionText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handleNotificationPress(item)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeFilter: {
    backgroundColor: '#4F46E5',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterText: {
    color: '#fff',
  },
  actions: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  actionText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    paddingVertical: 32,
  },
});
