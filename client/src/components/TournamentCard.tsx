import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, CheckCircle2, Clock, Calendar, Bookmark, BookmarkCheck } from "lucide-react";
import type { Tournament } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface TournamentCardProps {
  tournament: Tournament & {
    totalMatches?: number;
    completedMatches?: number;
  };
  onView: (id: string) => void;
  compact?: boolean;
}

export default function TournamentCard({ tournament, onView, compact }: TournamentCardProps) {
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
    <Card variant="glass" className={`hover-elevate flex flex-col group relative overflow-hidden ${compact ? 'min-h-0' : 'min-h-[320px]'}`}>
      {/* Save Button */}
      {user && (
        <div className={`absolute ${compact ? 'top-1 right-1' : 'top-2 right-2'} z-20`}>
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full bg-background/80 hover:bg-background backdrop-blur-sm shadow-sm ${compact ? 'h-6 w-6' : 'h-8 w-8'}`}
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
              <BookmarkCheck className={`text-primary fill-current ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
            ) : (
              <Bookmark className={`text-muted-foreground ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
            )}
          </Button>
        </div>
      )}

      {/* Hero Image Section */}
      <div className={`${compact ? 'h-20' : 'h-32'} w-full relative bg-muted shrink-0`}>
        {tournament.imageUrl ? (
          <OptimizedImage
            src={tournament.imageUrl}
            alt={tournament.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            <Trophy className={`text-muted-foreground/20 ${compact ? 'h-6 w-6' : 'h-10 w-10'}`} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <CardContent className={`flex-1 relative ${compact ? 'space-y-1.5 p-2 -mt-4' : 'space-y-3 p-4 -mt-6'}`}>
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className={compact ? 'space-y-0.5 min-w-0' : 'space-y-1'}>
            <h3 className={`font-display font-semibold truncate ${compact ? 'text-xs pr-4' : 'text-lg pr-8'}`} data-testid={`text-tournament-name-${tournament.id}`}>
              {tournament.name}
            </h3>
            <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
              <Badge variant={tournament.status === 'upcoming' ? 'secondary' : 'default'} className={`uppercase tracking-wider ${compact ? 'text-[9px] h-4 px-1' : 'text-xs h-5'}`}>
                {tournament.status.replace('_', ' ')}
              </Badge>
              {!compact && (
                <Badge variant="outline" className="text-xs text-muted-foreground h-5 border-white/10">
                  {formatLabels[tournament.format] === "Swiss System" ? "Swiss" : "Elimination"}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Metadata */}
        {compact ? (
          <p className="text-[10px] text-muted-foreground truncate">{tournament.game || "Unspecified Game"}</p>
        ) : (
          <div className="space-y-1 pt-1">
            <p className="text-sm font-medium text-foreground">{tournament.game || "Unspecified Game"}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">• {tournament.platform || "Platform TBA"}</span>
              <span className="flex items-center gap-1">• {tournament.region || "Region TBA"}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">Entry Fee: <span className="text-foreground font-medium">{tournament.entryFee || "Free"}</span></p>
          </div>
        )}

      </CardContent>
      <CardFooter className={compact ? 'p-2 pt-0' : 'p-4 pt-0'}>
        <Button
          className={`w-full font-medium ${compact ? 'h-7 text-[10px]' : 'h-10 text-sm'}`}
          onClick={() => onView(tournament.id)}
          data-testid={`button-view-${tournament.id}`}
        >
          {compact ? 'View' : 'View Tournament'}
        </Button>
      </CardFooter>
    </Card>
  );
}
