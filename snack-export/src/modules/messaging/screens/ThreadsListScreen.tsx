import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ThreadListItem } from '../components/ThreadListItem';
import { MessagingStore } from '../store/messagingStore';
import { ProfileStore } from '../../profiles/store/profileStore';
import type { ChatThread, UserProfile } from '../../../types/domain';

interface ThreadsListScreenProps {
  onNavigateToThread?: (threadId: string) => void;
  onNavigateToNewChat?: () => void;
}

export const ThreadsListScreen: React.FC<ThreadsListScreenProps> = ({
  onNavigateToThread,
  onNavigateToNewChat,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [otherUsers, setOtherUsers] = useState<Map<string, UserProfile>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const current = await ProfileStore.getCurrentUser();
      if (!current) return;

      setCurrentUser(current);

      const userThreads = await MessagingStore.getAllThreads(current.id);
      setThreads(userThreads);

      const users = new Map<string, UserProfile>();
      for (const thread of userThreads) {
        if (thread.type === 'direct') {
          const otherUserId = thread.participantIds.find(id => id !== current.id);
          if (otherUserId) {
            const user = await ProfileStore.getProfileById(otherUserId);
            if (user) users.set(thread.id, user);
          }
        }
      }
      setOtherUsers(users);
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.newChatButton} onPress={onNavigateToNewChat}>
          <Text style={styles.newChatText}>+ New Chat</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={threads}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ThreadListItem
            thread={item}
            otherUser={otherUsers.get(item.id)}
            currentUserId={currentUser?.id || ''}
            onPress={() => onNavigateToThread?.(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No conversations yet. Start a new chat!</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  newChatButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  newChatText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    paddingVertical: 32,
  },
});
