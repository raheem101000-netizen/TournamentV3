import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, Settings, Trophy, Lock, Plus, ChevronLeft, ChevronRight, FolderOpen, ArrowLeft, BookOpen, Users, Crown, Search, LogOut, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState, useCallback, useEffect } from "react";
import type { Server, Tournament, Channel, ChannelCategory } from "@shared/schema";
import AnnouncementsChannel from "@/components/channels/AnnouncementsChannel";
import ChatChannel from "@/components/channels/ChatChannel";
import TournamentDashboardChannel from "@/components/channels/TournamentDashboardChannel";
import CreateChannelDialog from "@/components/CreateChannelDialog";
import ManageCategoriesDialog from "@/components/ManageCategoriesDialog";
import useEmblaCarousel from "embla-carousel-react";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileModal from "@/components/UserProfileModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PreviewServerDetail() {
  const [match, params] = useRoute("/server/:serverId");
  const [, setLocation] = useLocation();
  const serverId = params?.serverId;
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [showWelcomePage, setShowWelcomePage] = useState(false); // Users see channel list first
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showMembersView, setShowMembersView] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [leaveServerDialogOpen, setLeaveServerDialogOpen] = useState(false);

  const { user } = useAuth();
  const currentUserId = user?.id;
  const { toast } = useToast();

  const { data: userPermissions, isError: permissionsError, isLoading: permissionsLoading } = useQuery<{ permissions: string[] }>({
    queryKey: [`/api/servers/${serverId}/members/${currentUserId}/permissions`],
    enabled: !!serverId && !!currentUserId,
  });

  const { data: server, isLoading: serverLoading } = useQuery<Server>({
    queryKey: [`/api/servers/${serverId}`],
    enabled: !!serverId,
  });

  const { data: channels = [], isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: [`/api/servers/${serverId}/channels`],
    enabled: !!serverId,
    refetchInterval: 5000,
    staleTime: 0,
  });

  const { data: categories = [] } = useQuery<ChannelCategory[]>({
    queryKey: [`/api/servers/${serverId}/categories`],
    enabled: !!serverId,
  });

  interface EnrichedMember {
    id: string;
    serverId: string;
    userId: string;
    roleId: string | null;
    role: string | null;
    customTitle: string | null;
    joinedAt: Date;
    username: string;
    avatarUrl: string | null;
    isOwner: boolean;
    roleName: string;
    roleColor: string;
  }

  const { data: members = [] } = useQuery<EnrichedMember[]>({
    queryKey: [`/api/servers/${serverId}/members`],
    enabled: !!serverId,
  });

  const { data: tournaments } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  const isOwner = server?.ownerId === currentUserId;

  const leaveServerMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/servers/${serverId}/members/${currentUserId}`);
    },
    onSuccess: () => {
      toast({
        title: "Left server",
        description: "You have successfully left the server.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/servers`] });
      setLocation('/myservers');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to leave server",
        variant: "destructive",
      });
    },
  });

  // Filter upcoming tournaments for this server
  const serverTournaments = tournaments?.filter(t => t.serverId === serverId && t.status === "upcoming") || [];
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Tournament Dashboard should always be first (position 0)
  const tournamentDashboard = channels.find(c => c.type === "tournament_dashboard");
  const otherChannels = channels.filter(c => c.type !== "tournament_dashboard");
  const publicChannels = otherChannels.filter(c => !c.isPrivate).sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
  const privateChannels = otherChannels.filter(c => c.isPrivate).sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
  const selectedChannel = channels.find(c => c.id === selectedChannelId) || channels[0];

  if (serverLoading || channelsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading server...</p>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Server not found</p>
      </div>
    );
  }

  // If members view is selected, show members list
  if (showMembersView) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button 
                size="icon" 
                variant="ghost"
                onClick={() => {
                  setShowMembersView(false);
                  setMemberSearchQuery("");
                }}
                data-testid="button-back-from-members"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <h1 className="text-lg font-bold truncate">Members</h1>
                </div>
                <p className="text-xs text-muted-foreground">{members.length} members</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container max-w-lg mx-auto px-4 py-4 flex-1">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-members"
            />
          </div>
          <div className="space-y-2">
            {members
              .filter((member) => member.username !== "Unknown")
              .filter((member) => 
                memberSearchQuery === "" || 
                member.username.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                member.roleName.toLowerCase().includes(memberSearchQuery.toLowerCase())
              )
              .sort((a, b) => {
                if (a.isOwner && !b.isOwner) return -1;
                if (!a.isOwner && b.isOwner) return 1;
                return a.username.localeCompare(b.username);
              })
              .map((member) => (
                <Card
                  key={member.id}
                  className="p-4 cursor-pointer hover-elevate"
                  onClick={() => {
                    setSelectedProfileUserId(member.userId);
                    setProfileModalOpen(true);
                  }}
                  data-testid={`member-card-${member.userId}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      {member.avatarUrl ? (
                        <AvatarImage src={member.avatarUrl} alt={member.username} />
                      ) : null}
                      <AvatarFallback>
                        {member.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{member.username}</span>
                        {member.isOwner && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <span 
                        className="text-sm" 
                        style={{ color: member.roleColor }}
                      >
                        {member.isOwner ? "Owner" : member.roleName}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            {members.filter(m => m.username !== "Unknown").filter(m => 
              memberSearchQuery === "" || 
              m.username.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
              m.roleName.toLowerCase().includes(memberSearchQuery.toLowerCase())
            ).length === 0 && memberSearchQuery !== "" && (
              <p className="text-center text-muted-foreground py-4">
                No members found matching "{memberSearchQuery}"
              </p>
            )}
          </div>
        </main>

        <UserProfileModal
          userId={selectedProfileUserId}
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
        />

        <BottomNavigation />
      </div>
    );
  }

  // If welcome page is selected, show welcome content
  if (showWelcomePage) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button 
                size="icon" 
                variant="ghost"
                onClick={() => setShowWelcomePage(false)}
                data-testid="button-back-to-channels"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <h1 className="text-lg font-bold truncate">Welcome</h1>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" data-testid="button-server-menu-welcome">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOwner && (
                    <DropdownMenuItem 
                      onClick={() => serverId && setLocation(`/server/${serverId}/settings`)}
                      data-testid="menu-item-settings-welcome"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  )}
                  {!isOwner && (
                    <DropdownMenuItem 
                      onClick={() => setLeaveServerDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
                      data-testid="menu-item-leave-server-welcome"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Leave Server
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <AlertDialog open={leaveServerDialogOpen} onOpenChange={setLeaveServerDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave Server</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to leave {server.name}? You will need to rejoin through an invite link or the Discovery page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => leaveServerMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {leaveServerMutation.isPending ? "Leaving..." : "Leave Server"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <main className="container max-w-lg mx-auto px-4 py-4 flex-1">
          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="flex items-center gap-2">
                {server.iconUrl && (
                  <img 
                    src={server.iconUrl} 
                    alt={server.name}
                    className="w-8 h-8 rounded"
                  />
                )}
                Welcome to {server.name}
              </CardTitle>
              {server.description && (
                <p className="text-muted-foreground text-sm">{server.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {server.welcomeMessage ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap" data-testid="text-welcome-message">
                    {server.welcomeMessage}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No welcome message has been set for this server.
                </p>
              )}
              
              {server.gameTags && server.gameTags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {server.gameTags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{members.filter(m => m.username !== "Unknown").length} members</span>
                </div>
                <Badge variant="outline">{server.category}</Badge>
              </div>
            </CardContent>
          </Card>
        </main>

        <BottomNavigation />
      </div>
    );
  }

  // If a channel is selected, show channel content
  if (selectedChannelId && selectedChannel) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button 
                size="icon" 
                variant="ghost"
                onClick={() => setSelectedChannelId(null)}
                data-testid="button-back-to-channels"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedChannel.icon}</span>
                  <h1 className="text-lg font-bold truncate">{selectedChannel.name}</h1>
                  {selectedChannel.isPrivate && (
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container max-w-lg mx-auto px-4 py-4 flex-1">
          {selectedChannel.type === "tournament_dashboard" && (
            <>
              {permissionsLoading ? (
                <Card className="mt-8">
                  <CardContent className="py-8">
                    <p className="text-muted-foreground text-center">Loading permissions...</p>
                  </CardContent>
                </Card>
              ) : (server?.ownerId === currentUserId || 
                     (!permissionsError && userPermissions?.permissions?.includes("tournament_dashboard_access"))) ? (
                <TournamentDashboardChannel serverId={serverId!} />
              ) : (
                <Card className="mt-8">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                      <CardTitle>Access Restricted</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      You don't have permission to access the Tournament Dashboard.
                      Only the server owner or users with "Tournament Dashboard Access" permission can view this channel.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
          {selectedChannel.type === "announcements" && (
            <AnnouncementsChannel 
              channelId={selectedChannel.id} 
              canPost={server?.ownerId === currentUserId}
            />
          )}
          {selectedChannel.type === "chat" && (
            <ChatChannel channelId={selectedChannel.id} />
          )}
        </main>

        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              size="icon" 
              variant="ghost"
              onClick={() => window.history.back()}
              data-testid="button-back-to-servers"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-10 h-10">
              <AvatarImage src={server.iconUrl || undefined} alt={server.name} />
              <AvatarFallback className="text-2xl">
                {server.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold truncate">{server.name}</h1>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <button 
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={() => setShowMembersView(true)}
                  data-testid="button-show-members"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>{members.filter(m => m.username !== "Unknown").length} members</span>
                </button>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" data-testid="button-server-menu">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && (
                  <DropdownMenuItem 
                    onClick={() => serverId && setLocation(`/server/${serverId}/settings`)}
                    data-testid="menu-item-settings"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                )}
                {!isOwner && (
                  <>
                    {isOwner && <DropdownMenuSeparator />}
                    <DropdownMenuItem 
                      onClick={() => setLeaveServerDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
                      data-testid="menu-item-leave-server"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Leave Server
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <AlertDialog open={leaveServerDialogOpen} onOpenChange={setLeaveServerDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Server</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave {server.name}? You will need to rejoin through an invite link or the Discovery page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-leave">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => leaveServerMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-leave"
            >
              {leaveServerMutation.isPending ? "Leaving..." : "Leave Server"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="container max-w-lg mx-auto px-4 py-4 space-y-4">
        {serverTournaments.length > 0 && (
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Upcoming Tournaments</h3>
              {serverTournaments.length > 1 && (
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={scrollPrev}
                    disabled={!canScrollPrev}
                    data-testid="button-carousel-prev"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={scrollNext}
                    disabled={!canScrollNext}
                    data-testid="button-carousel-next"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-4">
                {serverTournaments.map((tournament) => (
                  <div key={tournament.id} className="flex-[0_0_100%] min-w-0">
                    <Card className="overflow-hidden" data-testid={`tournament-card-${tournament.id}`}>
                      {tournament.imageUrl ? (
                        <div className="relative h-32 overflow-hidden">
                          <img
                            src={tournament.imageUrl}
                            alt={tournament.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Trophy className="w-16 h-16 text-primary/40" />
                          </div>
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg mb-1">{tournament.name}</CardTitle>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <Badge variant="secondary">
                                {tournament.format.replace('_', ' ')}
                              </Badge>
                              {tournament.prizeReward && (
                                <Badge variant="outline">
                                  {tournament.prizeReward}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/tournament/${tournament.id}/register`);
                            }}
                            data-testid={`button-join-tournament-${tournament.id}`}
                          >
                            Join
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {tournament.game || "Gaming Tournament"}
                        </p>
                        {(tournament.platform || tournament.region) && (
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            {tournament.platform && <span>• {tournament.platform}</span>}
                            {tournament.region && <span>• {tournament.region}</span>}
                          </div>
                        )}
                        {tournament.entryFee !== null && (
                          <p className="text-xs text-muted-foreground">
                            Entry Fee: ${tournament.entryFee}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {/* Tournament Dashboard - Private section */}
          {tournamentDashboard && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Private
                </h3>
              </div>
              <div className="space-y-1">
                <Card
                  className="p-3 hover-elevate cursor-pointer border-0 shadow-none"
                  onClick={() => setSelectedChannelId(tournamentDashboard.id)}
                  data-testid={`channel-${tournamentDashboard.slug}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{tournamentDashboard.icon}</span>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="font-medium truncate">{tournamentDashboard.name}</span>
                      <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Public Channels */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 px-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Channels
              </h3>
              {server.ownerId === currentUserId && (
                <div className="flex gap-1">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6"
                    onClick={() => setManageCategoriesOpen(true)}
                    data-testid="button-manage-categories"
                    title="Manage Categories"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6"
                    onClick={() => setCreateChannelOpen(true)}
                    data-testid="button-create-channel"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Welcome Page - First in Channels */}
            <div className="space-y-1">
              <Card
                className="p-3 hover-elevate cursor-pointer border-0 shadow-none"
                onClick={() => setShowWelcomePage(true)}
                data-testid="channel-welcome-page"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5" />
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="font-medium truncate">Welcome Page</span>
                  </div>
                </div>
              </Card>
            </div>

              {/* Categorized channels */}
              {categories.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((category) => {
                const categoryChannels = publicChannels.filter(c => c.categoryId === category.id);
                if (categoryChannels.length === 0) return null;

                return (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {category.name}
                      </h4>
                    </div>
                    <div className="space-y-1">
                      {categoryChannels.map((channel) => (
                        <Card
                          key={channel.id}
                          className="p-3 hover-elevate cursor-pointer border-0 shadow-none"
                          onClick={() => setSelectedChannelId(channel.id)}
                          data-testid={`channel-${channel.slug}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{channel.icon}</span>
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <span className="font-medium truncate">{channel.name}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Uncategorized channels */}
              {(() => {
                const uncategorizedChannels = publicChannels.filter(c => !c.categoryId);
                if (uncategorizedChannels.length === 0) return null;

                return (
                  <div className="space-y-1">
                    {uncategorizedChannels.map((channel) => (
                      <Card
                        key={channel.id}
                        className="p-3 hover-elevate cursor-pointer border-0 shadow-none"
                        onClick={() => setSelectedChannelId(channel.id)}
                        data-testid={`channel-${channel.slug}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{channel.icon}</span>
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <span className="font-medium truncate">{channel.name}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                );
              })()}
          </div>

          {/* Private Channels (owner only) */}
          {privateChannels.length > 0 && server.ownerId === currentUserId && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Private
                </h3>
              </div>
              <div className="space-y-1">
                {privateChannels.map((channel) => (
                  <Card
                    key={channel.id}
                    className="p-3 hover-elevate cursor-pointer border-0 shadow-none"
                    onClick={() => setSelectedChannelId(channel.id)}
                    data-testid={`channel-${channel.slug}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{channel.icon}</span>
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="font-medium truncate">{channel.name}</span>
                        <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Members Section */}
          <Collapsible open={showMembers} onOpenChange={setShowMembers}>
            <div className="space-y-2">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between gap-2 px-2 cursor-pointer hover-elevate rounded-md py-1">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Members ({members.filter(m => m.username !== "Unknown").length})
                  </h3>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showMembers ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-1">
                  {/* Sort members: owner first, then by role, then alphabetically */}
                  {members
                    .filter((member) => member.username !== "Unknown")
                    .sort((a, b) => {
                      if (a.isOwner && !b.isOwner) return -1;
                      if (!a.isOwner && b.isOwner) return 1;
                      return a.username.localeCompare(b.username);
                    })
                    .map((member) => (
                      <Card
                        key={member.id}
                        className="p-3 border-0 shadow-none cursor-pointer hover-elevate"
                        onClick={() => {
                          setSelectedProfileUserId(member.userId);
                          setProfileModalOpen(true);
                        }}
                        data-testid={`member-${member.userId}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            {member.avatarUrl ? (
                              <AvatarImage src={member.avatarUrl} alt={member.username} />
                            ) : null}
                            <AvatarFallback className="text-sm">
                              {member.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{member.username}</span>
                              {member.isOwner && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            <span 
                              className="text-xs" 
                              style={{ color: member.roleColor }}
                            >
                              {member.isOwner ? "Owner" : member.roleName}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
      </main>

      <UserProfileModal
        userId={selectedProfileUserId}
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />

      <CreateChannelDialog 
        serverId={serverId!}
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
      />

      <ManageCategoriesDialog
        serverId={serverId!}
        open={manageCategoriesOpen}
        onOpenChange={setManageCategoriesOpen}
      />

      <BottomNavigation />
    </div>
  );
}
