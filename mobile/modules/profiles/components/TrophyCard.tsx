import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Trophy } from '../../../types/domain';

interface TrophyCardProps {
  trophy: Trophy;
}

export const TrophyCard: React.FC<TrophyCardProps> = ({ trophy }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{trophy.iconUrl || '🏆'}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{trophy.title}</Text>
        <Text style={styles.description}>{trophy.description}</Text>
        <View style={styles.footer}>
          <Text style={styles.awardedBy}>Awarded by {trophy.awardedBy}</Text>
          <Text style={styles.date}>{formatDate(trophy.awardedAt)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 40,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  awardedBy: {
    fontSize: 12,
    color: '#6B7280',
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
});
