import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import type { Tournament } from '@/types/domain';

interface RegistrationsTabProps {
  tournament: Tournament;
  onRefresh: () => void;
}

export function RegistrationsTab({ tournament }: RegistrationsTabProps) {
  if (tournament.teams.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No teams registered yet</Text>
        <Text style={styles.emptySubtext}>
          Teams will appear here once they register for the tournament.
        </Text>
      </View>
    );
  }

  const renderTeam = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.teamCard} data-testid={`card-team-${item.id}`}>
      <View style={styles.teamHeader}>
        <View style={styles.teamRank}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{item.name}</Text>
          <Text style={styles.teamMembers}>{item.members.length} members</Text>
        </View>
      </View>
      
      <View style={styles.teamStats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.wins}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.losses}</Text>
          <Text style={styles.statLabel}>Losses</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {tournament.currentTeams} / {tournament.maxTeams} Teams
        </Text>
      </View>

      <FlatList
        data={tournament.teams}
        renderItem={renderTeam}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listContent: {
    padding: 16,
  },
  teamCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  teamMembers: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  teamStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});
