import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Trophy, X, Clock, Users, Laptop, MapPin, Gamepad2, Ticket, Globe } from "lucide-react";
import type { Tournament as SchemaTournament, Team, Match, Registration } from "@shared/schema";

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

  const { data: registrations = [] } = useQuery<Registration[]>({
    queryKey: [`/api/tournaments/${tournamentId}/registrations`],
    enabled: !!tournamentId,
  });

  // Count approved registrations
  const approvedCount = registrations.filter(r => r.status === "approved").length;
  const submittedCount = registrations.filter(r => r.status === "submitted").length;

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    {
      icon: Users,
      label: "Registered",
      value: `${approvedCount}${tournament.totalTeams ? `/${tournament.totalTeams}` : ""}`,
      color: "text-emerald-400"
    },
    {
      icon: Clock,
      label: "Date",
      value: tournament.startDate
        ? new Date(tournament.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : "TBA",
      color: "text-blue-400"
    },
    {
      icon: Ticket,
      label: "Entry",
      value: tournament.entryFee || "Free",
      color: "text-amber-400"
    },
    {
      icon: Gamepad2,
      label: "Format",
      value: tournament.format?.replace('_', ' ') || "TBD",
      color: "text-purple-400"
    },
    {
      icon: Laptop,
      label: "Platform",
      value: tournament.platform || "Any",
      color: "text-cyan-400"
    },
    {
      icon: Globe,
      label: "Region",
      value: tournament.region || "Global",
      color: "text-rose-400"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black flex items-center justify-center p-4">
      {/* Ambient glow effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]" />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-sm bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative z-10">
        {/* Close Button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-3 right-3 w-8 h-8 text-white/60 hover:text-white hover:bg-white/10 z-20"
          onClick={() => setLocation("/")}
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Hero Image */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={tournament.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${tournament.name}`}
            alt={tournament.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />

          {/* Game Badge */}
          <div className="absolute bottom-3 left-4 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs font-medium text-white/90">
            <Gamepad2 className="w-3 h-3" />
            <span className="uppercase tracking-wider">{tournament.game || "Game"}</span>
          </div>

          {/* Status Badge */}
          <div className="absolute top-3 left-3 px-2 py-0.5 bg-emerald-500/90 rounded-full text-xs font-bold text-white uppercase tracking-wider">
            {tournament.status || "Open"}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Title & Prize */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white leading-tight">{tournament.name}</h1>

            {/* Prize Pool Highlight */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 rounded-lg">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-400">{tournament.prizeReward || "$0"}</span>
              </div>
              {submittedCount > 0 && (
                <span className="text-xs text-white/50">+{submittedCount} pending</span>
              )}
            </div>
          </div>

          {/* Stats Grid - Compact */}
          <div className="grid grid-cols-3 gap-2">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white/5 rounded-lg p-2.5 text-center border border-white/5 hover:border-white/10 transition-colors"
              >
                <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                <p className="text-xs text-white/50 mb-0.5">{stat.label}</p>
                <p className="text-sm font-semibold text-white truncate">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Description (if available) */}
          {tournament.description && (
            <p className="text-sm text-white/60 line-clamp-2">{tournament.description}</p>
          )}

          {/* Register Button */}
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold h-11 rounded-xl shadow-lg shadow-blue-900/30 transition-all hover:shadow-blue-900/50"
            onClick={() => setLocation(`/tournament/${tournamentId}/register`)}
          >
            Register Now
          </Button>
        </div>
      </div>
    </div>
  );
}
