import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { ChatThread, UserProfile } from '../../../types/domain';

interface ThreadListItemProps {
  thread: ChatThread;
  otherUser?: UserProfile | null;
  currentUserId: string;
  onPress: () => void;
}

export const ThreadListItem: React.FC<ThreadListItemProps> = ({
  thread,
  otherUser,
  currentUserId,
  onPress,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 86400000) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const displayName = thread.type === 'group' ? thread.name : otherUser?.displayName || 'Unknown';
  const avatarUri = thread.type === 'group' ? thread.avatarUri : otherUser?.avatarUri;
  const hasUnread = thread.lastMessage && !thread.lastMessage.readBy.includes(currentUserId);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>
            {displayName?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {thread.lastMessage && (
            <Text style={styles.time}>
              {formatTime(thread.lastMessage.createdAt)}
            </Text>
          )}
        </View>
        
        {thread.lastMessage && (
          <Text
            style={[styles.lastMessage, hasUnread && styles.unread]}
            numberOfLines={1}
          >
            {thread.lastMessage.imageUri ? '📷 Photo' : thread.lastMessage.content}
          </Text>
        )}
      </View>
      
      {hasUnread && <View style={styles.unreadBadge} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  unread: {
    fontWeight: '600',
    color: '#1F2937',
  },
  unreadBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    marginLeft: 8,
  },
});
