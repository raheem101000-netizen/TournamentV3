import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import { TournamentPosterCard } from '../components/TournamentPosterCard';
import { DiscoveryStore } from '../store/discoveryStore';
import type { TournamentPoster } from '../../../types/domain';

interface DiscoveryScreenProps {
  onNavigateToTournament?: (tournamentId: string) => void;
  onJoinTournament?: (tournamentId: string) => void;
}

export const DiscoveryScreen: React.FC<DiscoveryScreenProps> = ({
  onNavigateToTournament,
  onJoinTournament,
}) => {
  const [tournaments, setTournaments] = useState<TournamentPoster[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<TournamentPoster[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    filterTournaments();
  }, [searchQuery, tournaments]);

  const loadTournaments = async () => {
    try {
      const data = await DiscoveryStore.getAllTournaments();
      setTournaments(data);
      setFilteredTournaments(data);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTournaments = () => {
    if (!searchQuery.trim()) {
      setFilteredTournaments(tournaments);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = tournaments.filter(
      t =>
        t.name.toLowerCase().includes(query) ||
        t.game.toLowerCase().includes(query) ||
        t.organizerName.toLowerCase().includes(query)
    );
    setFilteredTournaments(filtered);
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
        <Text style={styles.title}>Discover Tournaments</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tournaments, games..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredTournaments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TournamentPosterCard
            tournament={item}
            onPress={() => onNavigateToTournament?.(item.id)}
            onJoin={() => onJoinTournament?.(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery ? 'No tournaments found' : 'No tournaments available'}
          </Text>
        }
      />
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  list: {
    paddingVertical: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    paddingVertical: 32,
  },
});
