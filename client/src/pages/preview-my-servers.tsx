import { useState } from "react";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Trophy, Server as ServerIcon, Search, Crown, Shield, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import type { Server, Tournament } from "@shared/schema";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ImageUploadField from "@/components/ImageUploadField";
import TournamentCard from "@/components/TournamentCard";

type ServerFilter = "all" | "tournaments";

export default function PreviewMyServers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<ServerFilter>("all");
  const [createServerOpen, setCreateServerOpen] = useState(false);
  const [serverName, setServerName] = useState("");
  const [serverDescription, setServerDescription] = useState("");
  const [selectedGameTags, setSelectedGameTags] = useState<string[]>([]);
  const [gameTagInput, setGameTagInput] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [serverIconUrl, setServerIconUrl] = useState("");
  const [serverBackgroundUrl, setServerBackgroundUrl] = useState("");
  const [createServerStep, setCreateServerStep] = useState(1);

  // Fetch servers where user is a member
  const { data: memberServersData, isLoading: memberLoading } = useQuery<Server[]>({
    queryKey: [`/api/users/${user?.id}/servers`],
    enabled: !!user?.id,
  });

  // Fetch saved tournaments
  const { data: savedTournaments } = useQuery<(Tournament & { savedAt: string })[]>({
    queryKey: ['/api/users/me/saved-tournaments'],
    enabled: !!user,
  });

  // Fetch registered tournaments (tournaments user signed up for)
  const { data: registeredTournaments } = useQuery<(Tournament & { registeredAt: string; registrationStatus: string })[]>({
    queryKey: ['/api/users/me/registered-tournaments'],
    enabled: !!user,
  });


  const createServerMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("You must be logged in to create a server");
      const response = await apiRequest('POST', `/api/servers`, {
        name: serverName,
        description: serverDescription,
        gameTags: selectedGameTags,
        category: "Gaming",
        isPublic: 1,
        welcomeMessage: welcomeMessage,
        iconUrl: serverIconUrl,
        backgroundUrl: serverBackgroundUrl,
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Server created!",
        description: "Your server has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mobile-preview/servers'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/servers`] });
      setCreateServerOpen(false);
      setServerName("");
      setServerDescription("");
      setSelectedGameTags([]);
      setWelcomeMessage("");
      setServerIconUrl("");
      setServerBackgroundUrl("");
      setCreateServerStep(1);
      setLocation(`/server/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create server",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleCreateServer = () => {
    if (!serverName.trim()) {
      toast({
        title: "Server name required",
        description: "Please enter a name for your server.",
        variant: "destructive",
      });
      return;
    }
    createServerMutation.mutate();
  };

  const clearSavedTournamentsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/users/me/saved-tournaments');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/saved-tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mobile-preview/servers'] }); // to update stars
      toast({
        title: "Saved tournaments cleared",
        description: "All your saved tournaments have been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear saved tournaments",
        variant: "destructive",
      });
    }
  });

  const myServers = memberServersData || [];
  const displayedServers = myServers;

  const isLoading = memberLoading;

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen bg-background pb-20 relative">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-2xl font-bold">My Page</h1>
              <Button size="sm" onClick={() => setCreateServerOpen(true)} data-testid="button-create-server">
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Badge
                variant={filter === "all" ? "default" : "outline"}
                className="cursor-pointer hover-elevate px-3 py-1 whitespace-nowrap"
                onClick={() => setFilter("all")}
                data-testid="filter-all"
              >
                All Servers ({myServers.length})
              </Badge>
              <Badge
                variant={filter === "tournaments" ? "default" : "outline"}
                className="cursor-pointer hover-elevate px-3 py-1 whitespace-nowrap"
                onClick={() => setFilter("tournaments")}
                data-testid="filter-tournaments"
              >
                Tournaments ({(savedTournaments?.length || 0) + (registeredTournaments?.length || 0)})
              </Badge>


            </div>
          </div>
        </header>

        <main className="container max-w-lg mx-auto px-4 py-4 space-y-6">

          {/* Show Tournaments when Tournaments tab is selected */}
          {filter === "tournaments" ? (
            <div className="space-y-6">
              {/* Saved Tournaments */}
              {savedTournaments && savedTournaments.length > 0 && (
                <div>
                  <div className="flex items-center justify-between border-b-2 border-foreground mb-4 pb-1">
                    <h2 className="text-lg font-bold">
                      Saved Tournaments
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to remove all saved tournaments?")) {
                          clearSavedTournamentsMutation.mutate();
                        }
                      }}
                      disabled={clearSavedTournamentsMutation.isPending}
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {savedTournaments.map((tournament) => (
                      <TournamentCard
                        key={tournament.id}
                        tournament={tournament}
                        onView={(id) => setLocation(`/tournament/${id}/view`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Registered Tournaments */}
              {registeredTournaments && registeredTournaments.length > 0 && (
                <div>
                  <div className="flex items-center justify-between border-b-2 border-foreground mb-4 pb-1">
                    <h2 className="text-lg font-bold">
                      Registered Tournaments
                    </h2>
                    <Badge variant="secondary" className="text-xs">
                      Active ({registeredTournaments.length})
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {registeredTournaments.map((tournament) => (
                      <TournamentCard
                        key={tournament.id}
                        tournament={tournament}
                        onView={(id) => setLocation(`/tournament/${id}/view`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state for tournaments */}
              {(!savedTournaments || savedTournaments.length === 0) &&
                (!registeredTournaments || registeredTournaments.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground mb-2">No tournaments yet</p>
                    <p className="text-sm text-muted-foreground">
                      Save tournaments or register to participate
                    </p>
                  </div>
                )}
            </div>
          ) : (
            /* Show Servers when any server filter is selected */
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : displayedServers.length > 0 ? (
                <div className="space-y-4">
                  {displayedServers.map((server, i) => {
                    const isOwned = server.ownerId === user?.id;
                    return (
                      <Link key={server.id} href={`/server/${server.id}`}>
                        <Card
                          variant="glass"
                          className="p-4 hover-elevate cursor-pointer relative"
                          data-testid={isOwned ? `server-owned-${server.id}` : `server-member-${server.id}`}
                        >
                          {(server as any).isVerified === 1 && (
                            <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500 text-white text-xs font-medium" data-testid={`server-verified-${server.id}`}>
                              <Star className="w-3 h-3 fill-white" />
                              Verified
                            </div>
                          )}
                          <div className="flex items-center gap-4">
                            <Avatar className="w-14 h-14">
                              <AvatarImage
                                src={server.iconUrl || undefined}
                                alt={server.name}
                                loading={i < 4 ? "eager" : "lazy"}
                              />
                              <AvatarFallback className="text-xl font-semibold">
                                {server.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg truncate">
                                  {server.name}
                                </h3>
                                {isOwned && (
                                  <Badge variant="secondary" className="flex-shrink-0">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Owner
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>{server.memberCount || 0} members</span>
                                </div>
                              </div>
                            </div>

                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ServerIcon className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No servers yet</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    Join a server from the Discovery page to get started!
                  </p>
                  <Link href="/discovery">
                    <Button data-testid="button-go-to-discovery">
                      <Search className="w-4 h-4 mr-2" />
                      Discover Servers
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </main>

        {/* Create Server Dialog */}
        <Dialog open={createServerOpen} onOpenChange={(open) => {
          setCreateServerOpen(open);
          if (!open) setCreateServerStep(1);
        }}>
          <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>Create Your Server</DialogTitle>
              <DialogDescription>
                {createServerStep === 1 ? "Step 1 of 2: Basic Information" : "Step 2 of 2: Welcome & Branding"}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 px-6 overflow-y-auto">
              <div className="py-4 min-h-0 flex-shrink-0">
                {createServerStep === 1 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="server-name">Server Name *</Label>
                      <Input
                        id="server-name"
                        placeholder="Enter server name..."
                        value={serverName}
                        onChange={(e) => setServerName(e.target.value)}
                        data-testid="input-server-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="server-description">Description</Label>
                      <Textarea
                        id="server-description"
                        placeholder="Tell people what your server is about..."
                        value={serverDescription}
                        onChange={(e) => setServerDescription(e.target.value)}
                        rows={3}
                        data-testid="textarea-server-description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Game Tags (optional)</Label>
                      <p className="text-xs text-muted-foreground">
                        Type game names and press Enter to add them as tags
                      </p>
                      <div className="space-y-2">
                        <Input
                          placeholder="e.g. Valorant, Dragon Ball Z, Fortnite..."
                          value={gameTagInput}
                          onChange={(e) => setGameTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && gameTagInput.trim()) {
                              e.preventDefault();
                              const tag = gameTagInput.trim();
                              if (!selectedGameTags.includes(tag)) {
                                setSelectedGameTags(prev => [...prev, tag]);
                              }
                              setGameTagInput("");
                            }
                          }}
                          data-testid="input-game-tags"
                        />
                        {selectedGameTags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedGameTags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="default"
                                className="cursor-pointer"
                                onClick={() => {
                                  setSelectedGameTags(prev => prev.filter(t => t !== tag));
                                }}
                                data-testid={`tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="welcome-message">Welcome Message (Optional)</Label>
                      <Textarea
                        id="welcome-message"
                        placeholder="Welcome to our server! Here you'll find..."
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        rows={4}
                        data-testid="textarea-welcome-message"
                      />
                      <p className="text-xs text-muted-foreground">
                        This message will be displayed to everyone who previews or joins your server.
                      </p>
                    </div>

                    <ImageUploadField
                      label="Server Icon"
                      value={serverIconUrl}
                      onChange={setServerIconUrl}
                      placeholder="Upload your server icon"
                      required
                    />

                    <ImageUploadField
                      label="Server Background"
                      value={serverBackgroundUrl}
                      onChange={setServerBackgroundUrl}
                      placeholder="Upload your server background image"
                      required
                    />
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-6 pt-2 border-t bg-background">
              <div className="flex gap-2">
                {createServerStep === 1 ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setCreateServerOpen(false)}
                      data-testid="button-cancel-create"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => setCreateServerStep(2)}
                      disabled={!serverName.trim()}
                      data-testid="button-next-step"
                    >
                      Next
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setCreateServerStep(1)}
                      disabled={createServerMutation.isPending}
                      data-testid="button-back-step"
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleCreateServer}
                      disabled={createServerMutation.isPending || !serverIconUrl}
                      data-testid="button-confirm-create"
                    >
                      {createServerMutation.isPending ? "Creating..." : "Create Server"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}
