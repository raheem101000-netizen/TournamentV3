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
    <div className="min-h-screen bg-black/95 flex items-center justify-center p-4 font-sans">
      {/* Main Tournament Card */}
      <div className="w-full max-w-md bg-[#09090b] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
        {/* Close/Back Button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
          onClick={() => setLocation("/")}
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">{tournament.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Laptop className="w-4 h-4" />
              <span className="uppercase tracking-wider font-medium">{tournament.game || "UNSPECIFIED GAME"}</span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="w-full h-48 rounded-xl overflow-hidden bg-zinc-900 border border-white/5 relative group">
            <img
              src={tournament.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${tournament.name}`}
              alt={tournament.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          {/* Prize Pool Strip */}
          <div className="flex items-center justify-between bg-zinc-900/50 rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-blue-400">
              <Trophy className="w-5 h-5" />
              <span className="font-medium">Prize Pool</span>
            </div>
            <span className="text-xl font-bold text-white">{tournament.prizeReward || "$0"}</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Teams */}
            <div className="bg-zinc-900/30 rounded-xl p-4 border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-medium">
                <Users className="w-4 h-4" />
                <span>Teams</span>
              </div>
              <p className="text-lg font-bold text-white">{tournament.memberCount || 0} / {tournament.totalTeams || "∞"}</p>
            </div>

            {/* Date */}
            <div className="bg-zinc-900/30 rounded-xl p-4 border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-medium">
                <Clock className="w-4 h-4" />
                <span>Date</span>
              </div>
              <p className="text-lg font-bold text-white truncate">
                {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "TBA"}
              </p>
            </div>

            {/* Entry Fee */}
            <div className="bg-zinc-900/30 rounded-xl p-4 border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-medium">
                <span>$</span>
                <span>Entry Fee</span>
              </div>
              <p className="text-lg font-bold text-white">{tournament.entryFee || "Free"}</p>
            </div>

            {/* Format */}
            <div className="bg-zinc-900/30 rounded-xl p-4 border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-medium">
                <Trophy className="w-4 h-4" />
                <span>Format</span>
              </div>
              <p className="text-lg font-bold text-white capitalize truncate">{tournament.format.replace('_', ' ')}</p>
            </div>

            {/* Platform */}
            <div className="bg-zinc-900/30 rounded-xl p-4 border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-medium">
                <Laptop className="w-4 h-4" />
                <span>Platform</span>
              </div>
              <p className="text-lg font-bold text-white capitalize truncate">{tournament.platform || "Any"}</p>
            </div>

            {/* Region */}
            <div className="bg-zinc-900/30 rounded-xl p-4 border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-medium">
                <MapPin className="w-4 h-4" />
                <span>Region</span>
              </div>
              <p className="text-lg font-bold text-white capitalize truncate">{tournament.region || "Global"}</p>
            </div>
          </div>

          {/* Join Button */}
          <Button
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl text-lg shadow-lg shadow-blue-900/20"
          >
            Register Now
          </Button>
        </div>
      </div>
    </div>
  );
}
