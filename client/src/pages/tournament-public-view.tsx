import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Trophy } from "lucide-react";
import BracketView from "@/components/BracketView";
import StandingsTable from "@/components/StandingsTable";
import MatchCard from "@/components/MatchCard";
import type { Tournament, Team, Match } from "@shared/schema";

export default function TournamentPublicView() {
  const [match, params] = useRoute("/tournament/:id/view");
  const [, setLocation] = useLocation();
  const tournamentId = params?.id;

  const { data: tournament } = useQuery<Tournament>({
    queryKey: [`/api/tournaments/${tournamentId}`],
    enabled: !!tournamentId,
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: [`/api/tournaments/${tournamentId}/teams`],
    enabled: !!tournamentId,
  });

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: [`/api/tournaments/${tournamentId}/matches`],
    enabled: !!tournamentId,
  });

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading tournament...</p>
      </div>
    );
  }

  const getTeamById = (id: string | undefined) => teams.find(t => t.id === id);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">{tournament.name}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tournament Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Tournament Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Format</p>
                <p className="font-semibold capitalize">{tournament.format.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{tournament.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Game</p>
                <p className="font-semibold">{tournament.game || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prize Pool</p>
                <p className="font-semibold">{tournament.prizeReward || "No prize"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progression Tabs */}
        <Tabs defaultValue="fixtures" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="bracket">Bracket</TabsTrigger>
          </TabsList>

          {/* Fixtures Tab */}
          <TabsContent value="fixtures">
            {matches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((match) => {
                  const team1 = getTeamById(match.team1Id);
                  const team2 = getTeamById(match.team2Id);
                  return (
                    <div key={match.id}>
                      <MatchCard
                        match={match}
                        team1={team1}
                        team2={team2}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8">
                <p className="text-center text-muted-foreground">
                  No matches scheduled yet
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Standings Tab */}
          <TabsContent value="standings">
            {teams.length > 0 ? (
              <StandingsTable teams={teams.filter(t => !t.isRemoved)} />
            ) : (
              <Card className="p-8">
                <p className="text-center text-muted-foreground">
                  No teams registered yet
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Bracket Tab */}
          <TabsContent value="bracket">
            {tournament.format === "single_elimination" && matches.length > 0 ? (
              <BracketView
                matches={matches}
                teams={teams}
                format={tournament.format}
              />
            ) : (
              <Card className="p-8">
                <p className="text-center text-muted-foreground">
                  {tournament.format === "single_elimination"
                    ? "Bracket will appear when matches are scheduled"
                    : "Bracket view is only available for single elimination tournaments"}
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
