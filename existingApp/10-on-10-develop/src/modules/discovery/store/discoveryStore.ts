import { LocalStorage, StorageKeys } from '@lib/storage';
import type { TournamentPoster } from '../../../types/domain';

export class DiscoveryStore {
  static async getAllTournaments(): Promise<TournamentPoster[]> {
    const tournaments = await LocalStorage.getArray<TournamentPoster>(StorageKeys.TOURNAMENTS);
    return tournaments.sort((a, b) => {
      if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
      if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateA - dateB;
    });
  }

  static async getTournamentById(id: string): Promise<TournamentPoster | null> {
    const tournaments = await this.getAllTournaments();
    return tournaments.find(t => t.id === id) || null;
  }

  static async getTournamentsByGame(game: string): Promise<TournamentPoster[]> {
    const all = await this.getAllTournaments();
    return all.filter(t => t.game.toLowerCase().includes(game.toLowerCase()));
  }

  static async getUpcomingTournaments(): Promise<TournamentPoster[]> {
    const all = await this.getAllTournaments();
    return all.filter(t => t.status === 'upcoming');
  }
}
