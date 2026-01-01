import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import type { Tournament } from '@/types/domain';
import { TournamentStore } from '../store/tournamentStore';

interface SettingsTabProps {
  tournament: Tournament;
  onRefresh: () => void;
}

export function SettingsTab({ tournament, onRefresh }: SettingsTabProps) {
  const handleCompleteTournament = async () => {
    Alert.alert(
      'Complete Tournament',
      'Are you sure you want to mark this tournament as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await TournamentStore.updateTournament(tournament.id, {
                status: 'completed',
              });
              onRefresh();
              Alert.alert('Success', 'Tournament marked as completed');
            } catch (error) {
              Alert.alert('Error', 'Failed to complete tournament');
            }
          },
        },
      ]
    );
  };

  const handleDeleteTournament = async () => {
    Alert.alert(
      'Delete Tournament',
      'Are you sure you want to delete this tournament? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await TournamentStore.deleteTournament(tournament.id);
              Alert.alert('Success', 'Tournament deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete tournament');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tournament Actions</Text>
        
        {tournament.status === 'upcoming' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCompleteTournament}
            data-testid="button-complete-tournament"
          >
            <Text style={styles.actionButtonText}>Complete Tournament</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleDeleteTournament}
          data-testid="button-delete-tournament"
        >
          <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
            Delete Tournament
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tournament Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tournament ID</Text>
          <Text style={styles.infoValue}>{tournament.id}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Created</Text>
          <Text style={styles.infoValue}>
            {new Date(tournament.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Updated</Text>
          <Text style={styles.infoValue}>
            {new Date(tournament.updatedAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Organizer ID</Text>
          <Text style={styles.infoValue}>{tournament.organizerId}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  dangerButtonText: {
    color: '#dc3545',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});
