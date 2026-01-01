import { useQuery, useMutation } from "@tanstack/react-query";
import { Trophy, Plus, ArrowLeft, Calendar, Users as UsersIcon, Medal, Star, Award, Target, Shield, Zap, ChevronDown, ChevronRight, Check, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel as FormLabelComponent,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import TournamentCard from "@/components/TournamentCard";
import CreateTournamentDialog from "@/components/CreateTournamentDialog";
import BracketView from "@/components/BracketView";
import StandingsTable from "@/components/StandingsTable";
import MatchCard from "@/components/MatchCard";
import RichMatchChat from "@/components/RichMatchChat";
import UserProfileModal from "@/components/UserProfileModal";
import PosterUploadField from "@/components/PosterUploadField";
import RegistrationFormBuilder from "@/modules/registration/RegistrationFormBuilder";
import type { Tournament, InsertTournament, Team, Match } from "@shared/schema";
import type { RegistrationFormConfig } from "@/modules/registration/types";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Predefined achievements with fixed icon-title pairs
const predefinedAchievements = [
  { id: "champion", icon: Trophy, color: "text-amber-500", title: "Champion", isEditable: false },
  { id: "runner-up", icon: Medal, color: "text-slate-300", title: "Runner Up", isEditable: false },
  { id: "third-place", icon: Medal, color: "text-amber-700", title: "Third Place", isEditable: false },
  { id: "mvp", icon: Award, color: "text-purple-500", title: "MVP", isEditable: false },
  { id: "top-scorer", icon: Target, color: "text-red-500", title: "", isEditable: true },
  { id: "best-defense", icon: Shield, color: "text-green-500", title: "", isEditable: true },
  { id: "rising-star", icon: Zap, color: "text-yellow-500", title: "", isEditable: true },
];

const awardAchievementSchema = z.object({
  playerId: z.string().min(1, "Please enter a player ID"),
  achievementId: z.string().min(1, "Please select an achievement"),
  customTitle: z.string().max(50).optional(),
  description: z.string().max(200).optional(),
  reward: z.string().min(1, "Reward is required").max(300),
  game: z.string().min(1, "Game is required").max(100),
  region: z.string().min(1, "Region is required").max(100),
});

interface TournamentDashboardChannelProps {
  serverId: string;
}

export default function TournamentDashboardChannel({ serverId }: TournamentDashboardChannelProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAwardAchievementDialogOpen, setIsAwardAchievementDialogOpen] = useState(false);
  const [isCreateMatchDialogOpen, setIsCreateMatchDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedTeam1Id, setSelectedTeam1Id] = useState<string | null>(null);
  const [selectedTeam2Id, setSelectedTeam2Id] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showMatchChat, setShowMatchChat] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [expandedRegistrationId, setExpandedRegistrationId] = useState<string | null>(null);
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(null);
  const { toast} = useToast();
  const { user } = useAuth();

  const achievementForm = useForm({
    resolver: zodResolver(awardAchievementSchema),
    defaultValues: {
      playerId: "",
      achievementId: "champion",
      customTitle: "",
      description: "",
      reward: "",
      game: "",
      region: "",
    },
  });

  const { data: allTournaments = [], isLoading } = useQuery<Tournament[]>({
    queryKey: ["/api/tournaments"],
  });

  const createTournamentMutation = useMutation({
    mutationFn: async (data: InsertTournament & { teamNames: string[]; registrationConfig?: RegistrationFormConfig; serverId?: string }) => {
      const tournament = await apiRequest('POST', '/api/tournaments', data);
      
      // Auto-generate fixtures based on format
      if (tournament && data.teamNames.length > 0) {
        try {
          await apiRequest('POST', `/api/tournaments/${tournament.id}/generate-fixtures`, {
            format: data.format,
            teamNames: data.teamNames,
          });
          console.log('[MUTATION-CREATE] Fixtures auto-generated for tournament:', tournament.id);
        } catch (fixtureError) {
          console.warn('[MUTATION-CREATE] Failed to auto-generate fixtures:', fixtureError);
        }
      }
      
      return tournament;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: "Tournament created",
        description: "Your tournament has been created successfully with auto-generated fixtures.",
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTournamentMutation = useMutation({
    mutationFn: async (data: Partial<Tournament>) => {
      return apiRequest('PATCH', `/api/tournaments/${selectedTournamentId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: "Tournament updated",
        description: "Your tournament has been updated successfully.",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: selectedTournamentTeams = [] } = useQuery<Team[]>({
    queryKey: [`/api/tournaments/${selectedTournamentId}/teams`],
    enabled: !!selectedTournamentId,
  });

  const { data: selectedTournamentMatches = [] } = useQuery<Match[]>({
    queryKey: [`/api/tournaments/${selectedTournamentId}/matches`],
    enabled: !!selectedTournamentId,
    refetchInterval: 2000,
  });

  const { data: registrationConfig } = useQuery<RegistrationFormConfig>({
    queryKey: [`/api/tournaments/${selectedTournamentId}/registration/config`],
    enabled: !!selectedTournamentId,
  });

  const { data: registrations = [] } = useQuery<any[]>({
    queryKey: [`/api/tournaments/${selectedTournamentId}/registrations`],
    enabled: !!selectedTournamentId,
  });

  const updateRegistrationConfigMutation = useMutation({
    mutationFn: async (config: RegistrationFormConfig) => {
      console.log('[MUTATION] Starting save for tournament:', selectedTournamentId);
      console.log('[MUTATION] Config payload:', JSON.stringify(config, null, 2));
      try {
        const result = await apiRequest('PUT', `/api/tournaments/${selectedTournamentId}/registration/config`, config);
        console.log('[MUTATION] Backend response:', result);
        return result;
      } catch (err) {
        console.error('[MUTATION] API call failed:', err);
        throw err;
      }
    },
    onSuccess: () => {
      console.log('[MUTATION] Success - invalidating cache');
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${selectedTournamentId}/registration/config`] });
      toast({
        title: "Registration saved",
        description: "Registration steps updated successfully.",
      });
    },
    onError: (error: Error) => {
      console.error('[MUTATION] Error callback:', error);
      toast({
        title: "Error saving registration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTournamentMutation = useMutation({
    mutationFn: async () => {
      console.log('[DELETE] Attempting to delete tournament:', selectedTournamentId);
      console.log('[DELETE] User ID:', user?.id);
      const url = `/api/tournaments/${selectedTournamentId}?userId=${user?.id}`;
      console.log('[DELETE] URL:', url);
      return apiRequest('DELETE', url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: "Tournament deleted",
        description: "The tournament has been permanently deleted.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedTournamentId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const serverTournaments = allTournaments.filter(t => t.serverId === serverId);
  const upcomingTournaments = serverTournaments.filter(t => t.status === "upcoming");
  const inProgressTournaments = serverTournaments.filter(t => t.status === "in_progress");
  const completedTournaments = serverTournaments.filter(t => t.status === "completed");

  const selectedTournament = allTournaments.find(t => t.id === selectedTournamentId);
  const selectedMatch = selectedTournamentMatches.find(m => m.id === selectedMatchId);

  const submitScoreMutation = useMutation({
    mutationFn: async ({ matchId, winnerId, team1Score, team2Score }: { matchId: string; winnerId: string; team1Score: number; team2Score: number }) => {
      return apiRequest('POST', `/api/matches/${matchId}/score`, {
        winnerId,
        team1Score,
        team2Score
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${selectedTournamentId}/matches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${selectedTournamentId}/teams`] });
      toast({
        title: "Score submitted",
        description: "Match result has been recorded.",
      });
      setSelectedMatchId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCustomMatchMutation = useMutation({
    mutationFn: async ({ team1Id, team2Id }: { team1Id: string; team2Id: string }) => {
      return apiRequest('POST', `/api/tournaments/${selectedTournamentId}/matches/custom`, {
        team1Id,
        team2Id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${selectedTournamentId}/matches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${selectedTournamentId}/teams`] });
      toast({
        title: "Match created",
        description: "New match has been created successfully.",
      });
      setSelectedTeam1Id(null);
      setSelectedTeam2Id(null);
      setIsCreateMatchDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectWinnerMutation = useMutation({
    mutationFn: async ({ matchId, winnerId }: { matchId: string; winnerId: string }) => {
      return apiRequest('POST', `/api/matches/${matchId}/winner`, {
        winnerId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${selectedTournamentId}/matches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${selectedTournamentId}/teams`] });
      toast({
        title: "Winner recorded",
        description: "Match result has been saved. Use the Participants tab to manually eliminate teams.",
      });
      setSelectedMatchId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const awardAchievementMutation = useMutation({
    mutationFn: async (data: z.infer<typeof awardAchievementSchema>) => {
      // Look up the achievement details
      const achievement = predefinedAchievements.find(a => a.id === data.achievementId);
      if (!achievement) {
        throw new Error("Invalid achievement selected");
      }
      
      // Use custom title if editable and provided, otherwise use default
      const finalTitle = achievement.isEditable && data.customTitle ? data.customTitle : achievement.title;
      
      return apiRequest("POST", "/api/achievements", {
        userId: data.playerId,
        serverId: serverId,
        title: finalTitle,
        description: data.description || "",
        reward: data.reward || "",
        game: data.game || "",
        region: data.region || "",
        type: "solo",
        iconUrl: achievement.id,
        category: "tournament",
        awardedBy: user?.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Achievement Awarded!",
        description: "The achievement has been awarded successfully.",
      });
      achievementForm.reset();
      setIsAwardAchievementDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${selectedTournament?.organizerId}/achievements`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to award achievement",
        variant: "destructive",
      });
    },
  });

  const handleViewTournament = (id: string) => {
    setSelectedTournamentId(id);
    setActiveTab("overview");
  };

  const handleBackToList = () => {
    setSelectedTournamentId(null);
    setActiveTab("overview");
  };

  const handleMatchClick = (matchId: string) => {
    setSelectedMatchId(matchId);
    setShowMatchChat(true);
  };

  const handleSubmitScore = (winnerId: string, team1Score: number, team2Score: number) => {
    if (selectedMatchId) {
      submitScoreMutation.mutate({ matchId: selectedMatchId, winnerId, team1Score, team2Score });
    }
  };

  const getTeamById = (id: string | null) => {
    return selectedTournamentTeams.find(t => t.id === id);
  };

  // Get username from team ID by looking up the registration
  const getUsernameByTeamId = (teamId: string | null): string | null => {
    if (!teamId) return null;
    const team = selectedTournamentTeams.find(t => t.id === teamId) as any;
    if (!team) return null;
    // Use team members data if available (more accurate than team name matching)
    if (team.members && team.members.length > 0) {
      return team.members[0].username || null;
    }
    // Fallback to registration lookup by user ID in team members
    const reg = registrations.find(r => {
      const memberTeam = selectedTournamentTeams.find((t: any) => 
        t.members && t.members.some((m: any) => m.userId === r.userId)
      );
      return memberTeam?.id === teamId && r.status === 'approved';
    });
    return reg?.userUsername || null;
  };

  // Get user info (username and avatar) from team ID using team members
  const getUserInfoByTeamId = (teamId: string | null): { username: string | null; avatar: string | null } => {
    if (!teamId) return { username: null, avatar: null };
    const team = selectedTournamentTeams.find(t => t.id === teamId) as any;
    if (!team) return { username: null, avatar: null };
    // Use team members data if available (more accurate than team name matching)
    if (team.members && team.members.length > 0) {
      const member = team.members[0];
      return { username: member.username || null, avatar: member.avatarUrl || null };
    }
    // Fallback to registration lookup by user ID in team members
    const reg = registrations.find(r => {
      const memberTeam = selectedTournamentTeams.find((t: any) => 
        t.members && t.members.some((m: any) => m.userId === r.userId)
      );
      return memberTeam?.id === teamId && r.status === 'approved';
    });
    return { username: reg?.userUsername || null, avatar: reg?.userAvatar || null };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Loading tournaments...</p>
      </div>
    );
  }

  // Show tournament detail view
  if (selectedTournamentId && selectedTournament) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBackToList} data-testid="button-back-to-list">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-xl font-bold">{selectedTournament.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={selectedTournament.status === "upcoming" ? "secondary" : "default"}>
                  {selectedTournament.status.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">{selectedTournament.game}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)} data-testid="button-edit-tournament">
              Edit
            </Button>
            <Button variant="destructive" size="icon" onClick={() => {
              console.log('[DELETE] Trash button clicked, opening dialog');
              setIsDeleteDialogOpen(true);
            }} data-testid="button-delete-tournament">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto inline-flex flex-row flex-nowrap bg-transparent p-0 gap-2">
            <TabsTrigger value="overview" className="whitespace-nowrap rounded-md border border-border px-3 py-2">Overview</TabsTrigger>
            <TabsTrigger value="bracket" className="whitespace-nowrap rounded-md border border-border px-3 py-2">Bracket</TabsTrigger>
            <TabsTrigger value="standings" className="whitespace-nowrap rounded-md border border-border px-3 py-2">Standings</TabsTrigger>
            <TabsTrigger value="match-chat" className="whitespace-nowrap rounded-md border border-border px-3 py-2">Match Chat</TabsTrigger>
            <TabsTrigger value="registrations" className="whitespace-nowrap rounded-md border border-border px-3 py-2">Registrations</TabsTrigger>
            <TabsTrigger value="participants" className="whitespace-nowrap rounded-md border border-border px-3 py-2">Participants</TabsTrigger>
            <TabsTrigger value="teams" className="whitespace-nowrap rounded-md border border-border px-3 py-2">Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Format</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-base font-bold capitalize">
                    {selectedTournament.format.replace('_', ' ')}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-base font-bold">{selectedTournament.totalTeams === -1 ? "Unlimited" : selectedTournament.totalTeams}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Prize Pool</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-base font-bold">{selectedTournament.prizeReward || 'TBD'}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTournament.platform && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Platform</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-semibold">{selectedTournament.platform}</div>
                  </CardContent>
                </Card>
              )}
              {selectedTournament.region && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Region</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-semibold">{selectedTournament.region}</div>
                  </CardContent>
                </Card>
              )}
            </div>

            {selectedTournament.startDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {new Date(selectedTournament.startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bracket">
            {selectedTournamentMatches.length > 0 ? (
              <BracketView
                matches={selectedTournamentMatches}
                teams={selectedTournamentTeams}
                format={selectedTournament.format}
              />
            ) : (
              <Card className="p-8">
                <p className="text-center text-muted-foreground">
                  No matches scheduled yet
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="match-chat" className="space-y-4">
            {selectedTournamentMatches.length > 0 ? (
              showMatchChat && selectedMatch ? (
                // Full match chat view with back button
                <div className="space-y-3 min-h-[600px] flex flex-col">
                  <div className="flex items-center gap-3 border-b pb-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setShowMatchChat(false)}
                      data-testid="button-back-to-fixtures"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    {(() => {
                      const user1 = getUserInfoByTeamId(selectedMatch.team1Id);
                      const user2 = getUserInfoByTeamId(selectedMatch.team2Id);
                      const winner = getUserInfoByTeamId(selectedMatch.winnerId);
                      return (
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {user1.avatar && (
                                <img src={user1.avatar} alt={user1.username || ''} className="w-6 h-6 rounded-full object-cover" />
                              )}
                              <span className="text-primary font-semibold">@{user1.username || 'Player 1'}</span>
                            </div>
                            <span className="text-muted-foreground">vs</span>
                            <div className="flex items-center gap-1">
                              {user2.avatar && (
                                <img src={user2.avatar} alt={user2.username || ''} className="w-6 h-6 rounded-full object-cover" />
                              )}
                              <span className="text-primary font-semibold">@{user2.username || 'Player 2'}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Round {selectedMatch.round} • Status: {selectedMatch.status}
                            {selectedMatch.winnerId && (
                              <span className="inline-flex items-center gap-1 ml-1">
                                • Winner: 
                                {winner.avatar && (
                                  <img src={winner.avatar} alt={winner.username || ''} className="w-4 h-4 rounded-full object-cover inline" />
                                )}
                                <span className="text-primary">@{winner.username || 'Unknown'}</span>
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    })()}
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
                          apiRequest('DELETE', `/api/matches/${selectedMatch.id}`)
                            .then(() => {
                              queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${selectedTournamentId}/matches`] });
                              setShowMatchChat(false);
                              setSelectedMatchId(null);
                              toast({
                                title: "Match deleted",
                                description: "The match has been deleted successfully.",
                              });
                            })
                            .catch((error) => {
                              toast({
                                title: "Error",
                                description: error.message,
                                variant: "destructive",
                              });
                            });
                        }
                      }}
                      data-testid="button-delete-match"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden min-h-0">
                    {selectedMatch && (
                      <RichMatchChat 
                        matchId={selectedMatch.id}
                        winnerId={selectedMatch.winnerId}
                        tournamentId={selectedTournamentId}
                        team1Name={`@${getUsernameByTeamId(selectedMatch.team1Id) || 'Player 1'}`}
                        team2Name={`@${getUsernameByTeamId(selectedMatch.team2Id) || 'Player 2'}`}
                        team1Id={selectedMatch.team1Id || ''}
                        team2Id={selectedMatch.team2Id || ''}
                      />
                    )}
                  </div>
                </div>
              ) : (
                // Grid of match fixture cards
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Click a fixture to view chat</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedTournamentMatches.map((match) => {
                      const user1 = getUserInfoByTeamId(match.team1Id);
                      const user2 = getUserInfoByTeamId(match.team2Id);
                      const winnerInfo = getUserInfoByTeamId(match.winnerId);
                      return (
                        <button
                          key={match.id}
                          onClick={() => {
                            handleMatchClick(match.id);
                            setShowMatchChat(true);
                          }}
                          className={`p-3 rounded-lg border transition-all text-left ${
                            selectedMatchId === match.id
                              ? 'bg-accent text-accent-foreground border-accent'
                              : 'bg-card border-border hover:border-primary/50 hover-elevate'
                          }`}
                          data-testid={`button-match-${match.id}`}
                        >
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              {user1.avatar && (
                                <img src={user1.avatar} alt={user1.username || ''} className="w-5 h-5 rounded-full object-cover" />
                              )}
                              <span className="font-semibold text-sm truncate text-primary">@{user1.username || 'Player 1'}</span>
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">vs</div>
                            <div className="flex items-center gap-1">
                              {user2.avatar && (
                                <img src={user2.avatar} alt={user2.username || ''} className="w-5 h-5 rounded-full object-cover" />
                              )}
                              <span className="font-semibold text-sm truncate text-primary">@{user2.username || 'Player 2'}</span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground text-center mb-2">Round {match.round}</div>
                          <div className="text-xs text-center">
                            {match.winnerId ? (
                              <div className="font-semibold text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                                Winner: 
                                {winnerInfo.avatar && (
                                  <img src={winnerInfo.avatar} alt={winnerInfo.username || ''} className="w-4 h-4 rounded-full object-cover" />
                                )}
                                @{winnerInfo.username || 'Unknown'}
                              </div>
                            ) : (
                              <div className="text-muted-foreground">{match.status}</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              <Card className="p-8">
                <p className="text-center text-muted-foreground">
                  No matches scheduled yet. Matches will be auto-generated when teams register.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="standings">
            {selectedTournamentTeams.length > 0 ? (
              <StandingsTable teams={selectedTournamentTeams} />
            ) : (
              <Card className="p-8">
                <p className="text-center text-muted-foreground">
                  No teams registered yet
                </p>
              </Card>
            )}
          </TabsContent>


          <TabsContent value="registrations">
            {registrations.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {registrations.length} registration{registrations.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-2">
                  {registrations.map((reg) => {
                    // Use the stored teamName directly - it's extracted correctly on the backend
                    const headerValue = reg.teamName || "Unknown Team";
                    const isExpanded = expandedRegistrationId === reg.id;
                    
                    return (
                      <Card key={reg.id} className="overflow-hidden">
                        <CardHeader 
                          className="flex flex-row items-center justify-between space-y-0 pb-3 cursor-pointer hover-elevate"
                          onClick={() => setExpandedRegistrationId(isExpanded ? null : reg.id)}
                          data-testid={`button-expand-registration-${reg.id}`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            {reg.userAvatar && (
                              <img 
                                src={reg.userAvatar} 
                                alt={reg.userUsername}
                                className="w-10 h-10 rounded-full object-cover"
                                data-testid={`img-avatar-${reg.userId}`}
                              />
                            )}
                            <div className="flex-1">
                              <Button 
                                variant="ghost" 
                                className="p-0 h-auto text-base font-semibold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Navigate to user profile
                                  window.location.href = `/profile/${reg.userId}`;
                                }}
                                data-testid={`button-view-profile-${reg.userId}`}
                              >
                                @{reg.userUsername}
                              </Button>
                              <p className="text-sm text-muted-foreground">
                                {headerValue}
                              </p>
                            </div>
                          </div>
                          <Badge variant={
                            reg.status === 'approved' ? 'default' : 
                            reg.status === 'submitted' ? 'secondary' : 
                            'outline'
                          }>
                            {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                          </Badge>
                        </CardHeader>
                        
                        {/* Expandable Q&A section */}
                        {isExpanded && (
                          <CardContent className="pt-0 border-t">
                            <div className="space-y-3 pt-4">
                              <h4 className="text-sm font-medium text-muted-foreground">Registration Responses</h4>
                              {registrationConfig?.steps && registrationConfig.steps.length > 0 ? (
                                <div className="space-y-3">
                                  {registrationConfig.steps.map((step) => {
                                    const answer = reg.responses?.[step.id] || "";
                                    return (
                                      <div key={step.id} className="bg-muted/50 rounded-md p-3">
                                        <p className="text-sm font-medium mb-1">{step.stepTitle}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {answer || <span className="italic">No answer provided</span>}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">
                                  No registration questions configured
                                </p>
                              )}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Card className="p-8">
                <p className="text-center text-muted-foreground">
                  No registrations yet
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="participants">
            {registrations.filter(r => r.status === 'approved').length > 0 ? (
              <div className="space-y-4">
                <Button 
                  onClick={() => setIsCreateMatchDialogOpen(true)} 
                  data-testid="button-create-custom-match"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Match
                </Button>
                <p className="text-sm text-muted-foreground">
                  {registrations.filter(r => r.status === 'approved').length} participant{registrations.filter(r => r.status === 'approved').length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-2">
                  {registrations.filter(r => r.status === 'approved').map((reg) => {
                    const headerValue = reg.teamName || "Unknown Team";
                    const isExpanded = expandedParticipantId === reg.id;
                    // Find the matching team by user membership (not by name, since names can be duplicated)
                    const matchingTeam = selectedTournamentTeams.find((t: any) => 
                      t.members && t.members.some((m: any) => m.userId === reg.userId)
                    );
                    
                    return (
                      <Card key={reg.id} className={`overflow-hidden ${matchingTeam?.isRemoved ? "opacity-50" : ""}`}>
                        <CardHeader 
                          className="flex flex-row items-center justify-between space-y-0 pb-3 cursor-pointer hover-elevate gap-2"
                          onClick={() => setExpandedParticipantId(isExpanded ? null : reg.id)}
                          data-testid={`button-expand-participant-${reg.id}`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            {reg.userAvatar && (
                              <img 
                                src={reg.userAvatar} 
                                alt={reg.userUsername}
                                className="w-10 h-10 rounded-full object-cover"
                                data-testid={`img-avatar-participant-${reg.userId}`}
                              />
                            )}
                            <div className="flex-1">
                              <Button 
                                variant="ghost" 
                                className="p-0 h-auto text-base font-semibold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/profile/${reg.userId}`;
                                }}
                                data-testid={`button-view-profile-participant-${reg.userId}`}
                              >
                                @{reg.userUsername}
                              </Button>
                              <p className="text-sm text-muted-foreground">
                                {headerValue}
                              </p>
                              {matchingTeam?.isRemoved && (
                                <Badge variant="destructive" className="mt-1">Eliminated</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            {matchingTeam && (
                              <>
                                <Badge variant="outline">{matchingTeam.wins}W</Badge>
                                <Badge variant="outline">{matchingTeam.losses}L</Badge>
                              </>
                            )}
                          </div>
                        </CardHeader>
                        
                        {/* Expandable Q&A section */}
                        {isExpanded && (
                          <CardContent className="pt-0 border-t">
                            <div className="space-y-3 pt-4">
                              <h4 className="text-sm font-medium text-muted-foreground">Registration Responses</h4>
                              {registrationConfig?.steps && registrationConfig.steps.length > 0 ? (
                                <div className="space-y-3">
                                  {registrationConfig.steps.map((step) => {
                                    const answer = reg.responses?.[step.id] || "";
                                    return (
                                      <div key={step.id} className="bg-muted/50 rounded-md p-3">
                                        <p className="text-sm font-medium mb-1">{step.stepTitle}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {answer || <span className="italic">No answer provided</span>}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">
                                  No registration questions configured
                                </p>
                              )}
                              
                              {/* Team actions */}
                              {matchingTeam && (
                                <div className="flex gap-2 flex-wrap pt-2 border-t mt-4">
                                  {!matchingTeam.isRemoved && (
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        apiRequest('PATCH', `/api/teams/${matchingTeam.id}`, {
                                          isRemoved: 1,
                                        }).then(() => {
                                          queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${selectedTournamentId}/teams`] });
                                          const memberUsername = (matchingTeam as any).members?.[0]?.username;
                                          toast({
                                            title: "Player eliminated",
                                            description: `@${memberUsername || 'Player'} has been eliminated from the tournament.`,
                                          });
                                        }).catch((error) => {
                                          toast({
                                            title: "Error",
                                            description: error.message,
                                            variant: "destructive",
                                          });
                                        });
                                      }}
                                      data-testid={`button-eliminate-${matchingTeam.id}`}
                                    >
                                      Eliminate
                                    </Button>
                                  )}
                                  {matchingTeam.isRemoved && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        apiRequest('PATCH', `/api/teams/${matchingTeam.id}`, {
                                          isRemoved: 0,
                                        }).then(() => {
                                          queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${selectedTournamentId}/teams`] });
                                          const memberUsername = (matchingTeam as any).members?.[0]?.username;
                                          toast({
                                            title: "Player restored",
                                            description: `@${memberUsername || 'Player'} has been restored to the tournament.`,
                                          });
                                        }).catch((error) => {
                                          toast({
                                            title: "Error",
                                            description: error.message,
                                            variant: "destructive",
                                          });
                                        });
                                      }}
                                      data-testid={`button-restore-${matchingTeam.id}`}
                                    >
                                      Restore
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Card className="p-8">
                <p className="text-center text-muted-foreground">
                  No participants yet
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="teams">
            {selectedTournamentTeams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTournamentTeams.map((team) => {
                  const memberUsername = (team as any).members?.[0]?.username;
                  return (
                    <Card key={team.id}>
                      <CardHeader>
                        <CardTitle>@{memberUsername || 'Unknown'}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Wins:</span>{' '}
                            <span className="font-semibold">{team.wins || 0}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Losses:</span>{' '}
                            <span className="font-semibold">{team.losses || 0}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Points:</span>{' '}
                            <span className="font-semibold">{team.points || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8">
                <p className="text-center text-muted-foreground">
                  No teams registered yet
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isCreateMatchDialogOpen} onOpenChange={setIsCreateMatchDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Match</DialogTitle>
              <DialogDescription>
                Select two participants to create a new match
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {(() => {
                // Get approved participants - use registration ID as unique identifier
                // Find team by matching user ID in team_members, not by team name
                // Include ALL approved registrations (even if team was removed) since we're selecting by user
                const approvedParticipants = registrations
                  .filter(r => r.status === 'approved')
                  .map(reg => {
                    // Find the team where this user is a member (including removed teams)
                    const team = selectedTournamentTeams.find((t: any) => 
                      t.members && t.members.some((m: any) => m.userId === reg.userId)
                    );
                    return { ...reg, teamId: team?.id || null, teamRemoved: team?.isRemoved || false };
                  })
                  .filter(p => p.teamId); // Only filter out those without a team, not removed teams

                const getParticipantById = (regId: string | null) => 
                  regId ? approvedParticipants.find(p => p.id === regId) : null;

                const selectedParticipant1 = getParticipantById(selectedTeam1Id);
                const selectedParticipant2 = getParticipantById(selectedTeam2Id);

                return (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Participant 1</Label>
                      <Select value={selectedTeam1Id || ""} onValueChange={setSelectedTeam1Id}>
                        <SelectTrigger>
                          {selectedParticipant1 ? (
                            <span className="text-primary">@{selectedParticipant1.userUsername}</span>
                          ) : (
                            <SelectValue placeholder="Select participant 1" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {approvedParticipants
                            .filter(p => p.id !== selectedTeam2Id)
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                <span className="text-primary">@{p.userUsername}</span>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Participant 2</Label>
                      <Select value={selectedTeam2Id || ""} onValueChange={setSelectedTeam2Id}>
                        <SelectTrigger>
                          {selectedParticipant2 ? (
                            <span className="text-primary">@{selectedParticipant2.userUsername}</span>
                          ) : (
                            <SelectValue placeholder="Select participant 2" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {approvedParticipants
                            .filter(p => p.id !== selectedTeam1Id)
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                <span className="text-primary">@{p.userUsername}</span>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                );
              })()}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateMatchDialogOpen(false)}
                data-testid="button-cancel-create-match"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedTeam1Id && selectedTeam2Id) {
                    // Look up team IDs from registration IDs using team_members
                    const reg1 = registrations.find(r => r.id === selectedTeam1Id);
                    const reg2 = registrations.find(r => r.id === selectedTeam2Id);
                    // Find team where the user is a member
                    const team1 = reg1 ? selectedTournamentTeams.find((t: any) => 
                      t.members && t.members.some((m: any) => m.userId === reg1.userId)
                    ) : null;
                    const team2 = reg2 ? selectedTournamentTeams.find((t: any) => 
                      t.members && t.members.some((m: any) => m.userId === reg2.userId)
                    ) : null;
                    
                    if (team1?.id && team2?.id) {
                      createCustomMatchMutation.mutate({ team1Id: team1.id, team2Id: team2.id });
                    }
                  }
                }}
                disabled={!selectedTeam1Id || !selectedTeam2Id || createCustomMatchMutation.isPending}
                data-testid="button-confirm-create-match"
              >
                {createCustomMatchMutation.isPending ? "Creating..." : "Create Match"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Tournament Confirmation Dialog - inside detail view */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Tournament</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedTournament?.name}"? This action cannot be undone and will permanently remove all tournament data including matches, teams, and registrations.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  console.log('[DELETE] Confirm button clicked, calling mutation');
                  deleteTournamentMutation.mutate();
                }}
                disabled={deleteTournamentMutation.isPending}
                data-testid="button-confirm-delete-tournament"
              >
                {deleteTournamentMutation.isPending ? "Deleting..." : "Delete Tournament"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <EditTournamentDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          tournament={selectedTournament}
          onSubmit={(data) => updateTournamentMutation.mutate(data)}
        />
      </div>
    );
  }

  // Show tournament list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Tournament Dashboard</h2>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={() => setIsAwardAchievementDialogOpen(true)} variant="outline" data-testid="button-award-achievement">
            <Trophy className="h-4 w-4 mr-2" />
            Award Achievement
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-tournament">
            <Plus className="h-4 w-4 mr-2" />
            Create Tournament
          </Button>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">
            Upcoming ({upcomingTournaments.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completed ({completedTournaments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcomingTournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No upcoming tournaments</p>
              <p className="text-xs text-muted-foreground mt-1">Create one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} onView={handleViewTournament} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completedTournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No completed tournaments</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} onView={handleViewTournament} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateTournamentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={(data) => {
          console.log('[DASHBOARD] CreateTournamentDialog onSubmit called with:', {
            name: data.name,
            format: data.format,
            hasRegistrationConfig: !!data.registrationConfig,
            registrationSteps: data.registrationConfig?.steps?.length || 0
          });
          createTournamentMutation.mutate({ ...data, serverId });
        }}
      />

      <EditTournamentDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        tournament={selectedTournament}
        onSubmit={(data) => updateTournamentMutation.mutate(data)}
      />

      <AwardAchievementDialog
        open={isAwardAchievementDialogOpen}
        onOpenChange={setIsAwardAchievementDialogOpen}
        form={achievementForm}
        onSubmit={(data) => awardAchievementMutation.mutate(data)}
        isPending={awardAchievementMutation.isPending}
      />

      {/* Delete Tournament Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tournament</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTournament?.name}"? This action cannot be undone and will permanently remove all tournament data including matches, teams, and registrations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                console.log('[DELETE] Confirm button clicked, calling mutation');
                deleteTournamentMutation.mutate();
              }}
              disabled={deleteTournamentMutation.isPending}
              data-testid="button-confirm-delete-tournament"
            >
              {deleteTournamentMutation.isPending ? "Deleting..." : "Delete Tournament"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UserProfileModal 
        userId={selectedProfileId} 
        open={profileModalOpen} 
        onOpenChange={setProfileModalOpen} 
      />
    </div>
  );
}

interface EditTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: Tournament | undefined;
  onSubmit: (data: Partial<Tournament>) => void;
}

function EditTournamentDialog({ open, onOpenChange, tournament, onSubmit }: EditTournamentDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [game, setGame] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [posterWidth, setPosterWidth] = useState<number | null>(null);
  const [posterHeight, setPosterHeight] = useState<number | null>(null);
  const [prizeReward, setPrizeReward] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [platform, setPlatform] = useState("");
  const [region, setRegion] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"none" | "stripe" | "paypal" | "cryptocurrency">("none");
  const [paymentLink, setPaymentLink] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [totalTeams, setTotalTeams] = useState("-1");
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (tournament && open) {
      setName(tournament.name || "");
      setGame(tournament.game || "");
      setImageUrl(tournament.imageUrl || "");
      setPosterWidth(tournament.posterWidth || null);
      setPosterHeight(tournament.posterHeight || null);
      setPrizeReward(tournament.prizeReward || "");
      setEntryFee(tournament.entryFee || "");
      setStartDate(tournament.startDate ? new Date(tournament.startDate).toISOString().slice(0, 16) : "");
      setEndDate(tournament.endDate ? new Date(tournament.endDate).toISOString().slice(0, 16) : "");
      setPlatform(tournament.platform || "");
      setRegion(tournament.region || "");
      setPaymentMethod(tournament.paymentMethod as any || "none");
      setPaymentLink(tournament.paymentLink || "");
      setPaymentInstructions(tournament.paymentInstructions || "");
      setTotalTeams(String(tournament.totalTeams || -1));
      setIsPublic(tournament.visibility !== "private");
    }
  }, [tournament, open]);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({
        title: "Name required",
        description: "Tournament name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    onSubmit({
      name: trimmedName,
      game: game.trim() || null,
      imageUrl: imageUrl.trim() || null,
      posterWidth,
      posterHeight,
      prizeReward: prizeReward.trim() || null,
      entryFee: entryFee.trim() || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      platform: platform.trim() || null,
      region: region.trim() || null,
      paymentMethod,
      paymentLink: paymentLink.trim() || null,
      paymentInstructions: paymentInstructions.trim() || null,
      totalTeams: parseInt(totalTeams) || -1,
      visibility: isPublic ? "public" : "private",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tournament</DialogTitle>
          <DialogDescription>
            Update tournament details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Tournament Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-edit-tournament-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-game">Game</Label>
            <Input
              id="edit-game"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              data-testid="input-edit-tournament-game"
            />
          </div>
          <PosterUploadField
            label="Tournament Poster"
            value={imageUrl}
            onChange={(url, width, height) => {
              setImageUrl(url);
              if (width && height) {
                setPosterWidth(width);
                setPosterHeight(height);
              }
            }}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-prizeReward">Prize Pool</Label>
              <Input
                id="edit-prizeReward"
                placeholder="e.g., $1,000, No Prize, TBA"
                value={prizeReward}
                onChange={(e) => setPrizeReward(e.target.value)}
                data-testid="input-edit-tournament-prize"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-entryFee">Entry Fee</Label>
              <Input
                id="edit-entryFee"
                placeholder="e.g., FREE, $5, ₦1000"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                data-testid="input-edit-tournament-entry-fee"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-startDate">Start Date & Time</Label>
              <Input
                id="edit-startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-edit-tournament-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-endDate">End Date & Time</Label>
              <Input
                id="edit-endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-edit-tournament-end-date"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-platform">Platform</Label>
              <Input
                id="edit-platform"
                placeholder="e.g., PC, Xbox, PlayStation"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                data-testid="input-edit-tournament-platform"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-region">Region</Label>
              <Input
                id="edit-region"
                placeholder="e.g., NA, EU, APAC"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                data-testid="input-edit-tournament-region"
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold mb-3">Payment & Capacity Settings</h3>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="edit-paymentMethod">Payment Method</Label>
              <select
                id="edit-paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                data-testid="select-edit-payment-method"
              >
                <option value="none">No Payment Required</option>
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
                <option value="cryptocurrency">Cryptocurrency</option>
              </select>
            </div>

            <div className="space-y-2 mb-4">
              <Label htmlFor="edit-paymentInstructions">Payment Instructions</Label>
              <Input
                id="edit-paymentInstructions"
                placeholder="e.g., enter your @username in the payment link when you pay"
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                data-testid="input-edit-payment-instructions"
              />
            </div>

            <div className="space-y-2 mb-4">
              <Label htmlFor="edit-paymentLink">Payment Link</Label>
              <Input
                id="edit-paymentLink"
                placeholder="e.g., https://buy.stripe.com/... or https://paypal.me/username"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                data-testid="input-edit-payment-link"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-totalTeams">Maximum Teams (-1 for unlimited)</Label>
              <Input
                id="edit-totalTeams"
                type="number"
                placeholder="-1 for unlimited"
                value={totalTeams}
                onChange={(e) => setTotalTeams(e.target.value)}
                data-testid="input-edit-total-teams"
              />
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="edit-visibility">Tournament Visibility</Label>
              <select
                id="edit-visibility"
                value={isPublic ? "public" : "private"}
                onChange={(e) => setIsPublic(e.target.value === "public")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                data-testid="select-edit-visibility"
              >
                <option value="public">Public - Visible to everyone</option>
                <option value="private">Private - Only visible to members</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Private tournaments are only shown to server members
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} data-testid="button-save-tournament">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AwardAchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: any;
  onSubmit: (data: z.infer<typeof awardAchievementSchema>) => void;
  isPending: boolean;
}

function AwardAchievementDialog({ 
  open, 
  onOpenChange, 
  form, 
  onSubmit, 
  isPending 
}: AwardAchievementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Award Achievement</DialogTitle>
          <DialogDescription>
            Recognize a player for their outstanding performance
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Player ID */}
            <FormField
              control={form.control}
              name="playerId"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabelComponent>Player ID/Username</FormLabelComponent>
                  <FormControl>
                    <Input
                      placeholder="Enter player's ID or username"
                      {...field}
                      data-testid="input-achievement-player-id"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Achievement Selection */}
            <FormField
              control={form.control}
              name="achievementId"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabelComponent>Achievement</FormLabelComponent>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-achievement">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {predefinedAchievements.map(({ id, icon: IconComponent, color, title }) => {
                        return (
                          <SelectItem key={id} value={id}>
                            <div className="flex items-center gap-2">
                              <IconComponent className={`w-4 h-4 ${color}`} />
                              <span>{title}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Title for Editable Achievements */}
            {(() => {
              const selectedAchievement = predefinedAchievements.find(
                a => a.id === form.watch("achievementId")
              );
              return selectedAchievement?.isEditable ? (
                <FormField
                  control={form.control}
                  name="customTitle"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabelComponent>Achievement Title</FormLabelComponent>
                      <FormControl>
                        <Input
                          placeholder="e.g., Top Scorer, Best Defender, Rising Star, or any custom name"
                          {...field}
                          data-testid="input-custom-achievement-title"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter a custom title for this achievement
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null;
            })()}

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabelComponent>Description (Optional)</FormLabelComponent>
                  <FormControl>
                    <Input
                      placeholder="Why they earned this achievement"
                      {...field}
                      data-testid="input-achievement-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reward */}
            <FormField
              control={form.control}
              name="reward"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabelComponent>Reward</FormLabelComponent>
                  <FormControl>
                    <Input
                      placeholder="e.g., $500 Prize Pool, Trophy, In-game rewards"
                      {...field}
                      data-testid="input-achievement-reward"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Game */}
            <FormField
              control={form.control}
              name="game"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabelComponent>Game</FormLabelComponent>
                  <FormControl>
                    <Input
                      placeholder="e.g., Valorant, Counter-Strike 2, League of Legends"
                      {...field}
                      data-testid="input-achievement-game"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Region */}
            <FormField
              control={form.control}
              name="region"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabelComponent>Region</FormLabelComponent>
                  <FormControl>
                    <Input
                      placeholder="e.g., NA, EU, APAC, Global"
                      {...field}
                      data-testid="input-achievement-region"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit-achievement">
                {isPending ? "Awarding..." : "Award Achievement"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
