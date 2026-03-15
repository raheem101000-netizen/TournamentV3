import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MobileLayout } from "@/components/layouts/MobileLayout";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Edit, Users, Trophy, Medal, Award, Star, Plus, ArrowRight, Crown, Calendar, Check, X, Pencil, Trash2, Search, Loader2, Copy, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useAuth } from "@/contexts/AuthContext";
import type { User, TeamMember } from "@shared/schema";
import { getAchievementIcon, getAchievementColor } from "@/lib/achievement-utils";
import UserProfileModal from "@/components/UserProfileModal";
import { Gamepad2, AlertTriangle, Clock } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FEATURE_MESSAGES_ENABLED } from "@/config/features";

const mockUser = {
  username: "ProGamer2024",
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=progamer",
  bio: "Competitive gamer | Tournament organizer | Always looking for new teammates",
  friendCount: 247,
  level: 42,
  displayName: "Pro Gamer",
  profileId: undefined as string | undefined,
};

import type { TeamProfile } from "@shared/schema";

export default function PreviewAccount() {
  const [, setLocation] = useLocation();
  const [selectedTeam, setSelectedTeam] = useState<TeamProfile | null>(null);
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<any | null>(null);
  const [serverNotFound, setServerNotFound] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [showAllFriends, setShowAllFriends] = useState(false);

  // Team edit state
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamBio, setEditTeamBio] = useState("");
  const [editTeamGame, setEditTeamGame] = useState("");
  const [editTeamLogoUrl, setEditTeamLogoUrl] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMemberPosition, setEditMemberPosition] = useState("");
  const [editMemberRole, setEditMemberRole] = useState("");
  const [deleteTeamConfirm, setDeleteTeamConfirm] = useState(false);

  // Add member state
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const { user: authUser } = useAuth();
  const { toast } = useToast();

  const currentUser = authUser ? {
    username: authUser.username,
    avatarUrl: authUser.avatarUrl || undefined,
    bio: authUser.bio || "No bio yet",
    level: authUser.level || 1,
    friendCount: mockUser.friendCount, // Not in schema, use mock
    displayName: authUser.displayName || authUser.username,
    profileId: authUser.profileId || undefined,
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

  // Only show real achievements from the database
  const userAchievements = dbAchievements;

  // Fetch user's teams
  const teamsUserId = isOwnProfile ? authUser?.id : viewedUserData?.id;
  const { data: userTeams = [] } = useQuery<TeamProfile[]>({
    queryKey: [`/api/users/${teamsUserId}/team-profiles`],
    enabled: !!teamsUserId,
  });

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

  // Fetch team members when a team is selected (backend returns user data)
  const { data: teamMembers = [], isLoading: teamMembersLoading } = useQuery<(TeamMember & { user: User | null })[]>({
    queryKey: [`/api/team-profiles/${selectedTeam?.id}/members`],
    enabled: !!selectedTeam,
  });

  // Fetch team achievements
  const { data: teamAchievements = [] } = useQuery<any[]>({
    queryKey: [`/api/team-profiles/${selectedTeam?.id}/achievements`],
    enabled: !!selectedTeam,
  });

  // Search users query for adding members
  const { data: searchResults = [], isLoading: isSearching } = useQuery<any[]>({
    queryKey: ["/api/users/search", memberSearchQuery],
    queryFn: async () => {
      if (!memberSearchQuery || memberSearchQuery.length < 2) return [];
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(memberSearchQuery)}`);
      if (!res.ok) throw new Error("Failed to search users");
      return res.json();
    },
    enabled: addMemberOpen && memberSearchQuery.length >= 2,
  });

  // Check if current user is the team owner
  const isTeamOwner = selectedTeam && authUser?.id === selectedTeam.ownerId;

  // Mutation to update team profile
  const updateTeamMutation = useMutation({
    mutationFn: async ({ teamId, data }: { teamId: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/team-profiles/${teamId}`, data);
      return response;
    },
    onSuccess: (updatedTeam) => {
      // Update selectedTeam with the new data from the server
      setSelectedTeam(updatedTeam);
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].includes("team-profiles"),
      });
      toast({ title: "Team updated successfully" });
      setIsEditingTeam(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update team", description: error.message, variant: "destructive" });
    },
  });

  // Mutation to update team member
  const updateMemberMutation = useMutation({
    mutationFn: async ({ memberId, data }: { memberId: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/team-members/${memberId}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].includes("members"),
      });
      toast({ title: "Member updated successfully" });
      setEditingMemberId(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update member", description: error.message, variant: "destructive" });
    },
  });

  // Mutation to add team member
  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!selectedTeam) throw new Error("No team selected");
      const res = await apiRequest("POST", "/api/team-members", {
        teamId: selectedTeam.id,
        userId: userId,
        role: "Member",
        position: "Member"
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].includes("members"),
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].includes("team-profiles"),
      });
      toast({ title: "Member added successfully" });
      setAddMemberOpen(false);
      setMemberSearchQuery("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to add member", description: error.message, variant: "destructive" });
    },
  });

  // Mutation to remove team member
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiRequest("DELETE", `/api/team-members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].includes("members"),
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].includes("team-profiles"),
      });
      toast({ title: "Member removed successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to remove member", description: error.message, variant: "destructive" });
    },
  });

  // Mutation to delete team
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      await apiRequest("DELETE", `/api/team-profiles/${teamId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].includes("team-profiles"),
      });
      toast({ title: "Team deleted successfully" });
      setSelectedTeam(null);
      setDeleteTeamConfirm(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete team", description: error.message, variant: "destructive" });
    },
  });

  const startEditingTeam = () => {
    if (selectedTeam) {
      setEditTeamName(selectedTeam.name);
      setEditTeamBio(selectedTeam.bio || "");
      setEditTeamGame(selectedTeam.game || "");
      setEditTeamLogoUrl(selectedTeam.logoUrl || "");
      setIsEditingTeam(true);
    }
  };

  const saveTeamChanges = () => {
    if (selectedTeam) {
      updateTeamMutation.mutate({
        teamId: selectedTeam.id,
        data: {
          name: editTeamName,
          bio: editTeamBio || null,
          game: editTeamGame || null,
          logoUrl: editTeamLogoUrl || null
        },
      });
    }
  };

  const startEditingMember = (member: TeamMember & { user: User | null }) => {
    setEditingMemberId(member.id);
    setEditMemberPosition(member.position || "");
    setEditMemberRole(member.role || "Member");
  };

  const saveMemberChanges = () => {
    if (editingMemberId) {
      updateMemberMutation.mutate({
        memberId: editingMemberId,
        data: { position: editMemberPosition || null, role: editMemberRole || "Member" },
      });
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen pb-20">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-2xl font-bold">{isOwnProfile ? "Profile" : `${viewedUserData?.displayName || displayUser}`}</h1>
            <div className="flex items-center gap-2">
              {isOwnProfile && (
                <>
                  {/* Admin Panel link - only for admins */}
                  {(authUser as any)?.isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setLocation("/admin")}
                      data-testid="button-admin-panel"
                    >
                      <Shield className="w-5 h-5 text-primary" />
                    </Button>
                  )}
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
                    <Avatar className="w-24 h-24 border-4 border-primary/20">
                      <AvatarImage src={currentUser.avatarUrl || undefined} />
                      <AvatarFallback>{currentUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="space-y-2 w-full">
                      <h2 className="text-2xl font-bold">{currentUser.displayName || currentUser.username}</h2>

                      {/* Profile ID */}
                      {currentUser.profileId && (
                        <div className="flex items-center justify-center gap-2">
                          <Badge variant="outline" className="font-mono text-sm px-3 py-1 bg-primary/10">
                            {currentUser.profileId}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(currentUser.profileId!);
                              toast({ title: "Copied!", description: "Profile ID copied to clipboard" });
                            }}
                            data-testid="button-copy-user-profile-id"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

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
                    {FEATURE_MESSAGES_ENABLED && (
                      <Button variant="outline" className="flex-1" data-testid="button-message">
                        Message
                      </Button>
                    )}
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

            {userTeams.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    No teams yet. {isOwnProfile ? "Create your first team!" : ""}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {userTeams.map((team) => (
                  <Card
                    key={team.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => setSelectedTeam(team)}
                    data-testid={`team-card-${team.id}`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex flex-col items-center text-center">
                        {team.logoUrl ? (
                          <Avatar className="w-12 h-12 mb-2">
                            <AvatarImage src={team.logoUrl} alt={team.name} />
                            <AvatarFallback>{team.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-12 h-12 mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <h4 className="font-semibold text-sm line-clamp-1">{team.name}</h4>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>{team.totalMembers || 1} members</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {userAchievements && userAchievements.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Achievements</h3>
              <div className="grid grid-cols-3 gap-3">
                {userAchievements.map((achievement: any) => {
                  const IconComponent = getAchievementIcon(achievement.iconUrl, achievement.title);
                  const colorClass = getAchievementColor(achievement.iconUrl || achievement.title?.toLowerCase().replace(/\s+/g, '-') || "");
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
                          ) : achievement.serverId ? (
                            <p className="text-xs text-destructive text-center">Server no longer exists</p>
                          ) : null}
                          <p className="text-xs text-muted-foreground text-center">Team Award</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}



        </main>
      </div>

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
                    <p className="text-sm text-muted-foreground">
                      @{selectedAchievement.awardedByUsername || selectedAchievement.awardedByName || "Admin"}
                    </p>
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
      <Dialog open={!!selectedTeam} onOpenChange={() => { setSelectedTeam(null); setIsEditingTeam(false); setEditingMemberId(null); setDeleteTeamConfirm(false); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedTeam && (
            <div className="space-y-6">
              <DialogHeader className="space-y-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  {isEditingTeam ? (
                    <div className="w-full max-w-[200px]">
                      <ImageUploadField
                        value={editTeamLogoUrl}
                        onChange={setEditTeamLogoUrl}
                        label="Team Logo"
                        placeholder="Upload or paste URL"
                      />
                    </div>
                  ) : (
                    selectedTeam.logoUrl ? (
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={selectedTeam.logoUrl} alt={selectedTeam.name} />
                        <AvatarFallback className="text-2xl">{selectedTeam.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-10 h-10 text-primary" />
                      </div>
                    )
                  )}
                  <div className="w-full">
                    {isEditingTeam ? (
                      <Input
                        value={editTeamName}
                        onChange={(e) => setEditTeamName(e.target.value)}
                        className="text-center text-xl font-bold"
                        data-testid="input-edit-team-name"
                      />
                    ) : (
                      <DialogTitle className="text-2xl mb-1">{selectedTeam.name}</DialogTitle>
                    )}
                    {selectedTeam.tag && (
                      <Badge variant="secondary" className="mt-1">[{selectedTeam.tag}]</Badge>
                    )}
                    {/* Auto-generated Profile ID */}
                    {selectedTeam.profileId && (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Badge variant="outline" className="font-mono text-sm px-3 py-1 bg-primary/10">
                          {selectedTeam.profileId}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedTeam.profileId!);
                            toast({ title: "Copied!", description: "Profile ID copied to clipboard" });
                          }}
                          data-testid="button-copy-profile-id"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {!selectedTeam.profileId && (
                      <p className="text-xs text-muted-foreground mt-2">No Profile ID assigned yet</p>
                    )}
                  </div>
                </div>
                {isTeamOwner && !isEditingTeam && (
                  <Button size="sm" variant="outline" onClick={startEditingTeam} data-testid="button-edit-team">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Team
                  </Button>
                )}
                {isEditingTeam && (
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" onClick={saveTeamChanges} disabled={updateTeamMutation.isPending} data-testid="button-save-team">
                      <Check className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingTeam(false)} data-testid="button-cancel-edit-team">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Bio</h4>
                  {isEditingTeam ? (
                    <Textarea
                      value={editTeamBio}
                      onChange={(e) => setEditTeamBio(e.target.value)}
                      rows={3}
                      data-testid="input-edit-team-bio"
                    />
                  ) : (
                    <p className="text-sm">{selectedTeam.bio || "No bio yet"}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{teamMembers.length || selectedTeam.totalMembers || 1}</p>
                    <p className="text-xs text-muted-foreground">Members</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{selectedTeam.totalTournaments || 0}</p>
                    <p className="text-xs text-muted-foreground">Tournaments</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{selectedTeam.totalWins || 0}</p>
                    <p className="text-xs text-muted-foreground">Wins</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Gamepad2 className="w-3 h-3" />
                    Game
                  </h4>
                  {isEditingTeam ? (
                    <Input
                      value={editTeamGame}
                      onChange={(e) => setEditTeamGame(e.target.value)}
                      placeholder="Enter game name..."
                      data-testid="input-edit-team-game"
                    />
                  ) : (
                    <p className="text-sm">{selectedTeam.game || "Not specified"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground">Created</h4>
                  <p className="text-sm">
                    {new Date(selectedTeam.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Delete Team Section - Owner Only */}
                {isTeamOwner && (
                  <div className="pt-4 border-t">
                    {deleteTeamConfirm ? (
                      <div className="space-y-3">
                        <p className="text-sm text-destructive font-medium">Are you sure you want to delete this team? This cannot be undone.</p>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteTeamMutation.mutate(selectedTeam.id)}
                            disabled={deleteTeamMutation.isPending}
                            data-testid="button-confirm-delete-team"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {deleteTeamMutation.isPending ? "Deleting..." : "Yes, Delete Team"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTeamConfirm(false)}
                            data-testid="button-cancel-delete-team"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTeamConfirm(true)}
                        data-testid="button-delete-team"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Team
                      </Button>
                    )}
                  </div>
                )}

                {/* Team Achievements Section */}
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Achievements
                  </h4>
                  {teamAchievements.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No achievements yet</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {teamAchievements.map((achievement) => {
                        const IconComponent = getAchievementIcon(achievement.iconUrl, achievement.title);
                        const colorClass = getAchievementColor(achievement.iconUrl || achievement.title?.toLowerCase().replace(/\s+/g, '-') || "");

                        return (
                          <Card
                            key={achievement.id}
                            className="hover-elevate cursor-pointer overflow-hidden"
                            onClick={() => setSelectedAchievement(achievement)}
                            data-testid={`team-achievement-card-${achievement.id}`}
                          >
                            <CardContent className="p-4 flex flex-col items-center text-center space-y-2 overflow-hidden">
                              <div className="relative inline-flex items-center justify-center">
                                <IconComponent className={`w-8 h-8 ${colorClass}`} />
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
                                  >
                                    <span className="block truncate">{achievement.serverName}</span>
                                  </Button>
                                ) : achievement.serverId ? (
                                  <p className="text-xs text-destructive text-center">Server no longer exists</p>
                                ) : null}
                                <p className="text-xs text-muted-foreground text-center">Team Award</p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Team Members Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Team Members
                    </h4>
                    {isTeamOwner && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddMemberOpen(true)} data-testid="button-add-member-dialog">
                        <Plus className="w-3 h-3 mr-1" />
                        Add Member
                      </Button>
                    )}
                  </div>
                  {teamMembersLoading ? (
                    <p className="text-sm text-muted-foreground">Loading members...</p>
                  ) : teamMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No members added yet</p>
                  ) : (
                    <div className="space-y-2">
                      {teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="p-2 rounded-md bg-muted/50"
                          data-testid={`team-member-${member.id}`}
                        >
                          {editingMemberId === member.id ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={member.user?.avatarUrl || undefined} />
                                  <AvatarFallback>
                                    {member.user?.username?.substring(0, 2).toUpperCase() || "??"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">@{member.user?.username || "unknown"}</span>
                              </div>
                              <Input
                                placeholder="Position (e.g., IGL, Support, AWPer)"
                                value={editMemberPosition}
                                onChange={(e) => setEditMemberPosition(e.target.value)}
                                data-testid="input-edit-member-position"
                              />
                              <Input
                                placeholder="Role (e.g., Owner, Captain, Member)"
                                value={editMemberRole}
                                onChange={(e) => setEditMemberRole(e.target.value)}
                                data-testid="input-edit-member-role"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={saveMemberChanges} disabled={updateMemberMutation.isPending} data-testid="button-save-member">
                                  <Check className="w-4 h-4 mr-1" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingMemberId(null)} data-testid="button-cancel-edit-member">
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={member.user?.avatarUrl || undefined} />
                                <AvatarFallback>
                                  {member.user?.username?.substring(0, 2).toUpperCase() || "??"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  @{member.user?.username || "unknown"}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {member.role === "Owner" && (
                                    <span className="font-medium text-yellow-600 dark:text-yellow-500">Owner</span>
                                  )}
                                  {member.role === "Owner" && member.position && <span>-</span>}
                                  {member.position && (
                                    <span className="truncate">{member.position}</span>
                                  )}
                                  {member.role && member.role !== "Owner" && member.role !== "Member" && (
                                    <>
                                      {member.position && <span>-</span>}
                                      <span>{member.role}</span>
                                    </>
                                  )}
                                  {!member.position && (!member.role || member.role === "Member") && (
                                    <span>Member</span>
                                  )}
                                </div>
                              </div>
                              {member.role === "Owner" && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                              {isTeamOwner && (
                                <Button size="icon" variant="ghost" onClick={() => startEditingMember(member)} data-testid={`button-edit-member-${member.id}`}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              )}
                              {isTeamOwner && member.role !== "Owner" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removeMemberMutation.mutate(member.id)}
                                  data-testid={`button-remove-member-${member.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={(open) => { setAddMemberOpen(open); setMemberSearchQuery(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-member"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {isSearching ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : memberSearchQuery.length >= 2 && searchResults.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No users found</p>
              ) : (
                searchResults.map((user: any) => {
                  const isAlreadyMember = teamMembers.some(m => m.userId === user.id);
                  return (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.displayName || user.username}</p>
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={isAlreadyMember || addMemberMutation.isPending}
                        onClick={() => addMemberMutation.mutate(user.id)}
                        data-testid={`button-add-user-${user.id}`}
                      >
                        {isAlreadyMember ? "Added" : "Add"}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Friend Profile Modal */}
      <UserProfileModal
        userId={selectedFriendId}
        open={!!selectedFriendId}
        onOpenChange={(open) => !open && setSelectedFriendId(null)}
      />
    </MobileLayout>
  );
}
