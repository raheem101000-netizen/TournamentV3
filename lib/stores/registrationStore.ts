import { nanoid } from 'nanoid';
import { LocalStorage, StorageKeys } from '../storage';

export interface TournamentRegistration {
  id: string;
  userId: string;
  tournamentId: string;
  teamId: string;
  teamName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export class RegistrationStore {
  static async getUserRegistrations(userId: string): Promise<TournamentRegistration[]> {
    const all = await LocalStorage.getArray<TournamentRegistration>(StorageKeys.REGISTRATIONS);
    return all.filter(r => r.userId === userId);
  }

  static async getRegistrationsByTournament(tournamentId: string): Promise<TournamentRegistration[]> {
    const all = await LocalStorage.getArray<TournamentRegistration>(StorageKeys.REGISTRATIONS);
    return all.filter(r => r.tournamentId === tournamentId);
  }

  static async getAllRegistrations(): Promise<TournamentRegistration[]> {
    return await LocalStorage.getArray<TournamentRegistration>(StorageKeys.REGISTRATIONS);
  }

  static async getUniqueTeamIds(): Promise<string[]> {
    const all = await LocalStorage.getArray<TournamentRegistration>(StorageKeys.REGISTRATIONS);
    const teamIds = new Set(all.map(r => r.teamId));
    return Array.from(teamIds);
  }

  static async addRegistration(registration: Omit<TournamentRegistration, 'id' | 'createdAt'>): Promise<TournamentRegistration> {
    const newReg: TournamentRegistration = {
      ...registration,
      id: nanoid(),
      createdAt: new Date().toISOString(),
    };
    await LocalStorage.addToArray(StorageKeys.REGISTRATIONS, newReg);
    return newReg;
  }

  static async updateRegistrationStatus(
    registrationId: string,
    status: TournamentRegistration['status']
  ): Promise<void> {
    await LocalStorage.updateInArray<TournamentRegistration>(
      StorageKeys.REGISTRATIONS,
      registrationId,
      { status }
    );
  }

  static async seedMockData(userId: string): Promise<void> {
    const existing = await this.getUserRegistrations(userId);
    if (existing.length > 0) return;

    await this.addRegistration({
      userId,
      tournamentId: '892f865e-ab70-4aeb-8f08-966e1194da4c',
      teamId: 'team-phoenix',
      teamName: 'Phoenix Squad',
      status: 'approved',
    });
  }
}
