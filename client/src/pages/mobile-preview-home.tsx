import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Users, Trophy, DollarSign, Star, Info, Search, Gamepad2, Laptop, MapPin, SlidersHorizontal, X } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import type { Tournament, Server } from "@shared/schema";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type EnrichedTournament = Tournament & { organizerAvatarUrl?: string | null };
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function MobilePreviewHome() {
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: tournaments, isLoading } = useQuery<EnrichedTournament[]>({
    queryKey: ["/api/tournaments"],
  });

  const { data: servers } = useQuery<Server[]>({
    queryKey: ["/api/mobile-preview/servers"],
  });

  const { user } = useAuth();
  const { data: savedTournaments } = useQuery<(Tournament & { savedAt: string })[]>({
    queryKey: ['/api/users/me/saved-tournaments'],
    enabled: !!user,
  });

  useEffect(() => {
    if (!filtersExpanded) return;

    const closeFiltersOnScroll = () => setFiltersExpanded(false);
    window.addEventListener("scroll", closeFiltersOnScroll, true);

    return () => {
      window.removeEventListener("scroll", closeFiltersOnScroll, true);
    };
  }, [filtersExpanded]);

  const uniqueGames = useMemo(() => {
    if (!tournaments) return [];
    const games = new Set(
      tournaments
        .map((t) => t.game)
        .filter((game): game is string => typeof game === "string" && game.length > 0)
    );
    return Array.from(games);
  }, [tournaments]);

  const toggleGameSelection = (game: string) => {
    setSelectedGames((prev) =>
      prev.includes(game) ? prev.filter((value) => value !== game) : [...prev, game]
    );
  };

  const filteredTournaments = useMemo(() => {
    if (!tournaments) return [];
    return tournaments.filter(t => {
      // 1. Visibility Check
      if (t.visibility === "private") return false;

      // 2. Date Check - Hide tournaments that have completely ended
      // Show tournaments that: have no endDate, OR endDate is in the future, OR status is not 'completed'
      const now = new Date();
      if (t.endDate && new Date(t.endDate) < now && t.status === 'completed') return false;

      // 3. Search Query Check
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.game?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 4. Game Filter Check (multi-select)
      if (selectedGames.length > 0 && (!t.game || !selectedGames.includes(t.game))) return false;

      return true;
    });
  }, [tournaments, searchQuery, selectedGames]);

  const isServerVerified = (serverId: string | null | undefined) => {
    if (!serverId || !servers) return false;
    const server = servers.find(s => s.id === serverId);
    return (server as any)?.isVerified === 1;
  };

  const handleJoinTournament = (tournamentId: string) => {
    setLocation(`/tournament/${tournamentId}/register`);
  };

  const handleToggleSave = async (e: React.MouseEvent, tournamentId: string) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: "Login required", description: "Please login to save tournaments", variant: "destructive" });
      return;
    }

    const isSaved = savedTournaments?.some(st => st.id === tournamentId);

    try {
      if (isSaved) {
        await apiRequest('DELETE', `/api/tournaments/${tournamentId}/save`);
        toast({ title: "Tournament removed", description: "Removed from saved tournaments" });
      } else {
        await apiRequest('POST', `/api/tournaments/${tournamentId}/save`);
        toast({ title: "Tournament saved", description: "Added to saved tournaments" });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/mobile-preview/servers`] }); // also updates home potentially? No, separate.
      queryClient.invalidateQueries({ queryKey: [`/api/users/me/saved-tournaments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/saved`] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update saved status", variant: "destructive" });
    }
  };

  // Moved loading state handling inside the render to show layout frame immediately
  const showSkeletons = isLoading && !tournaments;

  // if (isLoading) { return ... }  <-- Removed full page blocker

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

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Button
              variant={filtersExpanded || selectedGames.length > 0 ? "default" : "outline"}
              size="sm"
              className="rounded-full h-8 text-xs whitespace-nowrap"
              onClick={() => setFiltersExpanded((prev) => !prev)}
              data-testid="button-game-filters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
              Filter
              {selectedGames.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                  {selectedGames.length}
                </Badge>
              )}
            </Button>

            {filtersExpanded && selectedGames.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-[11px] whitespace-nowrap"
                onClick={() => setSelectedGames([])}
              >
                Clear
              </Button>
            )}

            {(filtersExpanded ? uniqueGames : selectedGames.slice(0, 3)).map((game) => (
              <Button
                key={game}
                type="button"
                variant={selectedGames.includes(game) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleGameSelection(game)}
                className="rounded-full h-8 text-xs whitespace-nowrap"
              >
                {game}
                {selectedGames.includes(game) && !filtersExpanded && <X className="w-3 h-3 ml-1" />}
              </Button>
            ))}

            {!filtersExpanded && selectedGames.length > 3 && (
              <Badge variant="outline" className="rounded-full h-8 px-2 text-[11px] whitespace-nowrap">
                +{selectedGames.length - 3}
              </Badge>
            )}

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
          {showSkeletons ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="px-4 pb-4 pt-0">
                  <Skeleton className="w-10 h-10 rounded-full -mt-5" />
                  <div className="mt-2 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </div>
              </Card>
            ))
          ) : (
            filteredTournaments.map((tournament, index) => (
              <Card
                key={tournament.id}
                className="overflow-hidden hover-elevate group"
                data-testid={`tournament-card-${tournament.id}`}
              >
                {/* Portrait Poster Image */}
                <div className="relative aspect-square bg-gradient-to-br from-primary/30 to-primary/10">
                  {/* Top Right: Verified + Save */}
                  <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
                    {isServerVerified(tournament.serverId) && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500 text-white text-xs font-medium shadow-sm" data-testid={`tournament-verified-${tournament.id}`}>
                        <Star className="w-3 h-3 fill-white" />
                        Verified
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white border border-white/10"
                      onClick={(e) => handleToggleSave(e, tournament.id)}
                    >
                      <Star
                        className={`h-4 w-4 ${savedTournaments?.some(st => st.id === tournament.id) ? "fill-yellow-400 text-yellow-400" : "text-white"}`}
                      />
                    </Button>
                  </div>

                  {/* Game badge top-left */}
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
                    priority={index < 3}
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

                  {/* Prize & Entry Fee overlay */}
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

                {/* Card content with overlapping avatar */}
                <div className="relative px-4 pb-4 pt-0">
                  {/* Organizer avatar overlapping poster */}
                  {tournament.serverId ? (
                    <button
                      type="button"
                      className="-mt-5 rounded-full cursor-pointer transition-all hover:ring-2 hover:ring-primary/60 hover:ring-offset-1"
                      onClick={() => setLocation(`/server/${tournament.serverId}`)}
                      aria-label={`Open server details for ${tournament.name}`}
                    >
                      <Avatar className="w-10 h-10 border-[3px] border-card bg-card shadow-md">
                        {tournament.organizerAvatarUrl && (
                          <AvatarImage src={tournament.organizerAvatarUrl} alt={tournament.organizerName || "Organizer"} />
                        )}
                        <AvatarFallback className="text-xs font-bold">
                          {tournament.organizerName?.[0]?.toUpperCase() || <Trophy className="w-4 h-4 text-primary" />}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  ) : (
                    <Avatar className="w-10 h-10 -mt-5 border-[3px] border-card bg-card shadow-md">
                      {tournament.organizerAvatarUrl && (
                        <AvatarImage src={tournament.organizerAvatarUrl} alt={tournament.organizerName || "Organizer"} />
                      )}
                      <AvatarFallback className="text-xs font-bold">
                        {tournament.organizerName?.[0]?.toUpperCase() || <Trophy className="w-4 h-4 text-primary" />}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="mt-2 space-y-1.5">
                    <h3 className="font-bold text-base leading-tight truncate" title={tournament.name} data-testid={`tournament-name-${tournament.id}`}>
                      {tournament.name}
                    </h3>

                    {/* Description: platform, region, format */}
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {[tournament.platform, tournament.region, tournament.format?.replace('_', ' ')].filter(Boolean).join(' · ') || 'Tournament details TBA'}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
                      {tournament.prizeReward && (
                        <span className="flex items-center gap-1 text-amber-400 font-semibold" data-testid={`tournament-prize-inline-${tournament.id}`}>
                          <Trophy className="w-3 h-3" />
                          {tournament.prizeReward}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {tournament.startDate
                          ? new Date(tournament.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                          : 'TBA'}
                      </span>
                      {tournament.entryFee && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {tournament.entryFee}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
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
            )))
          }
        </div>

        {filteredTournaments.length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed">
            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground font-medium">No tournaments found</p>
            {(searchQuery || selectedGames.length > 0) && (
              <Button
                variant="ghost"
                onClick={() => { setSearchQuery(""); setSelectedGames([]); }}
                className="mt-2 text-xs"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Tournament Details Modal */}
        <Dialog open={!!selectedTournament} onOpenChange={(open) => !open && setSelectedTournament(null)}>
          <DialogContent className="max-w-md p-0 rounded-2xl overflow-hidden border-white/10 bg-zinc-900/95 backdrop-blur-xl" data-testid="tournament-details-modal">
            {/* Hero Image with overlays */}
            <div className="relative h-44 overflow-hidden">
              <OptimizedImage
                src={selectedTournament?.imageUrl}
                alt={selectedTournament?.name || "Tournament"}
                className="w-full h-full object-cover"
                thumbnailSize="lg"
                priority={true}
                fallback={
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <Trophy className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                }
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

              {/* Game Badge */}
              <div className="absolute bottom-2 left-3 flex items-center gap-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-xs font-medium text-white/90">
                <Gamepad2 className="w-3 h-3" />
                <span className="uppercase tracking-wider">{selectedTournament?.game}</span>
              </div>

              {/* Status Badge */}
              <div className="absolute top-2 left-3 px-2 py-0.5 bg-emerald-500/90 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                {selectedTournament?.status || "Open"}
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Title & Prize */}
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white leading-tight" data-testid="modal-tournament-name">
                  {selectedTournament?.name}
                </h2>

                {selectedTournament?.prizeReward && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 rounded-lg">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-base font-bold text-amber-400">{selectedTournament.prizeReward}</span>
                  </div>
                )}
              </div>

              {/* Stats Grid - 3x2 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                  <Users className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  <p className="text-xs text-white/50">Teams</p>
                  <p className="text-sm font-semibold text-white">{selectedTournament?.totalTeams === -1 ? "∞" : selectedTournament?.totalTeams}</p>
                </div>

                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                  <Calendar className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                  <p className="text-xs text-white/50">Date</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {selectedTournament?.startDate ? new Date(selectedTournament.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBA'}
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                  <DollarSign className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  <p className="text-xs text-white/50">Entry</p>
                  <p className="text-sm font-semibold text-white">{selectedTournament?.entryFee || "Free"}</p>
                </div>

                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                  <Star className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                  <p className="text-xs text-white/50">Format</p>
                  <p className="text-sm font-semibold text-white truncate capitalize">{selectedTournament?.format?.replace('_', ' ')}</p>
                </div>

                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                  <Laptop className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                  <p className="text-xs text-white/50">Platform</p>
                  <p className="text-sm font-semibold text-white truncate capitalize">{selectedTournament?.platform || "Any"}</p>
                </div>

                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                  <MapPin className="w-4 h-4 mx-auto mb-1 text-rose-400" />
                  <p className="text-xs text-white/50">Region</p>
                  <p className="text-sm font-semibold text-white truncate capitalize">{selectedTournament?.region || "Global"}</p>
                </div>
              </div>

              {/* Register Button */}
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold h-11 rounded-xl shadow-lg shadow-blue-900/30"
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
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}
