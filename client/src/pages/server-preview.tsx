import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, Hash, Lock, Megaphone, MessageSquare, Trophy, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import ChatChannel from "@/components/channels/ChatChannel";
import AnnouncementsChannel from "@/components/channels/AnnouncementsChannel";
import type { Server, Channel } from "@shared/schema";

export default function ServerPreview() {
  const [match, params] = useRoute("/server/:serverId/preview");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const serverId = params?.serverId;
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [showWelcomePage, setShowWelcomePage] = useState(true); // Start with welcome page

  const { data: server } = useQuery<Server>({
    queryKey: [`/api/servers/${serverId}`],
    enabled: !!serverId,
  });

  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: [`/api/servers/${serverId}/channels`],
    enabled: !!serverId,
    refetchInterval: 5000,
    staleTime: 0,
  });

  // Only show selected channel if user explicitly clicked one
  const selectedChannel = selectedChannelId ? channels.find(c => c.id === selectedChannelId) : null;

  // Fetch user's servers to check membership - use stable key that doesn't include undefined
  const { data: userServers, isLoading: userServersLoading } = useQuery<Server[]>({
    queryKey: ['/api/users', user?.id, 'servers'],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/users/${user.id}/servers`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.id,
    staleTime: 0, // Always refetch to ensure fresh data
  });

  // Check if user is already a member or owner of this server
  const isOwner = server?.ownerId === user?.id;
  const isMember = userServers?.some((s) => s.id === serverId) || false;
  const membershipLoading = !!user?.id && userServersLoading;

  const joinServerMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !serverId) throw new Error("Missing user or server ID");
      return apiRequest("POST", `/api/servers/${serverId}/join`, { userId: user.id });
    },
    onSuccess: () => {
      toast({
        title: "Joined server",
        description: "You've successfully joined the server.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'servers'] });
      setLocation(`/server/${serverId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "announcements":
        return <Megaphone className="h-4 w-4" />;
      case "chat":
        return <MessageSquare className="h-4 w-4" />;
      case "tournament_dashboard":
        return <Trophy className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  if (!server) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading server...</p>
      </div>
    );
  }

  // Separate channels by type and privacy
  const tournamentDashboard = channels.find(c => c.type === "tournament_dashboard");
  const otherChannels = channels.filter(c => c.type !== "tournament_dashboard");
  const publicChannels = otherChannels.filter(c => !c.isPrivate);

  return (
    <div className="flex flex-col h-full">
      {/* Server Header */}
      <div 
        className="relative h-32 bg-cover bg-center"
        style={{
          backgroundImage: server.backgroundUrl 
            ? `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${server.backgroundUrl})`
            : 'linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--primary) / 0.5))'
        }}
      >
        <div className="absolute inset-0 flex items-end p-4">
          <div className="flex items-center gap-3 w-full">
            {server.iconUrl && (
              <img 
                src={server.iconUrl} 
                alt={server.name}
                className="w-16 h-16 rounded-lg border-2 border-background"
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white truncate" data-testid="server-name">
                {server.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 text-xs text-white/80">
                  <Users className="h-3 w-3" />
                  <span>{server.memberCount?.toLocaleString()} members</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {server.category}
                </Badge>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation("/")}
              className="text-white hover:bg-white/20 bg-background/80 backdrop-blur"
              data-testid="button-back"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Channels Sidebar */}
        <div className="w-60 border-r flex-shrink-0 overflow-y-auto bg-muted/30">
          <div className="p-3 space-y-4">
            {/* Welcome Page - Always show first */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">
                Welcome
              </h3>
              <button
                onClick={() => {
                  setShowWelcomePage(true);
                  setSelectedChannelId(null);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                  showWelcomePage
                    ? "bg-accent text-accent-foreground"
                    : "hover-elevate text-muted-foreground hover:text-foreground"
                }`}
                data-testid="button-welcome-page"
              >
                <BookOpen className="h-4 w-4" />
                <span className="truncate">Welcome Page</span>
              </button>
            </div>

            {/* Tournament Dashboard - Always visible in preview, access controlled by content */}
            {tournamentDashboard && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Private
                </h3>
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setShowWelcomePage(false);
                      setSelectedChannelId(tournamentDashboard.id);
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                      !showWelcomePage && selectedChannelId === tournamentDashboard.id
                        ? "bg-accent text-accent-foreground"
                        : "hover-elevate text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`button-channel-${tournamentDashboard.slug}`}
                  >
                    {getChannelIcon(tournamentDashboard.type)}
                    <span className="truncate">{tournamentDashboard.name}</span>
                    <Lock className="h-3 w-3 ml-auto" />
                  </button>
                </div>
              </div>
            )}

            {/* Public Channels */}
            {publicChannels.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">
                  Channels
                </h3>
                <div className="space-y-0.5">
                  {publicChannels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        setShowWelcomePage(false);
                        setSelectedChannelId(channel.id);
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                        !showWelcomePage && selectedChannelId === channel.id
                          ? "bg-accent text-accent-foreground"
                          : "hover-elevate text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid={`button-channel-${channel.slug}`}
                    >
                      {getChannelIcon(channel.type)}
                      <span className="truncate">{channel.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Channel Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden" data-testid="channel-content">
          {showWelcomePage ? (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                {/* Welcome Page Header */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                  <BookOpen className="h-4 w-4" />
                  <h2 className="text-lg font-semibold">Welcome</h2>
                </div>

                {/* Welcome Page Content */}
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
                      <CardDescription>{server.description}</CardDescription>
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
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      {server.gameTags?.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-muted-foreground pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{server.memberCount?.toLocaleString() || 0} members</span>
                      </div>
                      <Badge variant="outline">{server.category}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sticky Join/Enter Button */}
              <div className="border-t p-4 bg-background/95 backdrop-blur sticky bottom-0">
                {membershipLoading ? (
                  <Button disabled className="w-full" data-testid="button-loading">
                    Loading...
                  </Button>
                ) : isMember || isOwner ? (
                  <Button
                    onClick={() => setLocation(`/server/${serverId}`)}
                    data-testid="button-enter-server"
                    className="w-full"
                  >
                    {isOwner ? "Manage Server" : "Enter Server"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => joinServerMutation.mutate()}
                    disabled={joinServerMutation.isPending}
                    data-testid="button-join-server"
                    className="w-full"
                  >
                    {joinServerMutation.isPending ? "Joining..." : "Join Server"}
                  </Button>
                )}
              </div>
            </>
          ) : selectedChannel ? (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                {/* Channel Header */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                  {getChannelIcon(selectedChannel.type)}
                  <h2 className="text-lg font-semibold">{selectedChannel.name}</h2>
                  {selectedChannel.isPrivate && (
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>

                {/* Channel content based on type */}
                {selectedChannel.type === "tournament_dashboard" && (
                  <Card>
                    <CardContent className="py-8">
                      <div className="flex flex-col items-center gap-4">
                        <Lock className="w-10 h-10 text-muted-foreground" />
                        <div className="text-center space-y-2">
                          <h3 className="font-semibold">Preview Only</h3>
                          <p className="text-sm text-muted-foreground">
                            Join the server to access the Tournament Dashboard
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {selectedChannel.type === "announcements" && (
                  <AnnouncementsChannel channelId={selectedChannel.id} />
                )}
                {selectedChannel.type === "chat" && (
                  <ChatChannel channelId={selectedChannel.id} isPreview={true} />
                )}
              </div>

              {/* Sticky Join/Enter Button */}
              <div className="border-t p-4 bg-background/95 backdrop-blur sticky bottom-0">
                {membershipLoading ? (
                  <Button disabled className="w-full" data-testid="button-loading">
                    Loading...
                  </Button>
                ) : isMember || isOwner ? (
                  <Button
                    onClick={() => setLocation(`/server/${serverId}`)}
                    data-testid="button-enter-server"
                    className="w-full"
                  >
                    {isOwner ? "Manage Server" : "Enter Server"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => joinServerMutation.mutate()}
                    disabled={joinServerMutation.isPending}
                    data-testid="button-join-server"
                    className="w-full"
                  >
                    {joinServerMutation.isPending ? "Joining..." : "Join Server"}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Select a channel to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
