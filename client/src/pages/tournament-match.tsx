import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, X, ChevronLeft, Trophy, Upload as UploadIcon, AlertCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { Match, Team, Tournament } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

const awardAchievementSchema = z.object({
  playerId: z.string().min(1, "Please select a player"),
  title: z.string().min(1, "Achievement title is required").max(50),
  description: z.string().max(200),
  icon: z.string(),
  type: z.string().optional(),
});

interface TeamMember {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
}

interface TeamWithMembers extends Team {
  members?: TeamMember[];
}

interface MatchDetails {
  match: Match;
  tournament: Tournament;
  team1: TeamWithMembers;
  team2: TeamWithMembers;
  team1Players: any[];
  team2Players: any[];
}

// Get display name from team members (first member's username with @ prefix)
const getTeamDisplayName = (team: TeamWithMembers): string => {
  if (team?.members && team.members.length > 0) {
    return `@${team.members[0].username}`;
  }
  return team?.name || "TBD";
};

interface ChatMessage {
  id: string;
  matchId: string;
  userId?: string;
  username: string;
  displayName?: string;
  message: string;
  createdAt: string;
  imageUrl?: string;
  avatarUrl?: string;
}

interface User {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}

export default function TournamentMatch() {
  const [match, params] = useRoute("/tournament/:tournamentId/match/:matchId");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const matchId = params?.matchId;
  const tournamentId = params?.tournamentId;

  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch match details
  const { data: matchDetails, isLoading: matchLoading } = useQuery<MatchDetails>({
    queryKey: [`/api/tournaments/${tournamentId}/matches/${matchId}/details`],
    enabled: !!matchId && !!tournamentId,
  });

  // Fetch current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch messages for the match
  const { data: chatMessages = [], isLoading: messagesLoading, error: messagesError } = useQuery<ChatMessage[]>({
    queryKey: ["/api/matches", matchId, "messages"],
    enabled: !!matchId,
    queryFn: async () => {
      if (!matchId) {
        console.log(`[DASHBOARD-CHAT-FETCH] No matchId`);
        return [];
      }
      console.log(`[DASHBOARD-CHAT-FETCH] Fetching messages for match: ${matchId}`);
      const response = await fetch(`/api/matches/${matchId}/messages`);
      if (!response.ok) {
        const text = await response.text();
        console.error(`[DASHBOARD-CHAT-FETCH] Error ${response.status}:`, text);
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      console.log(`[DASHBOARD-CHAT-FETCH] Received ${data.length} messages:`, JSON.stringify(data));
      return data;
    },
  });
  
  // Log errors
  if (messagesError) {
    console.error(`[DASHBOARD-CHAT] Query error:`, messagesError);
  }

  const qc = useQueryClient();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const payload = {
        userId: currentUser?.id,
        username: currentUser?.username,
        message,
      };
      console.log(`[DASHBOARD-CHAT-SEND] Sending message:`, JSON.stringify(payload));
      const response = await fetch(`/api/matches/${matchId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`[DASHBOARD-CHAT-SEND] Failed to send message:`, error);
        throw new Error("Failed to send message");
      }
      const data = await response.json();
      console.log(`[DASHBOARD-CHAT-SEND] Response:`, JSON.stringify(data));
      return data;
    },
    onSuccess: () => {
      setMessageInput("");
      toast({ title: "Message sent!" });
      qc.invalidateQueries({
        queryKey: ["/api/matches", matchId, "messages"],
      });
    },
    onError: (error: any) => {
      console.error(`[DASHBOARD-CHAT-SEND] Mutation error:`, error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessageMutation.mutate(messageInput);
  };

  const handleUpdateScore = async (team: "team1" | "team2") => {
    if (!matchDetails) return;
    
    const score = team === "team1" 
      ? (matchDetails.match.team1Score || 0) + 1 
      : (matchDetails.match.team2Score || 0) + 1;

    try {
      await apiRequest("PATCH", `/api/matches/${matchId}`, {
        [team === "team1" ? "team1Score" : "team2Score"]: score,
        status: "in_progress",
      });
      
      qc.invalidateQueries({
        queryKey: [`/api/tournaments/${tournamentId}/matches/${matchId}/details`],
      });
      
      toast({ title: `${team === "team1" ? "Team 1" : "Team 2"} score updated!` });
    } catch (error: any) {
      toast({
        title: "Error updating score",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (matchLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!matchDetails) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Match not found</p>
            <Button onClick={() => setLocation("/tournament")} className="w-full mt-4">
              Back to Tournaments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { match: m, tournament, team1, team2, team1Players, team2Players } = matchDetails;
  const isTeam1Manager = currentUser?.id === (team1 as any).managerId;
  const isTeam2Manager = currentUser?.id === (team2 as any).managerId;

  const navigateToMatchChat = () => {
    setLocation(`/messages?matchId=${matchId}`);
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation(`/tournament/${tournamentId}`)}
            data-testid="button-back-to-tournament"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{tournament.name}</h1>
            <p className="text-sm text-muted-foreground">Match Details</p>
          </div>
        </div>

        {/* Match Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {getTeamDisplayName(team1)} vs {getTeamDisplayName(team2)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">{getTeamDisplayName(team1)}</p>
                <p className="text-4xl font-bold">{m.team1Score || 0}</p>
              </div>
              <div className="flex items-center justify-center">
                <Badge variant="outline">Round {m.round}</Badge>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">{getTeamDisplayName(team2)}</p>
                <p className="text-4xl font-bold">{m.team2Score || 0}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold mb-3">{getTeamDisplayName(team1)} Players</p>
                <div className="space-y-2">
                  {team1Players.map((player) => (
                    <div key={player.id} className="text-sm text-muted-foreground">
                      {player.name}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold mb-3">{getTeamDisplayName(team2)} Players</p>
                <div className="space-y-2">
                  {team2Players.map((player) => (
                    <div key={player.id} className="text-sm text-muted-foreground">
                      {player.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {(isTeam1Manager || isTeam2Manager) && (
              <div className="flex gap-2 pt-4">
                {isTeam1Manager && (
                  <Button onClick={() => handleUpdateScore("team1")} className="flex-1">
                    +1 Score ({getTeamDisplayName(team1)})
                  </Button>
                )}
                {isTeam2Manager && (
                  <Button onClick={() => handleUpdateScore("team2")} className="flex-1">
                    +1 Score ({getTeamDisplayName(team2)})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Match Chat - Links to Inbox */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Match Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Chat about this match with team members. All messages with usernames and avatars are fully clickable and link to user profiles.
            </p>
            <Button 
              onClick={navigateToMatchChat}
              data-testid="button-open-match-chat"
            >
              Open Match Chat in Inbox
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
