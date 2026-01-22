import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MatchCard from "./MatchCard";
import type { Match, Team } from "@shared/schema";

interface BracketViewProps {
  matches: Match[];
  teams: Team[];
  format: "single_elimination" | "round_robin" | "swiss";
  onMatchClick?: (matchId: string) => void;
}

export default function BracketView({ matches, teams, format, onMatchClick }: BracketViewProps) {
  const getTeamById = (id: string | null) => teams.find(t => t.id === id);

  if (format === "round_robin") {
    const rounds = Math.max(...matches.map(m => m.round));

    return (
      <div className="space-y-6">
        {Array.from({ length: rounds }, (_, i) => i + 1).map(round => {
          const roundMatches = matches.filter(m => m.round === round);
          return (
            <Card key={round}>
              <CardHeader>
                <CardTitle className="font-display">Round {round}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roundMatches.map(match => (
                    <div key={match.id} onClick={() => onMatchClick?.(match.id)} className="cursor-pointer">
                      <MatchCard
                        match={match}
                        team1={getTeamById(match.team1Id)}
                        team2={getTeamById(match.team2Id)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  if (format === "swiss") {
    const rounds = Math.max(...matches.map(m => m.round));

    return (
      <div className="space-y-6">
        {Array.from({ length: rounds }, (_, i) => i + 1).map(round => {
          const roundMatches = matches.filter(m => m.round === round);
          return (
            <Card key={round}>
              <CardHeader>
                <CardTitle className="font-display flex items-center justify-between">
                  <span>Round {round}</span>
                  <Badge variant="outline">{roundMatches.length} pairings</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roundMatches.map(match => (
                    <div key={match.id} onClick={() => onMatchClick?.(match.id)} className="cursor-pointer">
                      <MatchCard
                        match={match}
                        team1={getTeamById(match.team1Id)}
                        team2={getTeamById(match.team2Id)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  const rounds = Math.max(...matches.map(m => m.round));
  const roundNames = ['Finals', 'Semi-Finals', 'Quarter-Finals', 'Round of 16', 'Round of 32'];

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex gap-8 p-4 min-w-max">
        {Array.from({ length: rounds }, (_, i) => i + 1).map(round => {
          const roundMatches = matches.filter(m => m.round === round);
          const matchesInRound = roundMatches.length;

          // Calculate round name based on distance from finals
          // rounds = total rounds
          // round = current round number (1-based)
          // distance = rounds - round (0 = finals, 1 = semis, etc.)
          const distance = rounds - round;
          const roundName = distance < roundNames.length
            ? roundNames[distance]
            : `Round ${round}`;

          return (
            <div key={round} className="flex flex-col gap-4 min-w-[280px] w-[280px] relative shrink-0">
              <div className="sticky top-0 bg-background z-10 pb-2 border-b mb-2">
                <h3 className="font-display font-semibold text-lg">{roundName}</h3>
                <p className="text-sm text-muted-foreground">{matchesInRound} {matchesInRound === 1 ? 'match' : 'matches'}</p>
              </div>
              <div className="flex flex-col justify-around h-full gap-8">
                {roundMatches.map((match, index) => (
                  <div key={match.id} className="relative flex items-center">
                    <div
                      onClick={() => onMatchClick?.(match.id)}
                      className="cursor-pointer w-full relative z-10"
                    >
                      <MatchCard
                        match={match}
                        team1={getTeamById(match.team1Id)}
                        team2={getTeamById(match.team2Id)}
                        compact
                      />
                    </div>
                    {/* Connector Lines */}
                    {round < rounds && (
                      <>
                        <div className={`absolute -right-4 w-4 h-[1px] bg-border ${index % 2 === 0 ? 'top-1/2' : 'top-1/2'}`} />
                        {index % 2 === 0 && (
                          <div className="absolute -right-4 top-1/2 w-[1px] h-[calc(100%+2rem)] bg-border" />
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
