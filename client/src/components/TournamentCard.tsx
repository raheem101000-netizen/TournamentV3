import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, CheckCircle2, Clock, Calendar } from "lucide-react";
import type { Tournament } from "@shared/schema";

interface TournamentCardProps {
  tournament: Tournament & {
    totalMatches?: number;
    completedMatches?: number;
  };
  onView: (id: string) => void;
}

export default function TournamentCard({ tournament, onView }: TournamentCardProps) {
  const formatLabels = {
    round_robin: "Round Robin",
    single_elimination: "Single Elimination",
    swiss: "Swiss System",
  };

  const statusColors = {
    upcoming: "bg-muted text-muted-foreground",
    in_progress: "bg-primary/10 text-primary border-primary/20",
    completed: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  };

  const statusIcons = {
    upcoming: Clock,
    in_progress: Trophy,
    completed: CheckCircle2,
  };

  const StatusIcon = statusIcons[tournament.status];
  const completionPercentage = tournament.totalMatches 
    ? Math.round((tournament.completedMatches || 0) / tournament.totalMatches * 100) 
    : 0;

  return (
    <Card className="hover-elevate">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-lg truncate" data-testid={`text-tournament-name-${tournament.id}`}>
            {tournament.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors[tournament.status]} data-testid={`badge-status-${tournament.id}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {tournament.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-4">
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="font-medium" data-testid={`badge-format-${tournament.id}`}>
            {formatLabels[tournament.format]}
          </Badge>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{tournament.totalTeams === -1 ? "Unlimited" : tournament.totalTeams} teams</span>
          </div>
        </div>

        {tournament.totalMatches && tournament.totalMatches > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{tournament.completedMatches || 0} completed</span>
              <span>{tournament.totalMatches} total matches</span>
            </div>
          </div>
        )}

        {tournament.format === "swiss" && tournament.swissRounds && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{tournament.swissRounds} rounds</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          className="w-full" 
          onClick={() => onView(tournament.id)}
          data-testid={`button-view-${tournament.id}`}
        >
          View Tournament
        </Button>
      </CardFooter>
    </Card>
  );
}
