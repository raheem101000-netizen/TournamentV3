import { useState } from "react";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Server as ServerIcon, Search, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import type { Server, Tournament } from "@shared/schema";
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

export default function PreviewMyServers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [createServerOpen, setCreateServerOpen] = useState(false);
  const [serverName, setServerName] = useState("");
  const [serverDescription, setServerDescription] = useState("");
  const [selectedGameTags, setSelectedGameTags] = useState<string[]>([]);
  const [gameTagInput, setGameTagInput] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [serverIconUrl, setServerIconUrl] = useState("");
  const [serverBackgroundUrl, setServerBackgroundUrl] = useState("");
  const [createServerStep, setCreateServerStep] = useState(1);
  const [tournamentFilter, setTournamentFilter] = useState<"registered" | "saved">("registered");

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

  const myServers = memberServersData || [];

  return (
    <MobileLayout disableContentBottomPadding>
      <div className="flex h-dvh flex-col overflow-hidden bg-background relative">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-lg mx-auto px-4 py-3">
            <div className="relative flex items-center justify-center">
              <h1 className="text-2xl font-bold">My Page</h1>
              <Button size="sm" onClick={() => setCreateServerOpen(true)} data-testid="button-create-server" className="absolute right-0">
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
          </div>
        </header>

        <main className="flex flex-1 min-h-0 gap-2 px-2 py-3 pb-24 overflow-hidden">

          {/* Left: Servers — scrollable */}
          <div className="w-[30%] flex flex-col min-w-0 min-h-0">
            <div className="flex items-center justify-between border-b-2 border-foreground mb-2 pb-1">
              <h2 className="text-xs font-bold">Servers</h2>
              <Badge variant="secondary" className="text-[10px] px-1 h-4">{myServers.length}</Badge>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5 no-scrollbar">
              {memberLoading ? (
                <p className="text-muted-foreground text-xs text-center pt-8">Loading...</p>
              ) : myServers.length > 0 ? (
                myServers.map((server, i) => {
                  const isOwned = server.ownerId === user?.id;
                  return (
                    <Link key={server.id} href={`/server/${server.id}`}>
                      <Card
                        variant="glass"
                        className="p-2 hover-elevate cursor-pointer"
                        data-testid={isOwned ? `server-owned-${server.id}` : `server-member-${server.id}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage
                              src={server.iconUrl || undefined}
                              alt={server.name}
                              loading={i < 4 ? "eager" : "lazy"}
                            />
                            <AvatarFallback className="text-[10px] font-semibold">
                              {server.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-0.5">
                              <h3 className="font-semibold text-[11px] truncate">{server.name}</h3>
                              {isOwned && <Crown className="w-2.5 h-2.5 text-yellow-500 flex-shrink-0" />}
                            </div>
                            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <Users className="w-2.5 h-2.5" />
                              <span>{server.memberCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ServerIcon className="w-6 h-6 text-muted-foreground mb-2" />
                  <p className="text-[10px] text-muted-foreground mb-2">No servers yet</p>
                  <Link href="/discovery">
                    <Button size="sm" className="h-7 text-[10px] px-2" data-testid="button-go-to-discovery">
                      <Search className="w-3 h-3 mr-1" />
                      Discover
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right: Tournaments with filter pills */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">

            {/* Filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar flex-shrink-0">
              <Button
                variant={tournamentFilter === "registered" ? "default" : "outline"}
                size="sm"
                onClick={() => setTournamentFilter("registered")}
                className="rounded-full h-7 text-[10px] px-2.5 whitespace-nowrap"
              >
                Registered
                {registeredTournaments && registeredTournaments.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 h-3.5">{registeredTournaments.length}</Badge>
                )}
              </Button>
              <Button
                variant={tournamentFilter === "saved" ? "default" : "outline"}
                size="sm"
                onClick={() => setTournamentFilter("saved")}
                className="rounded-full h-7 text-[10px] px-2.5 whitespace-nowrap"
              >
                Saved
                {savedTournaments && savedTournaments.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 h-3.5">{savedTournaments.length}</Badge>
                )}
              </Button>
            </div>

            {/* Grid — 2 per row, scrolls down */}
            {(tournamentFilter === "registered" ? registeredTournaments?.length : savedTournaments?.length) ? (
              <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 gap-1.5">
                  {(tournamentFilter === "registered" ? registeredTournaments || [] : savedTournaments || []).map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      compact
                      onView={() => {
                        if (tournamentFilter === "registered" && tournament.serverId) {
                          setLocation(`/server/${tournament.serverId}`);
                          return;
                        }

                        setLocation(`/tournament/${tournament.id}/view`);
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <p className="text-xs text-muted-foreground">
                  {tournamentFilter === "registered" ? "No registered tournaments" : "No saved tournaments"}
                </p>
              </div>
            )}
          </div>

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
