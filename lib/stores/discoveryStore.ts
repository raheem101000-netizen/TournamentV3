import { LocalStorage, StorageKeys } from '../storage';
import type { TournamentPoster } from '@shared/types';

export class DiscoveryStore {
  static async getAllTournaments(): Promise<TournamentPoster[]> {
    return await LocalStorage.getArray<TournamentPoster>(StorageKeys.TOURNAMENTS);
  }

  static async getTournamentById(id: string): Promise<TournamentPoster | null> {
    const tournaments = await this.getAllTournaments();
    return tournaments.find(t => t.id === id) || null;
  }

  static async getTournamentsByStatus(status: TournamentPoster['status']): Promise<TournamentPoster[]> {
    const all = await this.getAllTournaments();
    return all.filter(t => t.status === status);
  }

  static async getTournamentsByGame(game: string): Promise<TournamentPoster[]> {
    const all = await this.getAllTournaments();
    return all.filter(t => t.game.toLowerCase().includes(game.toLowerCase()));
  }

  static async searchTournaments(query: string): Promise<TournamentPoster[]> {
    const all = await this.getAllTournaments();
    const lowerQuery = query.toLowerCase();
    return all.filter(
      t =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.game.toLowerCase().includes(lowerQuery) ||
        t.organizerName.toLowerCase().includes(lowerQuery)
    );
  }
}
