import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    <ScrollArea className="w-full">
      <div className="flex gap-8 p-6">
        {Array.from({ length: rounds }, (_, i) => rounds - i).map(round => {
          const roundMatches = matches.filter(m => m.round === round);
          const matchesInRound = Math.pow(2, round - 1);
          const roundName = round <= roundNames.length 
            ? roundNames[roundNames.length - round] 
            : `Round ${round}`;
          
          return (
            <div key={round} className="flex flex-col gap-4 min-w-[280px]">
              <div className="sticky top-0 bg-background z-10 pb-2">
                <h3 className="font-display font-semibold text-lg">{roundName}</h3>
                <p className="text-sm text-muted-foreground">{matchesInRound} {matchesInRound === 1 ? 'match' : 'matches'}</p>
              </div>
              <div className="space-y-4">
                {roundMatches.map(match => (
                  <div key={match.id} onClick={() => onMatchClick?.(match.id)} className="cursor-pointer">
                    <MatchCard
                      match={match}
                      team1={getTeamById(match.team1Id)}
                      team2={getTeamById(match.team2Id)}
                      compact
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
