import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Trophy, X, Clock, Users, Laptop, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BracketView from "@/components/BracketView";
import StandingsTable from "@/components/StandingsTable";
import MatchCard from "@/components/MatchCard";
import type { Tournament as SchemaTournament, Team, Match } from "@shared/schema";

type Tournament = SchemaTournament & {
  description?: string;
  memberCount?: number;
  rules?: string;
};

export default function TournamentPublicView() {
  const [match, params] = useRoute("/tournament/:id/view");
  const [, setLocation] = useLocation();
  const tournamentId = params?.id;

  const { data: tournament } = useQuery<Tournament>({
    queryKey: [`/api/tournaments/${tournamentId}`],
    enabled: !!tournamentId,
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: [`/api/tournaments/${tournamentId}/teams`],
    enabled: !!tournamentId,
  });

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: [`/api/tournaments/${tournamentId}/matches`],
    enabled: !!tournamentId,
  });

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading tournament...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/95 flex items-center justify-center p-4">
      {/* Main Tournament Card */}
      <div className="w-full max-w-md bg-[#1a1b1e] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
        {/* Close/Back Button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={() => setLocation("/")}
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">{tournament.name}</h1>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{tournament.game || "UNSPECIFIED GAME"}</p>
          </div>

          {/* Host Info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-white/10">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${tournament.organizerName || 'host'}`} />
              <AvatarFallback>TH</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-bold text-sm">{tournament.organizerName || "System Host"}</p>
              <p className="text-xs text-gray-500">Tournament Host</p>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-8 py-2">
            <div>
              <p className="text-gray-400 text-sm mb-1">Prize Pool</p>
              <p className="text-2xl font-black text-[#4ade80]">{tournament.prizeReward || "$0"}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Entry Fee</p>
              <p className="text-2xl font-black text-[#4ade80]">{tournament.entryFee || "Free"}</p>
            </div>
          </div>

          <div className="h-px bg-white/10 w-full" />

          {/* Details List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Start Time</span>
              </div>
              <span className="text-white font-medium">
                {tournament.startDate ? new Date(tournament.startDate).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "TBA"}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-gray-400">
                <Users className="w-4 h-4" />
                <span>Players</span>
              </div>
              <span className="text-white font-medium">{tournament.memberCount || 0} / {tournament.totalTeams || "Unlimited"}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-gray-400">
                <Trophy className="w-4 h-4" />
                <span>Format</span>
              </div>
              <span className="text-white font-medium capitalize">{tournament.format.replace('_', ' ')}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-gray-400">
                <Laptop className="w-4 h-4" />
                <span>Platform</span>
              </div>
              <span className="text-white font-medium">{tournament.platform || "Any"}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>Region</span>
              </div>
              <span className="text-white font-medium">{tournament.region || "Global"}</span>
            </div>
          </div>

          {/* Join Button */}
          <Button
            className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-black font-bold h-12 rounded-xl text-lg mt-4"
          >
            Join Tournament
          </Button>

          {/* Show more details link if description exists */}
          {tournament.description && (
            <div className="text-center">
              <p className="text-xs text-gray-500 mt-2 cursor-pointer hover:text-white transition-colors">
                View full rules and details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
