import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Users, Plus, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import ImageUploadField from "@/components/ImageUploadField";
import type { Server } from "@shared/schema";
import { MobileLayout } from "@/components/layouts/MobileLayout";

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
      return response;
    },
    onSuccess: (data) => {
      toast({ title: "Server created!", description: "Your server has been created successfully." });
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
      toast({ title: "Failed to create server", description: error.message || "Please try again later.", variant: "destructive" });
    },
  });

  const handleCreateServer = () => {
    if (!serverName.trim()) {
      toast({ title: "Server name required", description: "Please enter a name for your server.", variant: "destructive" });
      return;
    }
    createServerMutation.mutate();
  };

  const serverCards = (servers || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    description: s.description || "No description",
    logo: s.iconUrl || null,
    logoFallback: s.name.charAt(0),
    backgroundImage: s.backgroundUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop",
    memberCount: s.memberCount || 0,
    categories: s.gameTags && s.gameTags.length > 0 ? s.gameTags : ["Gaming"],
    isVerified: (s as any).isVerified === 1,
    ownerAvatarUrl: s.ownerAvatarUrl || null,
  }));

  const displayServers = serverCards.filter(server => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      server.name.toLowerCase().includes(query) ||
      server.description.toLowerCase().includes(query) ||
      server.categories.some((cat: string) => cat.toLowerCase().includes(query))
    );
  });

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen bg-background pb-20 relative z-10">

        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 py-3">
            <div className="relative flex items-center justify-center">
              <h1 className="text-2xl font-bold">Discovery</h1>
              <div className="absolute right-0 flex items-center gap-1">
                <Button
                  size="icon"
                  variant={showSearch ? "default" : "ghost"}
                  className="w-8 h-8"
                  onClick={() => setShowSearch(!showSearch)}
                  data-testid="button-search-toggle"
                >
                  <Search className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setCreateServerOpen(true)} data-testid="button-create-server">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {showSearch && (
              <div className="relative mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search servers..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => { if (!searchQuery) setShowSearch(false); }}
                  data-testid="input-search-servers"
                  autoFocus
                />
              </div>
            )}
          </div>
        </header>

        {/* Server grid */}
        <main className="px-4 py-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[16/9] w-full" />
                  <div className="px-4 pb-4 pt-0">
                    <Skeleton className="w-10 h-10 rounded-full -mt-5" />
                    <div className="mt-2 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : displayServers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground font-semibold">No servers found</p>
              <p className="text-sm text-muted-foreground mt-2">Be the first to create one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {displayServers.map((server) => (
                <Card
                  key={server.id}
                  className="overflow-hidden hover-elevate cursor-pointer group"
                  data-testid={`server-card-${server.id}`}
                  onClick={() => setLocation(`/server/${server.id}/preview`)}
                >
                  {/* Banner image — 16:9 landscape */}
                  <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/30 to-primary/10">
                    {/* Verified badge */}
                    {server.isVerified && (
                      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500 text-white text-xs font-medium" data-testid={`server-verified-${server.id}`}>
                        <Star className="w-3 h-3 fill-white" />
                        Verified
                      </div>
                    )}

                    <OptimizedImage
                      src={server.backgroundImage}
                      alt={server.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      thumbnailSize="lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Card content with overlapping avatar */}
                  <div className="relative px-4 pb-4 pt-0">
                    {/* Owner avatar overlapping banner */}
                    <Avatar className="w-10 h-10 -mt-5 border-[3px] border-card bg-card flex-shrink-0 shadow-md">
                      {server.ownerAvatarUrl ? (
                        <AvatarImage src={server.ownerAvatarUrl} alt={server.name} />
                      ) : server.logo ? (
                        <AvatarImage src={server.logo} alt={server.name} />
                      ) : null}
                      <AvatarFallback className="text-xs font-bold">{server.logoFallback}</AvatarFallback>
                    </Avatar>

                    <div className="mt-2 space-y-1.5">
                      {/* Server name */}
                      <h3 className="font-bold text-base leading-tight truncate" data-testid={`server-name-${server.id}`}>
                        {server.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {server.description}
                      </p>

                      {/* Stats row */}
                      <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                          {server.memberCount.toLocaleString()} Members
                        </span>
                        {server.categories[0] && (
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                            {server.categories[0]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>

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
                    <Input id="server-name" placeholder="Enter server name..." value={serverName} onChange={(e) => setServerName(e.target.value)} data-testid="input-server-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="server-description">Description</Label>
                    <Textarea id="server-description" placeholder="Tell people what your server is about..." value={serverDescription} onChange={(e) => setServerDescription(e.target.value)} rows={3} data-testid="textarea-server-description" />
                  </div>
                  <div className="space-y-2">
                    <Label>Game Tags (optional)</Label>
                    <p className="text-xs text-muted-foreground">Type game names and press Enter to add them</p>
                    <div className="space-y-2">
                      <Input
                        placeholder="e.g. Valorant, Fortnite..."
                        value={gameTagInput}
                        onChange={(e) => setGameTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && gameTagInput.trim()) {
                            e.preventDefault();
                            const tag = gameTagInput.trim();
                            if (!selectedGameTags.includes(tag)) setSelectedGameTags(prev => [...prev, tag]);
                            setGameTagInput("");
                          }
                        }}
                        data-testid="input-game-tags"
                      />
                      {selectedGameTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedGameTags.map((tag) => (
                            <Badge key={tag} variant="default" className="cursor-pointer" onClick={() => setSelectedGameTags(prev => prev.filter(t => t !== tag))} data-testid={`tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setCreateServerOpen(false)} data-testid="button-cancel-create">Cancel</Button>
                  <Button className="flex-1" onClick={() => setCreateServerStep(2)} disabled={!serverName.trim()} data-testid="button-next-step">Next</Button>
                </div>
              </>
            ) : (
              <>
                <ScrollArea className="max-h-[50vh] pr-4">
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="welcome-message">Welcome Message *</Label>
                      <Textarea id="welcome-message" placeholder="Welcome to our server! Here you'll find..." value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={4} data-testid="textarea-welcome-message" />
                      <p className="text-xs text-muted-foreground">Displayed to everyone who previews or joins your server.</p>
                    </div>
                    <ImageUploadField label="Server Icon" value={serverIconUrl} onChange={setServerIconUrl} placeholder="Upload your server icon" required />
                    <ImageUploadField label="Server Background" value={serverBackgroundUrl} onChange={setServerBackgroundUrl} placeholder="Upload your server background image" required />
                  </div>
                </ScrollArea>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setCreateServerStep(1)} disabled={createServerMutation.isPending} data-testid="button-back-step">Back</Button>
                  <Button className="flex-1" onClick={handleCreateServer} disabled={createServerMutation.isPending || !serverIconUrl} data-testid="button-confirm-create">
                    {createServerMutation.isPending ? "Creating..." : "Create Server"}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </MobileLayout>
  );
}
