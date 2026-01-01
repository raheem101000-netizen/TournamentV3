import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { FriendRequestCard } from '../components/FriendRequestCard';
import { ProfileStore } from '../store/profileStore';
import type { UserProfile, FriendRequest } from '../../../types/domain';

interface FriendsScreenProps {
  onNavigateToProfile?: (userId: string) => void;
}

export const FriendsScreen: React.FC<FriendsScreenProps> = ({
  onNavigateToProfile,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<Array<{ request: FriendRequest; profile: UserProfile }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const current = await ProfileStore.getCurrentUser();
      if (!current) return;

      setCurrentUser(current);

      const userFriends = await ProfileStore.getFriends(current.id);
      setFriends(userFriends);

      const friendRequests = await ProfileStore.getFriendRequests(current.id);
      const requestsWithProfiles = await Promise.all(
        friendRequests.map(async (request) => {
          const profile = await ProfileStore.getProfileById(request.fromUserId);
          return { request, profile: profile! };
        })
      );
      setRequests(requestsWithProfiles.filter(r => r.profile));
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await ProfileStore.respondToFriendRequest(requestId, true);
      await loadData();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await ProfileStore.respondToFriendRequest(requestId, false);
      await loadData();
    } catch (error) {
      console.error('Error rejecting request:', error);
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
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests ({requests.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'friends' ? (
          friends.length > 0 ? (
            friends.map(friend => (
              <TouchableOpacity
                key={friend.id}
                style={styles.friendCard}
                onPress={() => onNavigateToProfile?.(friend.id)}
              >
                {friend.avatarUri ? (
                  <Image source={{ uri: friend.avatarUri }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>
                      {friend.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{friend.displayName}</Text>
                  <Text style={styles.friendUsername}>@{friend.username}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No friends yet</Text>
          )
        ) : (
          requests.length > 0 ? (
            requests.map(({ request, profile }) => (
              <FriendRequestCard
                key={request.id}
                profile={profile}
                onAccept={() => handleAcceptRequest(request.id)}
                onReject={() => handleRejectRequest(request.id)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No pending requests</Text>
          )
        )}
      </ScrollView>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingTop: 12,
  },
  friendCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  friendUsername: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    paddingVertical: 32,
  },
});
