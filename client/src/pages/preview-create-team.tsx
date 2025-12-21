import { useState, useRef } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, X, Plus, Search, Users, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface TeamPlayer {
  username: string;
  avatar: string;
  position: string;
}

export default function PreviewCreateTeam() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [teamLogo, setTeamLogo] = useState("🐺");
  const [teamLogoImage, setTeamLogoImage] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamTag, setTeamTag] = useState("");
  const [teamBio, setTeamBio] = useState("");
  const [teamGame, setTeamGame] = useState("");
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch friends from API
  const { data: friends = [] } = useQuery<any[]>({
    queryKey: ["/api/friends"],
  });

  // Filter friends based on search query
  const filteredFriends = friends.filter((friend: any) =>
    friend.username?.toLowerCase().includes(playerSearch.toLowerCase()) ||
    friend.displayName?.toLowerCase().includes(playerSearch.toLowerCase())
  );

  // Mutation to create team
  const createTeamMutation = useMutation({
    mutationFn: async (teamData: any) => {
      const response = await apiRequest("POST", "/api/team-profiles", teamData);
      return response.json();
    },
    onSuccess: async (createdTeam: any) => {
      // Add owner as a team member
      try {
        await apiRequest("POST", `/api/team-profiles/${createdTeam.id}/members`, {
          userId: user?.id,
          role: "Owner",
        });
        
        // Add all players as team members
        for (const player of players) {
          // Find the friend's user ID by username
          const friend = friends.find((f: any) => f.username === player.username);
          if (friend) {
            await apiRequest("POST", `/api/team-profiles/${createdTeam.id}/members`, {
              userId: friend.id,
              role: "Member",
              position: player.position || null,
            });
          }
        }
      } catch (err) {
        console.error("Failed to add team members:", err);
      }
      
      // Invalidate all team-profiles queries to ensure refresh
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].includes('team-profiles')
      });
      toast({
        title: "Team created!",
        description: `${teamName} has been created successfully.`,
      });
      setLocation("/account");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create team",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleCreateTeam = async () => {
    if (!user?.id) {
      toast({
        title: "Not logged in",
        description: "Please log in to create a team",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    createTeamMutation.mutate({
      name: teamName,
      tag: teamTag || null,
      bio: teamBio || null,
      game: teamGame || null,
      logoUrl: teamLogoImage || null,
      ownerId: user.id,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTeamLogoImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addPlayer = (username: string, avatar: string) => {
    if (!players.find(p => p.username === username)) {
      setPlayers([...players, { username, avatar, position: "" }]);
      setShowAddPlayer(false);
    }
  };

  const removePlayer = (username: string) => {
    setPlayers(players.filter(p => p.username !== username));
  };

  const updatePosition = (username: string, position: string) => {
    setPlayers(players.map(p => 
      p.username === username ? { ...p, position } : p
    ));
  };

  const emojiOptions = ["🐺", "⚡", "🔥", "👑", "🦁", "🐉", "⚔️", "🎯", "💎", "🌟"];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            size="icon" 
            variant="ghost"
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Create Team</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4 space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
              <Label>Team Logo</Label>
              <div className="flex flex-col items-center space-y-3">
                {teamLogoImage ? (
                  <div className="relative">
                    <Avatar className="w-32 h-32 rounded-md">
                      <AvatarImage src={teamLogoImage} alt="Team logo" />
                    </Avatar>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                      onClick={() => setTeamLogoImage(null)}
                      data-testid="button-remove-image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-8xl">{teamLogo}</div>
                )}
                
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">Choose an emoji</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {emojiOptions.map((emoji) => (
                      <Button
                        key={emoji}
                        variant={teamLogo === emoji && !teamLogoImage ? "default" : "outline"}
                        className="text-2xl h-12 w-12 p-0"
                        onClick={() => {
                          setTeamLogo(emoji);
                          setTeamLogoImage(null);
                        }}
                        data-testid={`emoji-${emoji}`}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">Or upload an image</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-upload-logo"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    data-testid="input-upload-logo"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="Enter team name..."
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                data-testid="input-team-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-tag">Team Tag (optional)</Label>
              <Input
                id="team-tag"
                placeholder="e.g., TSM, FaZe, C9..."
                value={teamTag}
                onChange={(e) => setTeamTag(e.target.value)}
                maxLength={10}
                data-testid="input-team-tag"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-bio">Team Bio</Label>
              <Textarea
                id="team-bio"
                placeholder="Describe your team..."
                value={teamBio}
                onChange={(e) => setTeamBio(e.target.value)}
                rows={4}
                data-testid="input-team-bio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-game">Game</Label>
              <Input
                id="team-game"
                placeholder="Enter game name (e.g., Valorant, CS:GO)..."
                value={teamGame}
                onChange={(e) => setTeamGame(e.target.value)}
                data-testid="input-team-game"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Team Players</Label>
            <Button 
              size="sm"
              onClick={() => setShowAddPlayer(true)}
              data-testid="button-add-player"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          </div>

          {players.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-muted-foreground text-center">
                  No players added yet. Click "Add Player" to start building your roster.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {players.map((player) => (
                <Card key={player.username}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10 mt-1">
                        <AvatarImage src={player.avatar} />
                        <AvatarFallback>{player.username[0]}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-2">
                        <p className="font-semibold text-sm">@{player.username}</p>
                        <Input
                          placeholder="Assign position (e.g., IGL, Duelist, AWPer)..."
                          value={player.position}
                          onChange={(e) => updatePosition(player.username, e.target.value)}
                          data-testid={`input-position-${player.username}`}
                        />
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="shrink-0"
                        onClick={() => removePlayer(player.username)}
                        data-testid={`button-remove-${player.username}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Button 
          className="w-full" 
          size="lg"
          disabled={!teamName || isSubmitting}
          onClick={handleCreateTeam}
          data-testid="button-create-team-submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Team"
          )}
        </Button>
      </main>

      <BottomNavigation />

      {/* Add Player Modal */}
      <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Player</DialogTitle>
            <DialogDescription>
              Search and add players from your friends list
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search friends..."
                className="pl-9"
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                data-testid="input-search-players"
              />
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredFriends.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {friends.length === 0 
                      ? "No friends yet. Add friends to invite them to your team!" 
                      : "No friends match your search."}
                  </p>
                </div>
              ) : (
                filteredFriends.map((friend: any) => {
                  const alreadyAdded = players.find(p => p.username === friend.username);
                  return (
                    <Card
                      key={friend.id}
                      className={`p-3 ${alreadyAdded ? 'opacity-50' : 'hover-elevate cursor-pointer'}`}
                      onClick={() => !alreadyAdded && addPlayer(friend.username, friend.avatarUrl || "")}
                      data-testid={`friend-${friend.username}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={friend.avatarUrl} />
                            <AvatarFallback>{friend.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">@{friend.username}</p>
                            {friend.displayName && (
                              <p className="text-xs text-muted-foreground">{friend.displayName}</p>
                            )}
                          </div>
                        </div>
                        {alreadyAdded && (
                          <Badge variant="secondary" className="text-xs">Added</Badge>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
