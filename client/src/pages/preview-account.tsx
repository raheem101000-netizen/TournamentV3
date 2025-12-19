import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Edit, Users, Trophy, Medal, Award, Star, Plus, ArrowRight, Crown, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@shared/schema";
import { getAchievementIcon, getAchievementColor } from "@/lib/achievement-utils";
import UserProfileModal from "@/components/UserProfileModal";

const mockUser = {
  username: "ProGamer2024",
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=progamer",
  bio: "Competitive gamer | Tournament organizer | Always looking for new teammates",
  friendCount: 247,
  level: 42,
};

const mockTeams = [
  {
    id: "1",
    name: "Shadow Wolves",
    logo: "🐺",
    playerCount: 5,
    owner: "@ProGamer2024",
    game: "Valorant",
    bio: "Competitive Valorant team looking to dominate the esports scene. We practice daily and compete in major tournaments.",
    players: [
      { username: "ProGamer2024", position: "IGL", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=progamer" },
      { username: "NinjaKid", position: "Duelist", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ninja" },
      { username: "SniperElite", position: "Sentinel", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sniper" },
      { username: "FlashBang", position: "Controller", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=flash" },
      { username: "TacticalG", position: "Initiator", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=tactical" },
    ],
    achievements: [
      { title: "Regional Champions" },
      { title: "Top 5 Finish" },
      { title: "Undefeated Streak" },
    ],
    tournaments: [
      { name: "Summer Championship 2024", result: "1st Place - $5,000" },
      { name: "Midnight Masters", result: "3rd Place - $1,000" },
      { name: "Winter Showdown", result: "Semifinals" },
    ],
  },
  {
    id: "2",
    name: "Storm Breakers",
    logo: "⚡",
    playerCount: 4,
    owner: "@ProGamer2024",
    game: "CS:GO",
    bio: "CS:GO squad focused on tactical gameplay and team coordination.",
    players: [
      { username: "ProGamer2024", position: "AWPer", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=progamer" },
      { username: "QuickShot", position: "Entry Fragger", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=quick" },
      { username: "CalmPlay", position: "Support", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=calm" },
      { username: "BombMaster", position: "Lurker", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bomb" },
    ],
    achievements: [
      { title: "Runner Up" },
      { title: "Best Team Coordination" },
    ],
    tournaments: [
      { name: "Winter Showdown", result: "2nd Place - $1,500" },
    ],
  },
];

const mockAchievements = [
  {
    id: "ach-1",
    title: "Tournament Champion",
    iconUrl: "champion",
    description: "Won first place in a major tournament",
    serverName: "Valorant Esports League",
    serverId: "server-1",
  },
  {
    id: "ach-2",
    title: "Runner Up",
    iconUrl: "runner-up",
    description: "Finished second in a competitive tournament",
    serverName: "Counter Strike Pro League",
    serverId: "server-2",
  },
  {
    id: "ach-3",
    title: "Third Place Finisher",
    iconUrl: "third-place",
    description: "Achieved third place in a regional competition",
    serverName: "Fighting Game Championship",
    serverId: "server-3",
  },
  {
    id: "ach-4",
    title: "MVP Award",
    iconUrl: "mvp",
    description: "Voted Most Valuable Player in a tournament",
    serverName: "Valorant Esports League",
    serverId: "server-1",
  },
  {
    id: "ach-5",
    title: "Rising Star",
    iconUrl: "rising-star",
    description: "Recognized as an emerging competitive talent",
    serverName: null,
    serverId: null,
  },
  {
    id: "ach-6",
    title: "Best Defender",
    iconUrl: "best-defense",
    description: "Awarded best defensive player in tournament",
    serverName: "Counter Strike Pro League",
    serverId: "server-2",
  },
];

export default function PreviewAccount() {
  const [, setLocation] = useLocation();
  const [selectedTeam, setSelectedTeam] = useState<typeof mockTeams[0] | null>(null);
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<any | null>(null);
  const [serverNotFound, setServerNotFound] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [showAllFriends, setShowAllFriends] = useState(false);

  const { user: authUser } = useAuth();

  const currentUser = authUser ? {
    username: authUser.username,
    avatarUrl: authUser.avatarUrl || undefined,
    bio: authUser.bio || "No bio yet",
    level: authUser.level || 1,
    friendCount: mockUser.friendCount, // Not in schema, use mock
    displayName: authUser.displayName || authUser.username,
  } : mockUser;

  // Check if viewing own profile or another user's profile
  const isOwnProfile = viewingUser === null;
  const displayUser = viewingUser || currentUser.username;

  // Fetch viewed user's data if viewing another profile
  const { data: viewedUserData } = useQuery<User | undefined>({
    queryKey: [`/api/users/username/${viewingUser}`],
    enabled: viewingUser !== null,
  });

  // Determine which user ID to fetch achievements for
  const achievementsUserId = isOwnProfile ? authUser?.id : viewedUserData?.id;

  const { data: dbAchievements = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${achievementsUserId || "demo"}/achievements`],
    enabled: !!achievementsUserId, // Enable if we have a userId
  });

  // Use mock achievements when viewing a visitor profile, real achievements for own profile
  const userAchievements = !isOwnProfile ? mockAchievements : dbAchievements;

  // Fetch friends list (only for own profile)
  const { data: friends = [] } = useQuery<any[]>({
    queryKey: ["/api/friends"],
    enabled: isOwnProfile && !!authUser,
    queryFn: async () => {
      const res = await fetch("/api/friends", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{isOwnProfile ? "Profile" : `@${displayUser}`}</h1>
          <div className="flex items-center gap-2">
            {isOwnProfile && (
              <>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setViewingUser("NinjaKid")}
                  data-testid="button-demo-visitor"
                >
                  View as Visitor
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setLocation("/account/settings")}
                  data-testid="button-settings"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </>
            )}
            {!isOwnProfile && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setViewingUser(null)} 
                data-testid="button-back-to-profile"
              >
                Back to My Profile
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {!authUser ? (
                <div className="py-8">
                  <p className="text-muted-foreground">Loading profile...</p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-primary/20">
                      <AvatarImage src={currentUser.avatarUrl || undefined} />
                      <AvatarFallback>{currentUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {isOwnProfile && (
                      <Button
                        size="icon"
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full"
                        data-testid="button-edit-avatar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2 w-full">
                    <h2 className="text-2xl font-bold">{currentUser.username}</h2>
                    
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{isOwnProfile ? friends.length : (currentUser.friendCount ?? 0)} friends</span>
                    </div>

                    <p className="text-sm text-muted-foreground px-4">
                      {currentUser.bio || "No bio yet"}
                    </p>
                  </div>
                </>
              )}

              {isOwnProfile ? (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setLocation("/account/settings")}
                  data-testid="button-edit-profile"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2 w-full">
                  <Button variant="default" className="flex-1" data-testid="button-add-friend">
                    <Users className="w-4 h-4 mr-2" />
                    Add Friend
                  </Button>
                  <Button variant="outline" className="flex-1" data-testid="button-message">
                    Message
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Friends Section - only show on own profile */}
        {isOwnProfile && friends.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Friends</h3>
              <span className="text-sm text-muted-foreground">{friends.length}</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {friends.slice(0, 5).map((friend: any) => (
                <div
                  key={friend.id}
                  className="flex flex-col items-center text-center cursor-pointer hover-elevate p-2 rounded-lg"
                  onClick={() => setSelectedFriendId(friend.id)}
                  data-testid={`friend-${friend.id}`}
                >
                  <Avatar className="w-12 h-12 mb-1">
                    <AvatarImage src={friend.avatarUrl} />
                    <AvatarFallback>{friend.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-medium truncate w-full">{friend.displayName || friend.username}</p>
                </div>
              ))}
              {friends.length > 5 && (
                <div
                  className="flex flex-col items-center justify-center text-center cursor-pointer hover-elevate p-2 rounded-lg bg-muted/50"
                  onClick={() => setShowAllFriends(true)}
                  data-testid="button-show-more-friends"
                >
                  <div className="w-12 h-12 mb-1 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">+{friends.length - 5}</span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">more</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Friends Dialog */}
        <Dialog open={showAllFriends} onOpenChange={setShowAllFriends}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>All Friends ({friends.length})</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-4 gap-3 pt-4">
              {friends.map((friend: any) => (
                <div
                  key={friend.id}
                  className="flex flex-col items-center text-center cursor-pointer hover-elevate p-2 rounded-lg"
                  onClick={() => {
                    setShowAllFriends(false);
                    setSelectedFriendId(friend.id);
                  }}
                  data-testid={`friend-all-${friend.id}`}
                >
                  <Avatar className="w-12 h-12 mb-1">
                    <AvatarImage src={friend.avatarUrl} />
                    <AvatarFallback>{friend.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-medium truncate w-full">{friend.displayName || friend.username}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Teams</h3>
            {isOwnProfile && (
              <Button 
                size="sm" 
                onClick={() => setLocation("/create-team")}
                data-testid="button-create-team"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {mockTeams.map((team) => (
              <Card
                key={team.id}
                className="hover-elevate cursor-pointer"
                onClick={() => setSelectedTeam(team)}
                data-testid={`team-card-${team.id}`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col items-center text-center">
                    <div className="text-5xl mb-2">{team.logo}</div>
                    <h4 className="font-semibold text-sm line-clamp-1">{team.name}</h4>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{team.playerCount} players</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {userAchievements && userAchievements.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Achievements</h3>
            <div className="grid grid-cols-3 gap-3">
              {userAchievements.map((achievement: any) => {
                const IconComponent = getAchievementIcon(achievement.iconUrl);
                const colorClass = getAchievementColor(achievement.iconUrl);
                const getMedalNumber = () => {
                  if (achievement.iconUrl === "runner-up") return "2";
                  if (achievement.iconUrl === "third-place") return "3";
                  return null;
                };
                const medalNumber = getMedalNumber();
                
                return (
                  <Card 
                    key={achievement.id} 
                    className="hover-elevate cursor-pointer overflow-hidden"
                    onClick={() => setSelectedAchievement(achievement)}
                    data-testid={`achievement-card-${achievement.id}`}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center space-y-2 overflow-hidden">
                      <div className="relative inline-flex items-center justify-center">
                        <IconComponent className={`w-8 h-8 ${colorClass}`} />
                        {medalNumber && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                            {medalNumber}
                          </span>
                        )}
                      </div>
                      <div className="w-full min-w-0 flex flex-col items-center gap-1.5">
                        <p className="font-semibold text-sm line-clamp-2 text-center">{achievement.title}</p>
                        {achievement.game && <p className="text-xs text-muted-foreground text-center">{achievement.game}</p>}
                        {achievement.serverName ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto p-0 text-muted-foreground hover:text-foreground text-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (achievement.serverId) {
                                setLocation(`/server/${achievement.serverId}`);
                              }
                            }}
                            data-testid={`button-server-link-${achievement.id}`}
                          >
                            <span className="block truncate">{achievement.serverName}</span>
                          </Button>
                        ) : (
                          <p className="text-xs text-destructive text-center">Server no longer exists</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

      </main>

      <BottomNavigation />

      {/* Achievement Details Modal */}
      <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedAchievement && (
            <div className="space-y-6">
              <DialogHeader className="space-y-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  {(() => {
                    const IconComponent = getAchievementIcon(selectedAchievement.iconUrl);
                    const colorClass = getAchievementColor(selectedAchievement.iconUrl);
                    const getMedalNumber = () => {
                      if (selectedAchievement.iconUrl === "runner-up") return "2";
                      if (selectedAchievement.iconUrl === "third-place") return "3";
                      return null;
                    };
                    const medalNumber = getMedalNumber();
                    
                    return (
                      <div className="relative inline-flex items-center justify-center">
                        <IconComponent className={`w-12 h-12 ${colorClass}`} />
                        {medalNumber && (
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                            {medalNumber}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  <DialogTitle className="text-2xl">{selectedAchievement.title}</DialogTitle>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {selectedAchievement.description && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Description</h4>
                    <p className="text-sm">{selectedAchievement.description}</p>
                  </div>
                )}

                {selectedAchievement.reward && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Reward</h4>
                    <p className="text-sm">{selectedAchievement.reward}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedAchievement.game && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-muted-foreground">Game</h4>
                      <p className="text-sm">{selectedAchievement.game}</p>
                    </div>
                  )}
                  
                  {selectedAchievement.region && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-muted-foreground">Region</h4>
                      <p className="text-sm">{selectedAchievement.region}</p>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-muted-foreground">Category</h4>
                    <p className="text-sm capitalize">{selectedAchievement.category || "N/A"}</p>
                  </div>
                </div>

                {selectedAchievement.serverName && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Server</h4>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedAchievement(null);
                        setLocation(`/server/${selectedAchievement.serverId}`);
                      }}
                      data-testid="button-visit-server"
                    >
                      Visit {selectedAchievement.serverName}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}

                {selectedAchievement.awardedBy && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-muted-foreground">Awarded By</h4>
                    <p className="text-sm text-muted-foreground">@{selectedAchievement.awardedBy}</p>
                  </div>
                )}

                {selectedAchievement.createdAt && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-muted-foreground">Awarded On</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedAchievement.createdAt).toLocaleDateString()} at{" "}
                      {new Date(selectedAchievement.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Team Modal */}
      <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedTeam && (
            <div className="space-y-6">
              <DialogHeader className="space-y-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="text-7xl">{selectedTeam.logo}</div>
                  <div>
                    <DialogTitle className="text-2xl mb-1">{selectedTeam.name}</DialogTitle>
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <Crown className="w-4 h-4" />
                      <span>{selectedTeam.owner}</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Bio</h4>
                  <p className="text-sm">{selectedTeam.bio}</p>
                </div>

                {selectedTeam.game && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Game</h4>
                    <p className="text-sm">{selectedTeam.game}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">Player Roster</h4>
                  <div className="space-y-2">
                    {selectedTeam.players.map((player, idx) => (
                      <Card 
                        key={idx} 
                        className="p-3 hover-elevate cursor-pointer"
                        onClick={() => {
                          setSelectedTeam(null);
                          setViewingUser(player.username);
                        }}
                        data-testid={`player-${player.username}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={player.avatar} />
                              <AvatarFallback>{player.username[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm">@{player.username}</p>
                              <p className="text-xs text-muted-foreground">{player.position}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">Team Achievements</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedTeam.achievements.map((achievement, idx) => {
                      const Icon = achievement.icon;
                      return (
                        <Card key={idx} className="p-3">
                          <div className="flex flex-col items-center text-center space-y-2">
                            <Icon className={`w-8 h-8 ${achievement.color}`} />
                            <p className="text-xs font-medium line-clamp-2">
                              {achievement.title}
                            </p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">Tournaments Played</h4>
                  <div className="space-y-2">
                    {selectedTeam.tournaments.map((tournament, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">{tournament.name}</p>
                          <p className="text-xs text-muted-foreground">{tournament.result}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Friend Profile Modal */}
      <UserProfileModal
        userId={selectedFriendId}
        open={!!selectedFriendId}
        onOpenChange={(open) => !open && setSelectedFriendId(null)}
      />
    </div>
  );
}
