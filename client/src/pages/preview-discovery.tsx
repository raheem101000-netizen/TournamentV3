import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Users, Plus, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import ImageUploadField from "@/components/ImageUploadField";
import type { Server } from "@shared/schema";

const mockServers = [
  {
    id: "1",
    name: "ProGaming League",
    description: "Competitive gaming tournaments for all skill levels",
    logo: null,
    logoFallback: "P",
    backgroundImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop",
    memberCount: 12500,
    categories: ["Valorant", "CS:GO", "Apex"],
  },
  {
    id: "2",
    name: "Elite Esports",
    description: "Professional esports community and tournaments",
    logo: null,
    logoFallback: "E",
    backgroundImage: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=200&fit=crop",
    memberCount: 8200,
    categories: ["League of Legends", "Dota 2"],
  },
  {
    id: "3",
    name: "Competitive Arena",
    description: "Weekly tournaments with cash prizes",
    logo: null,
    logoFallback: "C",
    backgroundImage: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=200&fit=crop",
    memberCount: 5700,
    categories: ["CS:GO", "Rainbow Six"],
  },
  {
    id: "4",
    name: "Battle Royale Hub",
    description: "BR games only - Fortnite, Apex, Warzone",
    logo: null,
    logoFallback: "B",
    backgroundImage: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=200&fit=crop",
    memberCount: 15100,
    categories: ["Apex Legends", "Fortnite", "Warzone"],
  },
  {
    id: "5",
    name: "Casual Gaming Community",
    description: "Fun tournaments for casual players",
    logo: null,
    logoFallback: "C",
    backgroundImage: "https://images.unsplash.com/photo-1556438064-2d7646166914?w=400&h=200&fit=crop",
    memberCount: 20300,
    categories: ["All Games", "Mixed"],
  },
];

export default function PreviewDiscovery() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [createServerOpen, setCreateServerOpen] = useState(false);
  const [serverName, setServerName] = useState("");
  const [serverDescription, setServerDescription] = useState("");
  const [selectedGameTags, setSelectedGameTags] = useState<string[]>([]);
  const [gameTagInput, setGameTagInput] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [serverIconUrl, setServerIconUrl] = useState("");
  const [serverBackgroundUrl, setServerBackgroundUrl] = useState("");
  const [createServerStep, setCreateServerStep] = useState(1);
  
  const { data: servers, isLoading } = useQuery<Server[]>({
    queryKey: ['/api/mobile-preview/servers'],
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
      return await response.json();
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
      // Navigate to the new server
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

  const joinServerMutation = useMutation({
    mutationFn: async (serverId: string) => {
      if (!user?.id) throw new Error("You must be logged in to join a server");
      return await apiRequest('POST', `/api/servers/${serverId}/join`, {
        userId: user.id,
      });
    },
    onSuccess: (_data, serverId) => {
      toast({
        title: "Joined server!",
        description: "You've successfully joined the server.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mobile-preview/servers'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/servers`] });
      // Navigate to the server detail page
      setLocation(`/server/${serverId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to join server",
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

  const serverCards = (servers || []).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description || "No description",
    logo: s.iconUrl || null,
    logoFallback: s.name.charAt(0),
    backgroundImage: s.backgroundUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop",
    memberCount: s.memberCount || 0,
    categories: s.gameTags && s.gameTags.length > 0 ? s.gameTags : ["Gaming"],
    isVerified: (s as any).isVerified === 1,
  }));

  const allServers = serverCards;
  
  // Filter servers based on search query
  const displayServers = allServers.filter(server => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      server.name.toLowerCase().includes(query) ||
      server.description.toLowerCase().includes(query) ||
      server.categories.some(cat => cat.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40">
        <div className={`container max-w-lg mx-auto px-4 ${showSearch ? "py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" : "py-2"}`}>
          <div className="flex items-center justify-end gap-2">
            {showSearch && (
              <div className="relative flex-1 animate-in fade-in slide-in-from-right-4 duration-200">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search servers..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => {
                    if (!searchQuery) setShowSearch(false);
                  }}
                  data-testid="input-search-servers"
                  autoFocus
                />
              </div>
            )}
            <Button 
              size="icon" 
              variant={showSearch ? "default" : "ghost"}
              onClick={() => setShowSearch(!showSearch)}
              data-testid="button-search-toggle"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setCreateServerOpen(true)} data-testid="button-create-server">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading servers...</p>
            </div>
          ) : displayServers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground font-semibold">No servers found</p>
              <p className="text-sm text-muted-foreground mt-2">Be the first to create one!</p>
            </div>
          ) : (
            displayServers.map((server) => (
            <Card
              key={server.id}
              className="overflow-hidden hover-elevate cursor-pointer relative"
              data-testid={`server-card-${server.id}`}
              onClick={() => setLocation(`/server/${server.id}/preview`)}
            >
              {server.isVerified && (
                <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500 text-white text-xs font-medium" data-testid={`server-verified-${server.id}`}>
                  <Star className="w-3 h-3 fill-white" />
                  Verified
                </div>
              )}
              <div className="relative h-32 overflow-visible">
                <OptimizedImage
                  src={server.backgroundImage}
                  alt={server.name}
                  className="w-full h-full"
                  thumbnailSize="lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-white/30">
                      {server.logo && <AvatarImage src={server.logo} alt={server.name} />}
                      <AvatarFallback className="text-2xl bg-black/40 backdrop-blur-sm text-white">
                        {server.logoFallback || server.logo}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white drop-shadow-lg truncate">
                        {server.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-white/90">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{server.memberCount} members</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {server.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {server.categories.map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="text-xs"
                      data-testid={`category-${category.toLowerCase()}`}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>

                <Button 
                  className="w-full" 
                  data-testid={`button-join-server-${server.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    joinServerMutation.mutate(server.id);
                  }}
                  disabled={joinServerMutation.isPending}
                >
                  {joinServerMutation.isPending ? "Joining..." : "Join Server"}
                </Button>
              </CardContent>
            </Card>
          ))
          )}
        </div>
      </main>

      <BottomNavigation />

      {/* Create Server Dialog */}
      <Dialog open={createServerOpen} onOpenChange={(open) => {
        setCreateServerOpen(open);
        if (!open) setCreateServerStep(1);
      }}>
        <DialogContent className="max-w-md max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create Your Server</DialogTitle>
            <DialogDescription>
              {createServerStep === 1 ? "Step 1 of 2: Basic Information" : "Step 2 of 2: Welcome & Branding"}
            </DialogDescription>
          </DialogHeader>

          {createServerStep === 1 ? (
            <>
              <div className="space-y-4 pt-4">
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

              <div className="flex gap-2 pt-4">
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
              </div>
            </>
          ) : (
            <>
              <ScrollArea className="max-h-[50vh] pr-4">
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="welcome-message">Welcome Message *</Label>
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
              </ScrollArea>

              <div className="flex gap-2 pt-4">
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
                  disabled={createServerMutation.isPending || welcomeMessage.length < 10 || !serverIconUrl || !serverBackgroundUrl}
                  data-testid="button-confirm-create"
                >
                  {createServerMutation.isPending ? "Creating..." : "Create Server"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
