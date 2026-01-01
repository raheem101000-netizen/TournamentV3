import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { Tournament } from '@/types/domain';

interface BracketsTabProps {
  tournament: Tournament;
  onRefresh: () => void;
}

export function BracketsTab({ tournament }: BracketsTabProps) {
  if (!tournament.brackets || tournament.brackets.rounds.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Brackets not generated yet</Text>
        <Text style={styles.emptySubtext}>
          Brackets will be created once the tournament starts.
        </Text>
      </View>
    );
  }

  const getTeamName = (teamId: string) => {
    const team = tournament.teams.find(t => t.id === teamId);
    return team?.name || 'TBD';
  };

  return (
    <ScrollView style={styles.container}>
      {tournament.brackets.rounds.map(round => (
        <View key={round.roundNumber} style={styles.roundContainer}>
          <Text style={styles.roundTitle}>Round {round.roundNumber}</Text>
          
          {round.matches.map((match, index) => (
            <View key={match.id} style={styles.matchCard} data-testid={`card-match-${match.id}`}>
              <Text style={styles.matchNumber}>Match {index + 1}</Text>
              
              <View style={styles.matchup}>
                <View style={[styles.team, match.winnerId === match.team1Id && styles.winnerTeam]}>
                  <Text style={styles.teamName}>{getTeamName(match.team1Id)}</Text>
                  {match.winnerId === match.team1Id && (
                    <Text style={styles.winnerBadge}>Winner</Text>
                  )}
                </View>
                
                <Text style={styles.vs}>VS</Text>
                
                <View style={[styles.team, match.winnerId === match.team2Id && styles.winnerTeam]}>
                  <Text style={styles.teamName}>{getTeamName(match.team2Id)}</Text>
                  {match.winnerId === match.team2Id && (
                    <Text style={styles.winnerBadge}>Winner</Text>
                  )}
                </View>
              </View>
              
              {match.score && (
                <Text style={styles.score}>Score: {match.score}</Text>
              )}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  roundContainer: {
    marginBottom: 24,
  },
  roundTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  matchCard: {
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
  matchNumber: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  matchup: {
    gap: 12,
  },
  team: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  winnerTeam: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  winnerBadge: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  vs: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  score: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
