import type { Team, Match, InsertMatch } from "@shared/schema";

export interface BracketGenerationResult {
  matches: InsertMatch[];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateRoundRobinBracket(
  tournamentId: string,
  teams: Team[]
): BracketGenerationResult {
  const matches: InsertMatch[] = [];
  let round = 1;

  if (teams.length < 2) {
    return { matches };
  }

  const teamCount = teams.length;
  const hasOddTeams = teamCount % 2 === 1;
  const effectiveTeamCount = hasOddTeams ? teamCount + 1 : teamCount;

  for (let r = 0; r < effectiveTeamCount - 1; r++) {
    for (let i = 0; i < effectiveTeamCount / 2; i++) {
      let home = (r + i) % (effectiveTeamCount - 1);
      let away = (effectiveTeamCount - 1 - i + r) % (effectiveTeamCount - 1);

      if (i === 0) {
        away = effectiveTeamCount - 1;
      }

      const homeTeam = teams[home];
      const awayTeam = teams[away];

      if (homeTeam && awayTeam) {
        matches.push({
          tournamentId,
          team1Id: homeTeam.id,
          team2Id: awayTeam.id,
          round,
          status: "pending",
          winnerId: null,
          team1Score: null,
          team2Score: null,
          isBye: 0,
        });
      } else if (homeTeam && !awayTeam) {
        matches.push({
          tournamentId,
          team1Id: homeTeam.id,
          team2Id: null,
          round,
          status: "completed",
          winnerId: homeTeam.id,
          team1Score: null,
          team2Score: null,
          isBye: 1,
        });
      } else if (!homeTeam && awayTeam) {
        matches.push({
          tournamentId,
          team1Id: awayTeam.id,
          team2Id: null,
          round,
          status: "completed",
          winnerId: awayTeam.id,
          team1Score: null,
          team2Score: null,
          isBye: 1,
        });
      }
    }
    round++;
  }

  return { matches };
}

export function generateSingleEliminationBracket(
  tournamentId: string,
  teams: Team[]
): BracketGenerationResult {
  const matches: InsertMatch[] = [];
  
  if (teams.length < 2) {
    return { matches };
  }

  const shuffledTeams = shuffleArray(teams);
  const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(shuffledTeams.length)));
  const totalRounds = Math.log2(nextPowerOfTwo);

  let matchCounter = 0;
  const firstRoundMatches: number[] = [];

  for (let i = 0; i < nextPowerOfTwo; i += 2) {
    const team1 = shuffledTeams[i] || null;
    const team2 = shuffledTeams[i + 1] || null;

    if (team1 && team2) {
      matches.push({
        tournamentId,
        team1Id: team1.id,
        team2Id: team2.id,
        round: 1,
        status: "pending",
        winnerId: null,
        team1Score: null,
        team2Score: null,
        isBye: 0,
      });
      firstRoundMatches.push(matchCounter++);
    } else if (team1 && !team2) {
      matches.push({
        tournamentId,
        team1Id: team1.id,
        team2Id: null,
        round: 1,
        status: "completed",
        winnerId: team1.id,
        team1Score: null,
        team2Score: null,
        isBye: 1,
      });
      firstRoundMatches.push(matchCounter++);
    }
  }

  let previousRoundMatches = firstRoundMatches;
  for (let round = 2; round <= totalRounds; round++) {
    const currentRoundMatches: number[] = [];
    
    for (let i = 0; i < previousRoundMatches.length; i += 2) {
      matches.push({
        tournamentId,
        team1Id: null,
        team2Id: null,
        round,
        status: "pending",
        winnerId: null,
        team1Score: null,
        team2Score: null,
        isBye: 0,
      });
      currentRoundMatches.push(matchCounter++);
    }
    
    previousRoundMatches = currentRoundMatches;
  }

  return { matches };
}

export function generateSwissSystemRound(
  tournamentId: string,
  teams: Team[],
  round: number,
  previousMatches: Match[]
): BracketGenerationResult {
  const matches: InsertMatch[] = [];
  
  if (teams.length < 2) {
    return { matches };
  }

  if (round === 1) {
    const shuffledTeams = shuffleArray(teams);
    for (let i = 0; i < shuffledTeams.length; i += 2) {
      if (i + 1 < shuffledTeams.length) {
        matches.push({
          tournamentId,
          team1Id: shuffledTeams[i].id,
          team2Id: shuffledTeams[i + 1].id,
          round,
          status: "pending",
          winnerId: null,
          team1Score: null,
          team2Score: null,
          isBye: 0,
        });
      } else {
        matches.push({
          tournamentId,
          team1Id: shuffledTeams[i].id,
          team2Id: null,
          round,
          status: "completed",
          winnerId: shuffledTeams[i].id,
          team1Score: null,
          team2Score: null,
          isBye: 1,
        });
      }
    }
  } else {
    const sortedTeams = [...teams].sort((a, b) => {
      const aPoints = a.points ?? 0;
      const bPoints = b.points ?? 0;
      const aWins = a.wins ?? 0;
      const bWins = b.wins ?? 0;
      const aLosses = a.losses ?? 0;
      const bLosses = b.losses ?? 0;
      
      if (bPoints !== aPoints) return bPoints - aPoints;
      if (bWins !== aWins) return bWins - aWins;
      return aLosses - bLosses;
    });

    const paired = new Set<string>();
    const previousOpponents = new Map<string, Set<string>>();

    for (const match of previousMatches) {
      if (!match.team1Id || !match.team2Id) continue;
      if (!previousOpponents.has(match.team1Id)) {
        previousOpponents.set(match.team1Id, new Set());
      }
      if (!previousOpponents.has(match.team2Id)) {
        previousOpponents.set(match.team2Id, new Set());
      }
      previousOpponents.get(match.team1Id)!.add(match.team2Id);
      previousOpponents.get(match.team2Id)!.add(match.team1Id);
    }

    for (let i = 0; i < sortedTeams.length; i++) {
      const team1 = sortedTeams[i];
      if (paired.has(team1.id)) continue;

      let team2: Team | null = null;
      for (let j = i + 1; j < sortedTeams.length; j++) {
        const candidate = sortedTeams[j];
        if (paired.has(candidate.id)) continue;
        
        const opponents = previousOpponents.get(team1.id);
        if (!opponents || !opponents.has(candidate.id)) {
          team2 = candidate;
          break;
        }
      }

      if (team2) {
        matches.push({
          tournamentId,
          team1Id: team1.id,
          team2Id: team2.id,
          round,
          status: "pending",
          winnerId: null,
          team1Score: null,
          team2Score: null,
          isBye: 0,
        });
        paired.add(team1.id);
        paired.add(team2.id);
      } else {
        matches.push({
          tournamentId,
          team1Id: team1.id,
          team2Id: null,
          round,
          status: "completed",
          winnerId: team1.id,
          team1Score: null,
          team2Score: null,
          isBye: 1,
        });
        paired.add(team1.id);
      }
    }
  }

  return { matches };
}
