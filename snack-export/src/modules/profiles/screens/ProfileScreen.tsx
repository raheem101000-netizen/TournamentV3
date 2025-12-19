import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ProfileHeader } from '../components/ProfileHeader';
import { TrophyCard } from '../components/TrophyCard';
import { ProfileStore } from '../store/profileStore';
import type { UserProfile, Trophy } from '../../../types/domain';

interface ProfileScreenProps {
  userId?: string;
  onNavigateToEdit?: () => void;
  onNavigateToFriends?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userId,
  onNavigateToEdit,
  onNavigateToFriends,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [isFriend, setIsFriend] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [friendCount, setFriendCount] = useState(0);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const current = await ProfileStore.getCurrentUser();
      setCurrentUser(current);

      const targetUserId = userId || current?.id;
      if (!targetUserId) return;

      const targetProfile = userId
        ? await ProfileStore.getProfileById(userId)
        : current;

      if (targetProfile) {
        setProfile(targetProfile);

        const userTrophies = await ProfileStore.getTrophies(targetProfile.id);
        setTrophies(userTrophies);

        const friends = await ProfileStore.getFriends(targetProfile.id);
        setFriendCount(friends.length);

        if (current && userId && current.id !== userId) {
          const areFriends = await ProfileStore.areFriends(current.id, userId);
          setIsFriend(areFriends);

          const sentRequests = await ProfileStore.getSentRequests(current.id);
          const hasPending = sentRequests.some(r => r.toUserId === userId);
          setHasPendingRequest(hasPending);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!profile || !currentUser) return;
    try {
      await ProfileStore.sendFriendRequest(profile.id);
      setHasPendingRequest(true);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const isCurrentUser = !userId || userId === currentUser?.id;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ProfileHeader
        profile={profile}
        isCurrentUser={isCurrentUser}
        onEditPress={onNavigateToEdit}
        onAddFriendPress={handleAddFriend}
        isFriend={isFriend}
        hasPendingRequest={hasPendingRequest}
      />

      <View style={styles.statsContainer}>
        <TouchableOpacity style={styles.stat} onPress={onNavigateToFriends}>
          <Text style={styles.statValue}>{friendCount}</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </TouchableOpacity>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{trophies.length}</Text>
          <Text style={styles.statLabel}>Trophies</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trophies</Text>
        {trophies.length > 0 ? (
          trophies.map(trophy => (
            <TrophyCard key={trophy.id} trophy={trophy} />
          ))
        ) : (
          <Text style={styles.emptyText}>No trophies yet</Text>
        )}
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 8,
    paddingVertical: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    paddingVertical: 32,
  },
});
