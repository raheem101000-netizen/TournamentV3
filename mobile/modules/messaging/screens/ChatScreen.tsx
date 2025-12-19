import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MessageBubble } from '../components/MessageBubble';
import { MessagingStore } from '../store/messagingStore';
import { ProfileStore } from '../../profiles/store/profileStore';
import type { Message, UserProfile, ChatThread } from '../../../types/domain';

interface ChatScreenProps {
  threadId: string;
  onNavigateToProfile?: (userId: string) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  threadId,
  onNavigateToProfile,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Map<string, UserProfile>>(new Map());
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [threadId]);

  const loadData = async () => {
    try {
      const current = await ProfileStore.getCurrentUser();
      if (!current) return;
      setCurrentUser(current);

      const threadData = await MessagingStore.getThread(threadId);
      setThread(threadData);

      const threadMessages = await MessagingStore.getMessages(threadId);
      setMessages(threadMessages);

      if (threadData) {
        const users = new Map<string, UserProfile>();
        for (const userId of threadData.participantIds) {
          const user = await ProfileStore.getProfileById(userId);
          if (user) users.set(userId, user);
        }
        setParticipants(users);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !currentUser) return;

    try {
      await MessagingStore.sendMessage(threadId, currentUser.id, inputText.trim());
      setInputText('');
      await loadData();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading || !thread) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            sender={participants.get(item.senderId)}
            isCurrentUser={item.senderId === currentUser?.id}
          />
        )}
        contentContainerStyle={styles.messagesList}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  messagesList: {
    paddingVertical: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
