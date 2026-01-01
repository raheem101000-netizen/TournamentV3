import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { TournamentPoster } from '../../../types/domain';

interface TournamentPosterCardProps {
  tournament: TournamentPoster;
  onPress: () => void;
  onJoin?: () => void;
}

export const TournamentPosterCard: React.FC<TournamentPosterCardProps> = ({
  tournament,
  onPress,
  onJoin,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = () => {
    switch (tournament.status) {
      case 'upcoming': return '#10B981';
      case 'in_progress': return '#F59E0B';
      case 'completed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getFormatLabel = () => {
    switch (tournament.format) {
      case 'single_elimination': return 'Single Elim';
      case 'round_robin': return 'Round Robin';
      case 'swiss': return 'Swiss';
      default: return tournament.format;
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: tournament.imageUrl }} style={styles.image} />
      
      <View style={styles.statusBadge} style={{...styles.statusBadge, backgroundColor: getStatusColor()}}>
        <Text style={styles.statusText}>{tournament.status.toUpperCase()}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.game}>{tournament.game}</Text>
        <Text style={styles.name} numberOfLines={2}>{tournament.name}</Text>
        
        <View style={styles.info}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Format:</Text>
            <Text style={styles.value}>{getFormatLabel()}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Organizer:</Text>
            <Text style={styles.value}>{tournament.organizerName}</Text>
          </View>
          
          {tournament.prizeReward && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Prize:</Text>
              <Text style={[styles.value, styles.prize]}>{tournament.prizeReward}</Text>
            </View>
          )}
          
          {tournament.entryFee && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Entry Fee:</Text>
              <Text style={styles.value}>₹{tournament.entryFee}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Teams:</Text>
            <Text style={styles.value}>
              {tournament.currentTeams}/{tournament.maxTeams}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Starts:</Text>
            <Text style={styles.value}>{formatDate(tournament.startDate)}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.viewButton} onPress={onPress}>
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
          
          {tournament.status === 'upcoming' && tournament.currentTeams < tournament.maxTeams && (
            <TouchableOpacity style={styles.joinButton} onPress={onJoin}>
              <Text style={styles.joinButtonText}>Join Tournament</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  game: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  info: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    width: 90,
  },
  value: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  prize: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
