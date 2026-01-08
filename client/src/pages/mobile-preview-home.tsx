import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Calendar, Users, Trophy, DollarSign, Star, Info, Search, Filter, Gamepad2 } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import type { Tournament, Server } from "@shared/schema";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function MobilePreviewHome() {
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: tournaments, isLoading } = useQuery<Tournament[]>({
    queryKey: ["/api/tournaments"],
  });

  const { data: servers } = useQuery<Server[]>({
    queryKey: ["/api/mobile-preview/servers"],
  });

  const uniqueGames = useMemo(() => {
    if (!tournaments) return [];
    const games = new Set(tournaments.map(t => t.game).filter(Boolean));
    return Array.from(games);
  }, [tournaments]);

  const filteredTournaments = useMemo(() => {
    if (!tournaments) return [];
    return tournaments.filter(t => {
      // 1. Visibility Check
      if (t.visibility === "private") return false;

      // 2. Search Query Check
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.game?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 3. Game Filter Check
      if (gameFilter !== "all" && t.game !== gameFilter) return false;

      return true;
    });
  }, [tournaments, searchQuery, gameFilter]);

  const isServerVerified = (serverId: string | null | undefined) => {
    if (!serverId || !servers) return false;
    const server = servers.find(s => s.id === serverId);
    return (server as any)?.isVerified === 1;
  };

  const handleJoinTournament = (tournamentId: string) => {
    setLocation(`/tournament/${tournamentId}/register`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <MobileLayout>
      <div className="p-4 pb-24 space-y-4">
        <div>
          <h1 className="text-xl font-bold mb-1" data-testid="page-title">Discover</h1>
          <p className="text-sm text-muted-foreground">Find and join tournaments</p>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Button
              variant={gameFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setGameFilter("all")}
              className="rounded-full h-8 text-xs whitespace-nowrap"
            >
              All Games
            </Button>
            {uniqueGames.map((game) => (
              <Button
                key={game}
                variant={gameFilter === game ? "default" : "outline"}
                size="sm"
                onClick={() => setGameFilter(game!)}
                className="rounded-full h-8 text-xs whitespace-nowrap"
              >
                {game}
              </Button>
            ))}
          </div>
        </div>

        {/* Section Header */}
        <div>
          <h2 className="text-lg font-bold border-b-2 border-foreground inline-block pb-1">
            Featured
          </h2>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredTournaments.map((tournament) => (
            <Card
              key={tournament.id}
              className="overflow-hidden hover-elevate group"
              data-testid={`tournament-card-${tournament.id}`}
            >
              {/* Portrait Poster Image */}
              <div className="relative aspect-square bg-gradient-to-br from-primary/30 to-primary/10">
                {/* Verified Badge */}
                {isServerVerified(tournament.serverId) && (
                  <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500 text-white text-xs font-medium" data-testid={`tournament-verified-${tournament.id}`}>
                    <Star className="w-3 h-3 fill-white" />
                    Verified
                  </div>
                )}

                {/* Game Badge - New visual element */}
                {tournament.game && (
                  <div className="absolute top-2 left-2 z-20">
                    <Badge variant="secondary" className="bg-black/60 hover:bg-black/70 text-white backdrop-blur-sm border-0 text-[10px] px-2 h-5">
                      {tournament.game}
                    </Badge>
                  </div>
                )}

                <OptimizedImage
                  src={tournament.imageUrl}
                  alt={tournament.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  thumbnailSize="lg"
                  fallback={
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                      <div className="relative">
                        <Trophy className="h-20 w-20 text-primary opacity-60 mb-2 relative z-10" />
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">No Poster</p>
                    </div>
                  }
                  data-testid={`tournament-poster-${tournament.id}`}
                />

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                {/* Prize & Entry Fee */}
                <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col items-center">
                  {tournament.prizeReward && (
                    <div
                      className="text-white font-black text-5xl md:text-3xl mb-1 tracking-tight flex items-center justify-center gap-2"
                      style={{ textShadow: '0 4px 12px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)' }}
                      data-testid={`tournament-prize-${tournament.id}`}
                    >
                      {tournament.prizeReward}
                    </div>
                  )}

                  {tournament.entryFee && (
                    <div
                      className="text-white/90 font-semibold text-sm md:text-xs bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10"
                      data-testid={`tournament-entry-fee-${tournament.id}`}
                    >
                      Entry: {tournament.entryFee}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-3 space-y-3">
                <div className="text-center">
                  <h3 className="font-bold text-base leading-tight mb-1 truncate px-1" title={tournament.name} data-testid={`tournament-name-${tournament.id}`}>
                    {tournament.name}
                  </h3>

                  {/* Date and Time Info */}
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {tournament.startDate
                          ? new Date(tournament.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                          : 'TBA'
                        }
                      </span>
                    </div>
                    <span className="text-muted-foreground/30">•</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span data-testid={`tournament-time-${tournament.id}`}>
                        {tournament.startDate
                          ? new Date(tournament.startDate).toLocaleTimeString(undefined, {
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                          : 'TBD'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-xs font-semibold shadow-sm"
                    onClick={() => handleJoinTournament(tournament.id)}
                    data-testid={`button-join-${tournament.id}`}
                  >
                    Join Now
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setSelectedTournament(tournament)}
                    data-testid={`button-details-${tournament.id}`}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTournaments.length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed">
            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground font-medium">No tournaments found</p>
            {(searchQuery || gameFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={() => { setSearchQuery(""); setGameFilter("all"); }}
                className="mt-2 text-xs"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Tournament Details Modal */}
        <Dialog open={!!selectedTournament} onOpenChange={(open) => !open && setSelectedTournament(null)}>
          <DialogContent className="max-w-md rounded-xl" data-testid="tournament-details-modal">
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl" data-testid="modal-tournament-name">
                {selectedTournament?.name}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2" data-testid="modal-tournament-game">
                <Gamepad2 className="h-4 w-4" />
                {selectedTournament?.game}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <OptimizedImage
                src={selectedTournament?.imageUrl}
                alt={selectedTournament?.name || "Tournament"}
                className="w-full rounded-lg aspect-video object-cover shadow-sm"
                thumbnailSize="lg"
                priority={true}
                fallback={
                  <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <Trophy className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                }
              />

              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedTournament?.prizeReward && (
                  <div className="col-span-2 flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-primary">Prize Pool</span>
                    </div>
                    <span className="font-bold text-lg">{selectedTournament.prizeReward}</span>
                  </div>
                )}

                <div className="p-3 bg-card border rounded-lg space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Users className="h-3.5 w-3.5" />
                    Teams
                  </div>
                  <div className="font-semibold">
                    {selectedTournament?.totalTeams === -1 ? "Unlimited" : selectedTournament?.totalTeams}
                  </div>
                </div>

                <div className="p-3 bg-card border rounded-lg space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    Date
                  </div>
                  <div className="font-semibold truncate">
                    {selectedTournament?.startDate ? new Date(selectedTournament.startDate).toLocaleDateString() : 'TBA'}
                  </div>
                </div>

                <div className="p-3 bg-card border rounded-lg space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <DollarSign className="h-3.5 w-3.5" />
                    Entry Fee
                  </div>
                  <div className="font-semibold">
                    {selectedTournament?.entryFee || "Free"}
                  </div>
                </div>

                <div className="p-3 bg-card border rounded-lg space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Star className="h-3.5 w-3.5" />
                    Format
                  </div>
                  <div className="font-semibold capitalize">
                    {selectedTournament?.format?.replace('_', ' ')}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 font-semibold"
                  size="lg"
                  data-testid="modal-button-join"
                  onClick={() => {
                    if (selectedTournament) {
                      setLocation(`/tournament/${selectedTournament.id}/register`);
                      setSelectedTournament(null);
                    }
                  }}
                >
                  Register Now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}
