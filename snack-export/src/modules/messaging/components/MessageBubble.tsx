import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { Message, UserProfile } from '../../../types/domain';

interface MessageBubbleProps {
  message: Message;
  sender?: UserProfile;
  isCurrentUser: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  sender,
  isCurrentUser,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, isCurrentUser && styles.currentUserContainer]}>
      {!isCurrentUser && sender && (
        <Text style={styles.senderName}>{sender.displayName}</Text>
      )}
      
      <View style={[styles.bubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
        {message.imageUri && (
          <Image
            source={{ uri: message.imageUri }}
            style={styles.image}
          />
        )}
        
        {message.content && (
          <Text style={[styles.text, isCurrentUser && styles.currentUserText]}>
            {message.content}
          </Text>
        )}
        
        <Text style={[styles.time, isCurrentUser && styles.currentUserTime]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  currentUserContainer: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  currentUserBubble: {
    backgroundColor: '#4F46E5',
  },
  otherUserBubble: {
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: '#1F2937',
  },
  currentUserText: {
    color: '#fff',
  },
  time: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  currentUserTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
