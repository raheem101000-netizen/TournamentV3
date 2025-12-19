import { nanoid } from 'nanoid';
import { LocalStorage, StorageKeys } from '@/lib/storage';
import type { Tournament, TournamentTeam, BracketMatch } from '@/types/domain';

export class TournamentStore {
  static async getAllTournaments(): Promise<Tournament[]> {
    return await LocalStorage.getArray<Tournament>(StorageKeys.TOURNAMENTS);
  }

  static async getTournamentById(id: string): Promise<Tournament | null> {
    const tournaments = await this.getAllTournaments();
    return tournaments.find(t => t.id === id) || null;
  }

  static async getTournamentsByOrganizer(organizerId: string): Promise<Tournament[]> {
    const all = await this.getAllTournaments();
    return all.filter(t => t.organizerId === organizerId);
  }

  static async getTournamentsByStatus(status: Tournament['status']): Promise<Tournament[]> {
    const all = await this.getAllTournaments();
    return all.filter(t => t.status === status);
  }

  static async createTournament(
    data: Omit<Tournament, 'teams' | 'currentTeams' | 'createdAt' | 'updatedAt'> & { id: string }
  ): Promise<Tournament> {
    const newTournament: Tournament = {
      ...data,
      teams: [],
      currentTeams: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await LocalStorage.addToArray(StorageKeys.TOURNAMENTS, newTournament);
    return newTournament;
  }

  static async createTournamentForChannel(
    channelId: string,
    data: Omit<Tournament, 'id' | 'teams' | 'currentTeams' | 'createdAt' | 'updatedAt'>
  ): Promise<Tournament> {
    return this.createTournament({ ...data, id: channelId });
  }

  static async getTournamentByChannelId(channelId: string): Promise<Tournament | null> {
    return this.getTournamentById(channelId);
  }

  static async updateTournament(
    tournamentId: string,
    updates: Partial<Omit<Tournament, 'id'>>
  ): Promise<void> {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await LocalStorage.updateInArray<Tournament>(StorageKeys.TOURNAMENTS, tournamentId, updateData);
  }

  static async deleteTournament(tournamentId: string): Promise<void> {
    await LocalStorage.removeFromArray(StorageKeys.TOURNAMENTS, tournamentId);
  }

  static async addTeamToTournament(tournamentId: string, team: TournamentTeam): Promise<void> {
    const tournament = await this.getTournamentById(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const teams = [...tournament.teams, team];
    await this.updateTournament(tournamentId, {
      teams,
      currentTeams: teams.length,
    });
  }

  static async updateTeam(
    tournamentId: string,
    teamId: string,
    updates: Partial<TournamentTeam>
  ): Promise<void> {
    const tournament = await this.getTournamentById(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const teams = tournament.teams.map(team =>
      team.id === teamId ? { ...team, ...updates } : team
    );

    await this.updateTournament(tournamentId, { teams });
  }

  static async updateMatchResult(
    tournamentId: string,
    matchId: string,
    winnerId: string,
    score?: string
  ): Promise<void> {
    const tournament = await this.getTournamentById(tournamentId);
    if (!tournament || !tournament.brackets) {
      throw new Error('Tournament or brackets not found');
    }

    const updatedRounds = tournament.brackets.rounds.map(round => ({
      ...round,
      matches: round.matches.map(match =>
        match.id === matchId ? { ...match, winnerId, score } : match
      ),
    }));

    await this.updateTournament(tournamentId, {
      brackets: { rounds: updatedRounds },
    });
  }
}
