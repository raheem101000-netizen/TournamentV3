import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { Tournament } from '@/types/domain';
import { TournamentStore } from '../store/tournamentStore';
import { OverviewTab } from '../components/OverviewTab';
import { RegistrationsTab } from '../components/RegistrationsTab';
import { BracketsTab } from '../components/BracketsTab';
import { SettingsTab } from '../components/SettingsTab';

type TabType = 'overview' | 'registrations' | 'brackets' | 'settings';

export function TournamentDashboardScreen() {
  const { channel, serverInfo } = useLocalSearchParams<{
    channel: string;
    serverInfo: string;
  }>();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournament();
  }, [channel]);

  const loadTournament = async () => {
    try {
      setLoading(true);
      const channelTournament = await TournamentStore.getTournamentByChannelId(channel);
      setTournament(channelTournament);
    } catch (error) {
      console.error('Error loading tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadTournament();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading tournament...</Text>
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Tournament not found</Text>
        <Text style={styles.helpText}>
          Create a tournament to get started with the dashboard.
        </Text>
      </View>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab tournament={tournament} onRefresh={handleRefresh} />;
      case 'registrations':
        return <RegistrationsTab tournament={tournament} onRefresh={handleRefresh} />;
      case 'brackets':
        return <BracketsTab tournament={tournament} onRefresh={handleRefresh} />;
      case 'settings':
        return <SettingsTab tournament={tournament} onRefresh={handleRefresh} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{tournament.name}</Text>
        <Text style={styles.subtitle}>{tournament.game}</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
          data-testid="button-tab-overview"
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'registrations' && styles.activeTab]}
          onPress={() => setActiveTab('registrations')}
          data-testid="button-tab-registrations"
        >
          <Text style={[styles.tabText, activeTab === 'registrations' && styles.activeTabText]}>
            Teams
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'brackets' && styles.activeTab]}
          onPress={() => setActiveTab('brackets')}
          data-testid="button-tab-brackets"
        >
          <Text style={[styles.tabText, activeTab === 'brackets' && styles.activeTabText]}>
            Brackets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
          data-testid="button-tab-settings"
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>{renderTabContent()}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  helpText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 32,
  },
});
