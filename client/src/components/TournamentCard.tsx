import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, CheckCircle2, Clock, Calendar, Bookmark, BookmarkCheck } from "lucide-react";
import type { Tournament } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TournamentCardProps {
  tournament: Tournament & {
    totalMatches?: number;
    completedMatches?: number;
  };
  onView: (id: string) => void;
}

export default function TournamentCard({ tournament, onView }: TournamentCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();

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

  // Check if saved
  const { data: savedStatus } = useQuery<{ saved: boolean }>({
    queryKey: [`/api/tournaments/${tournament.id}/saved`],
    enabled: !!user,
  });

  const saveTournamentMutation = useMutation({
    mutationFn: async (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent opening the tournament
      return apiRequest('POST', `/api/tournaments/${tournament.id}/save`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournament.id}/saved`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/me/saved-tournaments`] }); // Invalidate list
      toast({
        title: "Tournament saved",
        description: "Added to your saved tournaments.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const unsaveTournamentMutation = useMutation({
    mutationFn: async (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent opening the tournament
      return apiRequest('DELETE', `/api/tournaments/${tournament.id}/save`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournament.id}/saved`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/me/saved-tournaments`] }); // Invalidate list
      toast({
        title: "Tournament removed",
        description: "Removed from your saved tournaments.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const StatusIcon = statusIcons[tournament.status];
  const completionPercentage = tournament.totalMatches
    ? Math.round((tournament.completedMatches || 0) / tournament.totalMatches * 100)
    : 0;

  return (
    <Card className="hover-elevate min-h-[280px] flex flex-col group relative">
      {/* Save Button */}
      {user && (
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-background/80 hover:bg-background backdrop-blur-sm shadow-sm"
            onClick={(e) => {
              if (savedStatus?.saved) {
                unsaveTournamentMutation.mutate(e);
              } else {
                saveTournamentMutation.mutate(e);
              }
            }}
            disabled={saveTournamentMutation.isPending || unsaveTournamentMutation.isPending}
          >
            {savedStatus?.saved ? (
              <BookmarkCheck className="h-4 w-4 text-primary fill-current" />
            ) : (
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      )}

      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div className="flex-1 min-w-0 pr-8"> {/* Added padding for save button */}
          <h3 className="font-display font-semibold text-lg truncate" data-testid={`text-tournament-name-${tournament.id}`}>
            {tournament.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Badge moved to prevent overlap or visual clutter, or kept if it fits */}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-4 flex-1">
        <div className="flex items-center gap-2 text-sm justify-between">
          <Badge className={statusColors[tournament.status]} data-testid={`badge-status-${tournament.id}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {tournament.status.replace('_', ' ')}
          </Badge>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{tournament.totalTeams === -1 ? "Unlimited" : tournament.totalTeams} teams</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="font-medium" data-testid={`badge-format-${tournament.id}`}>
            {formatLabels[tournament.format]}
          </Badge>
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
