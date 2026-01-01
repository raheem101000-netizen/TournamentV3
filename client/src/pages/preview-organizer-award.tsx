import { useState, useEffect } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, Trophy, Medal, Star, Award, Users, Search, Check, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface User {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

const achievementTypes = [
  { id: "champion", name: "Champion", icon: Trophy, rarity: "legendary", description: "Tournament Winner" },
  { id: "mvp", name: "MVP Award", icon: Star, rarity: "epic", description: "Most Valuable Player" },
  { id: "runner-up", name: "Runner Up", icon: Medal, rarity: "rare", description: "Second Place Finish" },
  { id: "top-performer", name: "Top Performer", icon: Award, rarity: "rare", description: "Outstanding Performance" },
  { id: "team-victory", name: "Team Victory", icon: Users, rarity: "rare", description: "Team Tournament Win" },
];

const rarityColors: Record<string, string> = {
  common: "bg-slate-500/20 text-slate-700 dark:text-slate-300",
  rare: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  epic: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
  legendary: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
};

export default function PreviewOrganizerAward() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [recipientType, setRecipientType] = useState<"player" | "team">("player");
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAchievement, setSelectedAchievement] = useState<string>("");
  const [message, setMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch users based on search query
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["/api/users/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 1) return [];
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Failed to search users");
      return response.json() as Promise<User[]>;
    },
    enabled: recipientType === "player",
  });

  // Award achievement mutation
  const awardMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/achievements", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Achievement awarded successfully!",
      });
      setShowConfirm(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedRecipient("");
        setSelectedRecipientId("");
        setSearchQuery("");
        setSelectedAchievement("");
        setMessage("");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to award achievement",
        variant: "destructive",
      });
    },
  });

  const handleAward = () => {
    const achievementData = achievementTypes.find(a => a.id === selectedAchievement);
    const payload = {
      userId: selectedRecipientId,
      title: achievementData?.name || "Achievement",
      description: message || achievementData?.description || "",
      type: recipientType === "player" ? "solo" : "team",
      awardedBy: "organizer",
    };
    console.log("[AWARD-ACHIEVEMENT] Sending payload:", payload);
    awardMutation.mutate(payload);
  };

  const selectedAchievementData = achievementTypes.find(a => a.id === selectedAchievement);
  const isFormValid = selectedRecipientId && selectedAchievement;
  const players = searchResults || [];

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
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Award Achievement</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Organizer Panel
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Award verified achievements to players and teams. All awards are permanent and publicly visible.
            </p>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Award Type</Label>
                <Select value={recipientType} onValueChange={(v) => setRecipientType(v as "player" | "team")}>
                  <SelectTrigger data-testid="select-recipient-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">Individual Player</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{recipientType === "player" ? "Search & Select Player" : "Select Team"}</Label>
                {recipientType === "player" ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Type player @username..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSelectedRecipient("");
                          setSelectedRecipientId("");
                        }}
                        className="pl-10"
                        data-testid="input-search-player"
                      />
                    </div>
                    {(searchQuery || selectedRecipient) && (
                      <div className="border rounded-lg max-h-48 overflow-y-auto">
                        {searchLoading ? (
                          <div className="p-3 text-center text-muted-foreground flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Searching...
                          </div>
                        ) : players.length > 0 ? (
                          players.map((player) => (
                            <button
                              key={player.id}
                              onClick={() => {
                                setSelectedRecipient(player.username);
                                setSelectedRecipientId(player.id);
                                setSearchQuery("");
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-accent border-b last:border-b-0 flex items-center gap-2 transition-colors"
                              data-testid={`player-option-${player.id}`}
                            >
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={player.avatarUrl} />
                                <AvatarFallback>{player.username.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium text-sm">@{player.username}</p>
                                {player.displayName && (
                                  <p className="text-xs text-muted-foreground">{player.displayName}</p>
                                )}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-center text-sm text-muted-foreground">
                            No players found
                          </div>
                        )}
                      </div>
                    )}
                    {selectedRecipient && (
                      <div className="p-3 bg-accent rounded-lg flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">Selected: @{selectedRecipient}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <Select value={selectedRecipientId} onValueChange={setSelectedRecipientId}>
                    <SelectTrigger data-testid="select-recipient">
                      <SelectValue placeholder="Choose a team..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team-1">Shadow Wolves</SelectItem>
                      <SelectItem value="team-2">Storm Breakers</SelectItem>
                      <SelectItem value="team-3">Fire Dragons</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Label>Choose Achievement</Label>
            <div className="space-y-2">
              {achievementTypes.map((achievement) => {
                const Icon = achievement.icon;
                const isSelected = selectedAchievement === achievement.id;
                
                return (
                  <Card
                    key={achievement.id}
                    className={`hover-elevate cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedAchievement(achievement.id)}
                    data-testid={`achievement-option-${achievement.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${rarityColors[achievement.rarity]} shrink-0`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{achievement.name}</h4>
                            <Badge variant="outline" className="text-xs capitalize">
                              {achievement.rarity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-primary shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a congratulatory message or note..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                data-testid="input-message"
              />
              <p className="text-xs text-muted-foreground">
                This message will be visible to the recipient but not shown publicly.
              </p>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            disabled={!isFormValid || awardMutation.isPending}
            onClick={() => setShowConfirm(true)}
            data-testid="button-award"
          >
            {awardMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Awarding...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Award Achievement
              </>
            )}
          </Button>

          <Card className="p-4 border-amber-500/50 bg-amber-500/10">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Important</p>
                <p className="text-amber-800 dark:text-amber-200">
                  Achievements are permanent and cannot be revoked. Only award achievements that have been legitimately earned.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <BottomNavigation />

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Achievement Award</DialogTitle>
            <DialogDescription>
              Please review the details before awarding this achievement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedAchievementData && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-lg ${rarityColors[selectedAchievementData.rarity]}`}>
                      <selectedAchievementData.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{selectedAchievementData.name}</h4>
                      <Badge variant="outline" className="text-xs capitalize mt-1">
                        {selectedAchievementData.rarity}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Recipient:</span>
                      <span className="font-medium">
                        {recipientType === "player" 
                          ? `@${selectedRecipient}` 
                          : "Team"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium capitalize">{recipientType}</span>
                    </div>
                    {message && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-1">Message:</p>
                        <p className="text-sm italic">"{message}"</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleAward} disabled={awardMutation.isPending} data-testid="button-confirm-award">
              {awardMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Awarding...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Confirm Award
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 py-6">
            <div className="p-4 rounded-full bg-green-500/20">
              <Check className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Achievement Awarded!</h3>
              <p className="text-sm text-muted-foreground">
                The achievement has been successfully awarded and is now visible on the recipient's profile.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
