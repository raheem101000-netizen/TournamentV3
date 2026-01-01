import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Trophy, Coins, Clock, Users, Monitor, MapPin, Shield, Info, ArrowRight, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Tournament, Server } from "@shared/schema";
import { format } from "date-fns";

type FilterType = "prize" | "no-prize" | "free" | "paid";

export default function PreviewHome() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [detailsModal, setDetailsModal] = useState<{ id: string; serverId?: string; title: string; game: string; serverName: string; serverLogo: string | null; serverLogoFallback: string; backgroundImage: string; posterWidth?: number | null; posterHeight?: number | null; prize: string; entryFee: string; startDate: string; startTime: string; participants: string; format: string; platform: string; region: string; } | null>(null);
  const [joinModal, setJoinModal] = useState<{ id: string; serverId?: string; title: string; game: string; serverName: string; serverLogo: string | null; serverLogoFallback: string; backgroundImage: string; posterWidth?: number | null; posterHeight?: number | null; prize: string; entryFee: string; startDate: string; startTime: string; participants: string; format: string; platform: string; region: string; } | null>(null);
  const [serverModal, setServerModal] = useState<{ name: string; logo: string | null; logoFallback: string; id?: string } | null>(null);

  const { data: tournaments, isLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  // Fetch servers to get real server names and icons
  const { data: servers } = useQuery<Server[]>({
    queryKey: ['/api/mobile-preview/servers'],
  });

  // Helper function to check if server is verified
  const isServerVerified = (serverId: string | null | undefined): boolean => {
    if (!serverId || !servers) return false;
    const server = servers.find(s => s.id === serverId);
    return (server as any)?.isVerified === 1;
  };

  // Helper function to join a server - shared by both mutations
  const joinServerAPI = async (serverId: string) => {
    const response = await apiRequest(
      'POST',
      `/api/servers/${serverId}/join`,
      { userId: "user-demo-123" }
    );
    const data = await response.json();
    return { ...data, serverId }; // Ensure serverId is included in response
  };

  // Shared join server mutation used by server modal (logo click path only)
  const joinServerMutation = useMutation({
    mutationFn: joinServerAPI,
    onSuccess: (data) => {
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ['/api/mobile-preview/servers'] });
      setServerModal(null);
      
      // Navigate to server after joining (logo click path always navigates)
      if (data.serverId) {
        if (data.alreadyMember) {
          toast({
            title: "Already a member",
            description: "Taking you to the server...",
          });
        } else {
          toast({
            title: "Joined server!",
            description: "Taking you to the server...",
          });
        }
        setLocation(`/server/${data.serverId}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to join server",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      setServerModal(null); // Close modal on error
    },
  });

  const registerTournamentMutation = useMutation({
    mutationFn: async ({ tournamentId, serverId }: { tournamentId: string; serverId?: string | null }) => {
      // First join the server if serverId is provided (reuse shared helper)
      let joinResult: { member: any; alreadyMember: boolean; serverId: string } | undefined;
      if (serverId) {
        try {
          joinResult = await joinServerAPI(serverId);
        } catch (error: any) {
          throw new Error(`Failed to join server: ${error.message || 'Unknown error'}`);
        }
      }
      
      // Try to register for tournament
      try {
        const response = await apiRequest('POST', `/api/tournaments/${tournamentId}/registrations`, {
          teamName: "Demo Team", // Would come from user input
          contactEmail: "demo@example.com",
          participantNames: ["Player 1", "Player 2"],
        });
        const registration = await response.json();
        return { joinResult, registration, alreadyRegistered: false };
      } catch (error: any) {
        // Check if error is 409 (conflict) with team name already exists message
        // apiRequest throws errors in format "STATUS_CODE: error message"
        if (error.message?.includes("409") && error.message?.includes("Team name already exists")) {
          return { joinResult, registration: null, alreadyRegistered: true, serverId };
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate cache for both tournaments and servers
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mobile-preview/servers'] });
      
      // Close modal
      setJoinModal(null);
      
      // Determine serverId for navigation
      const targetServerId = data.serverId || data.joinResult?.serverId;
      
      // Handle already registered case
      if (data.alreadyRegistered) {
        toast({
          title: "Already registered!",
          description: targetServerId ? "Taking you to the server..." : "You've already joined this tournament.",
        });
        if (targetServerId) {
          setLocation(`/server/${targetServerId}`);
        }
      }
      // Handle successful registration with server join
      else if (data.joinResult) {
        if (data.joinResult.alreadyMember) {
          toast({
            title: "Tournament registration successful!",
            description: "You were already a server member. Taking you to the server...",
          });
        } else {
          toast({
            title: "Successfully registered!",
            description: "You've joined the server and tournament. Taking you to the server...",
          });
        }
        // Always navigate for green button flow
        if (targetServerId) {
          setLocation(`/server/${targetServerId}`);
        }
      } 
      // No server involved, just tournament registration
      else {
        toast({
          title: "Tournament registration successful!",
          description: "You've been registered for the tournament.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      setJoinModal(null); // Close modal on error too
    },
  });

  const tournamentPosters = (tournaments || [])
    .filter((t) => {
      // Only include tournaments with valid server references
      const server = t.serverId ? servers?.find(s => s.id === t.serverId) : null;
      return !!server;
    })
    .map((t) => {
      // Look up server data (we know it exists because of filter)
      const server = servers?.find(s => s.id === t.serverId!)!;
      
      return {
        id: t.id,
        serverId: t.serverId || undefined,
        title: t.name,
        game: t.game || "Tournament",
        serverName: server.name,
        // Use real server icon (null if not set, for proper Avatar handling)
        serverLogo: server.iconUrl || null,
        serverLogoFallback: server.name.charAt(0),
        backgroundImage: t.imageUrl || "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&h=1200&fit=crop",
        posterWidth: t.posterWidth,
        posterHeight: t.posterHeight,
        prize: t.prizeReward || "TBD",
        entryFee: t.entryFee || "Free",
        visibility: t.visibility,
        startDate: t.startDate ? format(new Date(t.startDate), "MMM dd, yyyy") : "TBD",
        startTime: t.startDate ? format(new Date(t.startDate), "h:mm a") : "TBD",
        participants: t.totalTeams === -1 ? "Unlimited" : `${t.totalTeams || 0}`,
        format: t.format === "round_robin" ? "Round Robin" : t.format === "single_elimination" ? "Single Elimination" : "Swiss System",
        platform: t.platform || "Any Platform",
        region: t.region || "Global",
      };
    });

  // Only show real tournaments - no mock data
  const allPosters = tournamentPosters;
  
  // Filter posters based on search query and active filters (can be multiple at once)
  const displayPosters = allPosters.filter(poster => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = (
        poster.title.toLowerCase().includes(query) ||
        poster.game.toLowerCase().includes(query) ||
        poster.serverName.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }
    
    // Check visibility filters
    const visibilityFiltersActive = activeFilters.has("prize") || activeFilters.has("no-prize"); // This logic seems to be about prizes, let's add visibility
    
    // Visibility filter (Only show public tournaments in home preview by default)
    if (poster.visibility === "private") return false;
    
    // Normalize values for filtering
    const prizeNormalized = (poster.prize || "").toLowerCase().trim();
    const entryFeeNormalized = (poster.entryFee || "").toLowerCase().trim();
    
    // Helper to check if value matches "no prize" keywords (exact words only)
    const isNoPrizeKeyword = (value: string) => {
      const words = value.split(/[\s,;]+/);
      const noPrizeTerms = ["no", "none", "n/a", "tbd", "na"];
      return words.some(word => noPrizeTerms.includes(word));
    };
    
    // Helper to check if value matches "free" keywords
    const isFreeKeyword = (value: string) => {
      // Check for keyword matches
      const words = value.split(/[\s,;$]+/);
      const freeTerms = ["free", "none", "n/a", "tbd", "na", "no"];
      if (words.some(word => freeTerms.includes(word))) {
        return true;
      }
      
      // Check if value is numeric zero (handles 0, 0.00, 0,00, 0€, etc.)
      const numericValue = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
      const parsed = parseFloat(numericValue);
      if (!isNaN(parsed) && parsed === 0) {
        return true;
      }
      
      return false;
    };
    
    // Check prize filters (at least one must match if any prize filter is active)
    const prizeFiltersActive = activeFilters.has("prize") || activeFilters.has("no-prize");
    if (prizeFiltersActive) {
      const hasPrize = prizeNormalized && !isNoPrizeKeyword(prizeNormalized);
      const noPrize = !prizeNormalized || isNoPrizeKeyword(prizeNormalized);
      
      let prizeMatches = false;
      if (activeFilters.has("prize") && hasPrize) prizeMatches = true;
      if (activeFilters.has("no-prize") && noPrize) prizeMatches = true;
      
      if (!prizeMatches) return false;
    }
    
    // Check entry fee filters (at least one must match if any fee filter is active)
    const feeFiltersActive = activeFilters.has("free") || activeFilters.has("paid");
    if (feeFiltersActive) {
      const isFree = !entryFeeNormalized || isFreeKeyword(entryFeeNormalized);
      const isPaid = entryFeeNormalized && !isFreeKeyword(entryFeeNormalized);
      
      let feeMatches = false;
      if (activeFilters.has("free") && isFree) feeMatches = true;
      if (activeFilters.has("paid") && isPaid) feeMatches = true;
      
      if (!feeMatches) return false;
    }
    
    return true;
  });

  // Helper to toggle a filter
  const toggleFilter = (filter: FilterType) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(filter)) {
      newFilters.delete(filter);
    } else {
      newFilters.add(filter);
    }
    setActiveFilters(newFilters);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40">
        <div className={`container max-w-lg mx-auto px-4 ${showSearch ? "py-3 space-y-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" : "py-2"}`}>
          <div className="flex items-center justify-end gap-2">
            {showSearch ? (
              <div className="relative flex-1 animate-in fade-in slide-in-from-right-4 duration-200">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tournaments..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => {
                    if (!searchQuery) setShowSearch(false);
                  }}
                  data-testid="input-search-tournaments"
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex-1" />
            )}
            <Button 
              size="icon" 
              variant={showSearch ? "default" : "ghost"}
              onClick={() => setShowSearch(!showSearch)}
              data-testid="button-search-toggle"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
          
          {showSearch && searchQuery && (
            <div className="flex gap-2 overflow-x-auto pb-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <Badge 
                variant={activeFilters.size === 0 ? "default" : "outline"} 
                className="whitespace-nowrap text-xs px-3 cursor-pointer" 
                onClick={() => setActiveFilters(new Set())}
                data-testid="filter-all"
              >
                All
              </Badge>
              <Badge 
                variant={activeFilters.has("prize") ? "default" : "outline"} 
                className="whitespace-nowrap text-xs px-3 cursor-pointer" 
                onClick={() => toggleFilter("prize")}
                data-testid="filter-prize"
              >
                Prize
              </Badge>
              <Badge 
                variant={activeFilters.has("no-prize") ? "default" : "outline"} 
                className="whitespace-nowrap text-xs px-3 cursor-pointer" 
                onClick={() => toggleFilter("no-prize")}
                data-testid="filter-no-prize"
              >
                No Prize
              </Badge>
              <Badge 
                variant={activeFilters.has("free") ? "default" : "outline"} 
                className="whitespace-nowrap text-xs px-3 cursor-pointer" 
                onClick={() => toggleFilter("free")}
                data-testid="filter-free"
              >
                Free Entry
              </Badge>
              <Badge 
                variant={activeFilters.has("paid") ? "default" : "outline"} 
                className="whitespace-nowrap text-xs px-3 cursor-pointer" 
                onClick={() => toggleFilter("paid")}
                data-testid="filter-paid"
              >
                Paid Entry
              </Badge>
            </div>
          )}
        </div>
      </header>

      <main className="px-3 py-4">
        <div className="space-y-6 max-w-sm mx-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading tournaments...</p>
            </div>
          ) : displayPosters.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground font-semibold">No tournaments available</p>
              <p className="text-sm text-muted-foreground mt-2">Check back soon for upcoming events!</p>
            </div>
          ) : (
            displayPosters.map((poster) => (
            <Card
              key={poster.id}
              className="overflow-hidden hover-elevate cursor-pointer w-full"
              data-testid={`tournament-poster-${poster.id}`}
              onClick={() => setDetailsModal(poster)}
            >
              {/* Image stage - uses stored dimensions or defaults to 16:9 */}
              <div 
                className="relative w-full overflow-hidden bg-black/20" 
                style={{ 
                  aspectRatio: poster.posterWidth && poster.posterHeight 
                    ? `${poster.posterWidth}/${poster.posterHeight}` 
                    : '16/9' 
                }}
              >
                {/* Verified Badge - Top Right of Poster */}
                {isServerVerified(poster.serverId) && (
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500 text-white text-xs font-medium" data-testid={`tournament-verified-${poster.id}`}>
                    <Star className="w-3 h-3 fill-white" />
                    Verified
                  </div>
                )}
                {/* Image - covers the container since dimensions match */}
                <img
                  src={poster.backgroundImage}
                  alt={poster.title}
                  className="w-full h-full object-cover"
                />
                {/* Server icon overlay on image */}
                <button
                  className="absolute top-3 left-3 z-20 cursor-pointer hover-elevate active-elevate-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setServerModal({ name: poster.serverName, logo: poster.serverLogo, logoFallback: poster.serverLogoFallback, id: poster.serverId });
                  }}
                  data-testid={`button-server-${poster.id}`}
                >
                  <Avatar className="w-10 h-10 border-2 border-white/30">
                    {poster.serverLogo && <AvatarImage src={poster.serverLogo} alt={poster.serverName} />}
                    <AvatarFallback className="text-sm bg-black/60 text-white">
                      {poster.serverLogoFallback}
                    </AvatarFallback>
                  </Avatar>
                </button>
                
                {/* Tournament name overlay at bottom of image */}
                <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-3 py-2 pt-8">
                  <h2 className="text-xl font-bold text-white leading-tight drop-shadow-lg">
                    {poster.title}
                  </h2>
                  <div className="flex items-center justify-between mt-1">
                    {poster.game && (
                      <span className="text-sm text-white/80 font-medium">
                        {poster.game}
                      </span>
                    )}
                    <div className="flex items-center gap-3 text-xs text-white/70">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{poster.participants}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{poster.startDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tournament info section */}
              <div className="p-2 space-y-2">
                {/* Prize pool and entry fee - centered */}
                <div className="flex items-center justify-center gap-4">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                      <Trophy className="w-3.5 h-3.5" />
                      <span className="font-bold text-sm">{poster.prize}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Prize Pool</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                      <Coins className="w-3.5 h-3.5" />
                      <span className="font-semibold text-sm">{poster.entryFee}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Entry Fee</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    size="default" 
                    className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setJoinModal(poster);
                    }}
                    data-testid={`button-join-${poster.id}`}
                  >
                    Join Tournament
                  </Button>
                  <Button 
                    size="icon"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailsModal(poster);
                    }}
                    data-testid={`button-details-${poster.id}`}
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
          )}
        </div>
      </main>

      <BottomNavigation />

      {/* Details Modal */}
      <Dialog open={!!detailsModal} onOpenChange={() => setDetailsModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">{detailsModal?.title}</DialogTitle>
            <DialogDescription>{detailsModal?.game}</DialogDescription>
          </DialogHeader>
          
          {detailsModal && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  {detailsModal.serverLogo && <AvatarImage src={detailsModal.serverLogo} alt={detailsModal.serverName} />}
                  <AvatarFallback className="text-2xl">{detailsModal.serverLogoFallback}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{detailsModal.serverName}</p>
                  <p className="text-sm text-muted-foreground">Tournament Host</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Prize Pool</p>
                  <p className="text-xl font-bold text-green-600">{detailsModal.prize}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Entry Fee</p>
                  <p className="text-xl font-bold">{detailsModal.entryFee}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Start Time</span>
                  </div>
                  <span className="font-semibold text-sm">{detailsModal.startDate} • {detailsModal.startTime}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Players</span>
                  </div>
                  <span className="font-semibold text-sm">{detailsModal.participants}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Trophy className="w-4 h-4" />
                    <span className="text-sm">Format</span>
                  </div>
                  <span className="font-semibold text-sm">{detailsModal.format}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Monitor className="w-4 h-4" />
                    <span className="text-sm">Platform</span>
                  </div>
                  <span className="font-semibold text-sm">{detailsModal.platform}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Region</span>
                  </div>
                  <span className="font-semibold text-sm">{detailsModal.region}</span>
                </div>
              </div>

              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                onClick={() => {
                  setDetailsModal(null);
                  setJoinModal(detailsModal);
                }}
                data-testid="button-join-from-details"
              >
                Join Tournament
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Join Options Modal */}
      <Dialog open={!!joinModal} onOpenChange={() => setJoinModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Join Tournament</DialogTitle>
            <DialogDescription>
              Choose how you'd like to join {joinModal?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <Button
              className="w-full justify-between h-auto py-4 px-4"
              variant="outline"
              data-testid="button-join-server"
              onClick={() => {
                if (joinModal?.serverId) {
                  joinServerMutation.mutate(joinModal.serverId);
                  setJoinModal(null);
                }
              }}
              disabled={joinServerMutation.isPending}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">{joinServerMutation.isPending ? "Joining..." : "Join Server"}</p>
                  <p className="text-xs text-muted-foreground">
                    Join {joinModal?.serverName}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </Button>

            <Button
              className="w-full justify-between h-auto py-4 px-4"
              variant="outline"
              data-testid="button-signup-page"
              onClick={() => {
                if (joinModal?.id) {
                  setLocation(`/tournament/${joinModal.id}/register`);
                  setJoinModal(null);
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Sign Up for Tournament</p>
                  <p className="text-xs text-muted-foreground">
                    View tournament details and register
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Server Details Modal */}
      <Dialog open={!!serverModal} onOpenChange={() => setServerModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                {serverModal?.logo && <AvatarImage src={serverModal.logo} alt={serverModal.name} />}
                <AvatarFallback className="text-2xl">{serverModal?.logoFallback}</AvatarFallback>
              </Avatar>
              <span>{serverModal?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Tournament Server
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Join this server to participate in tournaments, connect with other players, and stay updated on upcoming events.
            </div>

            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
              onClick={() => {
                if (serverModal?.id) {
                  joinServerMutation.mutate(serverModal.id);
                }
              }}
              disabled={joinServerMutation.isPending}
              data-testid="button-join-server-from-modal"
            >
              <Users className="w-4 h-4 mr-2" />
              {joinServerMutation.isPending ? "Joining..." : "Join Server"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
