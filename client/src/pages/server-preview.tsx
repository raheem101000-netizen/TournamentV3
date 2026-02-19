import { BottomNavigation } from "@/components/BottomNavigation";
import Particles from "@/components/ui/particles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, Lock, ChevronLeft, BookOpen, Users, Crown, Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState } from "react";
import type { Server, Channel, ChannelCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function ServerPreview() {
  const [match, params] = useRoute("/server/:serverId/preview");
  const [, setLocation] = useLocation();
  const serverId = params?.serverId;
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const { data: server, isLoading: serverLoading } = useQuery<Server>({
    queryKey: [`/api/servers/${serverId}`],
    enabled: !!serverId,
  });

  const { data: channels = [], isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: [`/api/servers/${serverId}/channels`],
    enabled: !!serverId,
  });

  const { data: categories = [] } = useQuery<ChannelCategory[]>({
    queryKey: [`/api/servers/${serverId}/categories`],
    enabled: !!serverId,
  });

  interface EnrichedMember {
    id: string;
    userId: string;
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
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/members`] });
      queryClient.invalidateQueries({ queryKey: ['/api/mobile-preview/servers'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/servers`] });
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

  if (serverLoading || channelsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading server preview...</p>
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

  // Group channels
  const tournamentDashboard = channels.find(c => c.type === "tournament_dashboard");
  const otherChannels = channels.filter(c => c.type !== "tournament_dashboard");
  const publicChannels = otherChannels.filter(c => !c.isPrivate).sort((a, b) => (a.position ?? 999) - (b.position ?? 999));

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation("/")}
              data-testid="button-back"
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
                <Badge variant="outline" className="text-xs">Preview</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{server.memberCount?.toLocaleString() || 0} members</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4 flex-1 space-y-6">
        {/* Welcome Section */}
        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Welcome to {server.name}
            </CardTitle>
            {server.description && (
              <CardDescription>{server.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {server.welcomeMessage ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{server.welcomeMessage}</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No welcome message set.</p>
            )}

            <div className="flex items-center gap-3 text-sm text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{members.length} members</span>
              </div>
              <Badge variant="outline">{server.category}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Channels List (Read Only) */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
            Channels Preview
          </h3>

          <div className="space-y-1">
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
                        className="p-3 border-0 shadow-none opacity-80"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{channel.icon}</span>
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <span className="font-medium truncate">{channel.name}</span>
                          </div>
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Uncategorized */}
            {publicChannels.filter(c => !c.categoryId).map((channel) => (
              <Card
                key={channel.id}
                className="p-3 border-0 shadow-none opacity-80"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{channel.icon}</span>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="font-medium truncate">{channel.name}</span>
                  </div>
                  <Lock className="w-3 h-3 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Members Preview */}
        <Collapsible open={showMembers} onOpenChange={setShowMembers}>
          <div className="space-y-2">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between gap-2 px-2 cursor-pointer hover-elevate rounded-md py-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Members ({members.length})
                </h3>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showMembers ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="relative mb-2 px-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  className="h-8 pl-8 text-xs"
                  placeholder="Search members..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                {members
                  .filter(m => m.username.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                  .slice(0, 10) // Limit preview
                  .map((member) => (
                    <Card
                      key={member.id}
                      className="p-2 border-0 shadow-none"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={member.avatarUrl || undefined} />
                          <AvatarFallback>{member.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate text-sm">{member.username}</span>
                            {member.isOwner && (
                              <Crown className="h-3 w-3 text-yellow-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                {members.length > 10 && (
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    Join to see all {members.length} members
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

      </main>

      {/* Sticky Join Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t z-50">
        <div className="container max-w-lg mx-auto">
          <Button
            className="w-full"
            size="lg"
            onClick={() => joinServerMutation.mutate()}
            disabled={joinServerMutation.isPending}
          >
            {joinServerMutation.isPending ? "Joining..." : `Join ${server.name}`}
          </Button>
        </div>
      </div>

      <Particles
        particleCount={50}
        particleSpread={10}
        speed={0.1}
        particleColors={['#8b5cf6', '#a78bfa', '#c4b5fd']}
        alphaParticles={false}
        particleBaseSize={100}
        className="fixed inset-0 z-0 pointer-events-none"
      />
    </div>
  );
}
