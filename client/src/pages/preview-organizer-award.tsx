import { useState } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, Trophy, Medal, Star, Award, Users, Search, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
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

const mockPlayers = [
  { username: "ProGamer2024", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=progamer" },
  { username: "NinjaKid", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ninja" },
  { username: "SniperElite", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sniper" },
  { username: "FlashBang", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=flash" },
];

const mockTeams = [
  { id: "1", name: "Shadow Wolves", logo: "🐺" },
  { id: "2", name: "Storm Breakers", logo: "⚡" },
  { id: "3", name: "Fire Dragons", logo: "🔥" },
];

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
  const [recipientType, setRecipientType] = useState<"player" | "team">("player");
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [selectedAchievement, setSelectedAchievement] = useState<string>("");
  const [message, setMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAward = () => {
    setShowConfirm(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedRecipient("");
      setSelectedAchievement("");
      setMessage("");
    }, 2000);
  };

  const selectedAchievementData = achievementTypes.find(a => a.id === selectedAchievement);
  const isFormValid = selectedRecipient && selectedAchievement;

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
                <Label>{recipientType === "player" ? "Select Player" : "Select Team"}</Label>
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger data-testid="select-recipient">
                    <SelectValue placeholder={`Choose a ${recipientType}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {recipientType === "player" ? (
                      mockPlayers.map((player) => (
                        <SelectItem key={player.username} value={player.username}>
                          @{player.username}
                        </SelectItem>
                      ))
                    ) : (
                      mockTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.logo} {team.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
            disabled={!isFormValid}
            onClick={() => setShowConfirm(true)}
            data-testid="button-award"
          >
            <Shield className="w-4 h-4 mr-2" />
            Award Achievement
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
                          : mockTeams.find(t => t.id === selectedRecipient)?.name}
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
            <Button onClick={handleAward} data-testid="button-confirm-award">
              <Shield className="w-4 h-4 mr-2" />
              Confirm Award
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
