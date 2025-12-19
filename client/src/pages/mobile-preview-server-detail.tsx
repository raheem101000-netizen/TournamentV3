import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hash, Lock, Megaphone, MessageSquare, Trophy, ArrowLeft, Users } from "lucide-react";
import type { Server, Channel } from "@shared/schema";
import { useState } from "react";
import AnnouncementsChannel from "@/components/channels/AnnouncementsChannel";
import ChatChannel from "@/components/channels/ChatChannel";
import TournamentDashboardChannel from "@/components/channels/TournamentDashboardChannel";
import { useAuth } from "@/contexts/AuthContext";

export default function MobilePreviewServerDetail() {
  const [, params] = useRoute("/server/:serverId");
  const serverId = params?.serverId;
  
  const { user } = useAuth();
  const currentUserId = user?.id;

  const { data: server, isLoading: serverLoading } = useQuery<Server>({
    queryKey: [`/api/servers/${serverId}`],
    enabled: !!serverId,
  });

  const { data: channels = [], isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: [`/api/servers/${serverId}/channels`],
    enabled: !!serverId,
  });

  const { data: userPermissions, isError: permissionsError, isLoading: permissionsLoading } = useQuery<{ permissions: string[] }>({
    queryKey: [`/api/servers/${serverId}/members/${currentUserId}/permissions`],
    enabled: !!serverId && !!currentUserId,
  });

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const selectedChannel = channels.find(c => c.id === selectedChannelId) || channels[0];

  if (serverLoading || channelsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading server...</p>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Server not found</p>
        <Link href="/myservers">
          <Badge variant="outline" className="cursor-pointer">
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to My Servers
          </Badge>
        </Link>
      </div>
    );
  }

  // Separate channels by type and privacy
  const tournamentDashboard = channels.find(c => c.type === "tournament_dashboard");
  const otherChannels = channels.filter(c => c.type !== "tournament_dashboard");
  const publicChannels = otherChannels.filter(c => !c.isPrivate);
  const privateChannels = otherChannels.filter(c => c.isPrivate);
  
  // Check if user can see Tournament Dashboard
  const canSeeTournamentDashboard = tournamentDashboard && currentUserId && !permissionsLoading && 
    (server.ownerId === currentUserId || 
     (!permissionsError && userPermissions?.permissions?.includes("tournament_dashboard_access")));

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
            <Link href="/myservers">
              <Badge variant="outline" className="cursor-pointer bg-background/80 backdrop-blur">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Badge>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Channels Sidebar */}
        <div className="w-60 border-r flex-shrink-0 overflow-y-auto bg-muted/30">
          <div className="p-3 space-y-4">
            {/* Tournament Dashboard - Always visible, access controlled by content */}
            {tournamentDashboard && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Private
                </h3>
                <div className="space-y-0.5">
                  <button
                    onClick={() => setSelectedChannelId(tournamentDashboard.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                      selectedChannel?.id === tournamentDashboard.id
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
                      onClick={() => setSelectedChannelId(channel.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                        selectedChannel?.id === channel.id
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

            {/* Private Channels (owner only) */}
            {privateChannels.length > 0 && server.ownerId === currentUserId && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Private
                </h3>
                <div className="space-y-0.5">
                  {privateChannels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannelId(channel.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                        selectedChannel?.id === channel.id
                          ? "bg-accent text-accent-foreground"
                          : "hover-elevate text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid={`button-channel-${channel.slug}`}
                    >
                      {getChannelIcon(channel.type)}
                      <span className="truncate">{channel.name}</span>
                      <Lock className="h-3 w-3 ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Channel Content Area */}
        <div className="flex-1 overflow-y-auto" data-testid="channel-content">
          {selectedChannel ? (
            <div className="p-4">
              {/* Channel content will be rendered here based on type */}
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
                <>
                  {permissionsLoading ? (
                    <Card>
                      <CardContent className="py-8">
                        <p className="text-muted-foreground text-center">Loading permissions...</p>
                      </CardContent>
                    </Card>
                  ) : canSeeTournamentDashboard ? (
                    <TournamentDashboardChannel serverId={serverId!} />
                  ) : (
                    <Card>
                      <CardContent className="py-8">
                        <div className="flex flex-col items-center gap-4">
                          <Lock className="w-10 h-10 text-muted-foreground" />
                          <div className="text-center space-y-2">
                            <h3 className="font-semibold">Access Restricted</h3>
                            <p className="text-sm text-muted-foreground">
                              You don't have permission to access the Tournament Dashboard.
                              Only the server owner or users with "Tournament Dashboard Access" permission can view this channel.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
              {selectedChannel.type === "announcements" && (
                <AnnouncementsChannel />
              )}
              {selectedChannel.type === "chat" && (
                <ChatChannel channelId={selectedChannel.id} />
              )}
            </div>
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
