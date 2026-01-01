import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Notification } from '../../../types/domain';

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
  onDelete?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onDelete,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'message': return '💬';
      case 'friend_request': return '👋';
      case 'dm_request': return '✉️';
      case 'tournament_invite': return '🏆';
      case 'mention': return '@';
      default: return '🔔';
    }
  };

  const getTypeColor = () => {
    switch (notification.type) {
      case 'message': return '#3B82F6';
      case 'friend_request': return '#10B981';
      case 'dm_request': return '#8B5CF6';
      case 'tournament_invite': return '#F59E0B';
      case 'mention': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, !notification.isRead && styles.unread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getTypeColor() }]}>
        <Text style={styles.icon}>{getIcon()}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.time}>{formatTime(notification.createdAt)}</Text>
      </View>

      {!notification.isRead && <View style={styles.unreadDot} />}

      {onDelete && (
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  unread: {
    backgroundColor: '#F0F9FF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteText: {
    fontSize: 28,
    color: '#9CA3AF',
    fontWeight: '300',
  },
});
