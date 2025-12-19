import { View, Text, StyleSheet } from 'react-native';
import type { Tournament } from '@/types/domain';

interface OverviewTabProps {
  tournament: Tournament;
  onRefresh: () => void;
}

export function OverviewTab({ tournament }: OverviewTabProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tournament Stats</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Format</Text>
          <Text style={styles.statValue}>{tournament.format.replace('_', ' ')}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Status</Text>
          <Text style={[styles.statValue, styles.statusBadge]}>
            {tournament.status.toUpperCase()}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Teams</Text>
          <Text style={styles.statValue}>
            {tournament.currentTeams} / {tournament.maxTeams}
          </Text>
        </View>

        {tournament.prizeReward && (
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Prize Pool</Text>
            <Text style={styles.statValue}>{tournament.prizeReward}</Text>
          </View>
        )}

        {tournament.entryFee && (
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Entry Fee</Text>
            <Text style={styles.statValue}>${tournament.entryFee}</Text>
          </View>
        )}

        {tournament.startDate && (
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Start Date</Text>
            <Text style={styles.statValue}>
              {new Date(tournament.startDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {tournament.description && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Description</Text>
          <Text style={styles.description}>{tournament.description}</Text>
        </View>
      )}

      {tournament.rules && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rules</Text>
          <Text style={styles.description}>{tournament.rules}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    color: '#1976d2',
    overflow: 'hidden',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
