import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Trophy, Medal } from "lucide-react";
import type { Team } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
}

interface TeamWithMembers extends Team {
  members?: TeamMember[];
}

interface StandingsTableProps {
  teams: TeamWithMembers[];
  isEditable?: boolean;
  tournamentId?: string;
}

interface EditableCellProps {
  value: number;
  teamId: string;
  field: 'wins' | 'losses' | 'points';
  isEditable: boolean;
  tournamentId?: string;
}

function EditableCell({ value, teamId, field, isEditable, tournamentId }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const updateStatsMutation = useMutation({
    mutationFn: async (newValue: number) => {
      return apiRequest('PATCH', `/api/teams/${teamId}/stats`, {
        [field]: newValue
      });
    },
    onMutate: async (newValue) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      const queryKey = [`/api/tournaments/${tournamentId}/teams`];
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousTeams = queryClient.getQueryData<TeamWithMembers[]>(queryKey);

      // Optimistically update to the new value
      if (previousTeams) {
        queryClient.setQueryData<TeamWithMembers[]>(queryKey, (old) => {
          if (!old) return [];
          return old.map((team) =>
            team.id === teamId ? { ...team, [field]: newValue } : team
          );
        });
      }

      // Return a context object with the snapshotted value
      return { previousTeams };
    },
    onError: (error: Error, _, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTeams && tournamentId) {
        queryClient.setQueryData([`/api/tournaments/${tournamentId}/teams`], context.previousTeams);
      }
      toast({
        title: "Failed to update stats",
        description: error.message,
        variant: "destructive",
      });
      setCurrentValue(value); // Revert local state
      setIsEditing(false);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server sync
      if (tournamentId) {
        queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/teams`] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      }
      setIsEditing(false);
    }
  });

  if (isEditing) {
    return (
      <Input
        type="number"
        value={currentValue}
        className="w-16 h-8 text-center p-1 mx-auto"
        onChange={(e) => setCurrentValue(parseInt(e.target.value) || 0)}
        onBlur={() => {
          if (currentValue !== value) {
            updateStatsMutation.mutate(currentValue);
          } else {
            setIsEditing(false);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        autoFocus
      />
    );
  }

  return (
    <div
      className={`cursor-${isEditable ? 'pointer hover:bg-muted/50 rounded px-2 py-1' : 'default'}`}
      onClick={() => isEditable && setIsEditing(true)}
      title={isEditable ? "Click to edit" : undefined}
    >
      {value}
    </div>
  );
}

export default function StandingsTable({ teams, isEditable = false, tournamentId }: StandingsTableProps) {
  const sortedTeams = [...teams].sort((a, b) => {
    if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
    if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
    return (a.losses || 0) - (b.losses || 0);
  });

  // Get display name from team members (first member's username with @ prefix)
  const getTeamDisplayName = (team: TeamWithMembers): string => {
    if (team.members && team.members.length > 0) {
      return `@${team.members[0].username}`;
    }
    return team.name;
  };

  const getTeamInitials = (team: TeamWithMembers): string => {
    if (team.members && team.members.length > 0) {
      const username = team.members[0].username;
      return username.slice(0, 2).toUpperCase();
    }
    return team.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTeamAvatar = (team: TeamWithMembers): string | null => {
    if (team.members && team.members.length > 0) {
      return team.members[0].avatarUrl || null;
    }
    return null;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-400" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-orange-600" />;
    return null;
  };

  return (
    <>
      {/* Desktop View - Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-center">Wins</TableHead>
              <TableHead className="text-center">Losses</TableHead>
              <TableHead className="text-center">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTeams.map((team, index) => (
              <TableRow key={team.id} data-testid={`row-team-${team.id}`}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getRankIcon(index + 1)}
                    <span>{index + 1}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {getTeamAvatar(team) && (
                        <AvatarImage src={getTeamAvatar(team)!} alt={getTeamDisplayName(team)} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getTeamInitials(team)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-display font-medium" data-testid={`text-team-name-${team.id}`}>
                      {getTeamDisplayName(team)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-semibold text-chart-2">
                  <EditableCell
                    value={team.wins || 0}
                    teamId={team.id}
                    field="wins"
                    isEditable={isEditable}
                    tournamentId={tournamentId}
                  />
                </TableCell>
                <TableCell className="text-center font-semibold text-destructive">
                  <EditableCell
                    value={team.losses || 0}
                    teamId={team.id}
                    field="losses"
                    isEditable={isEditable}
                    tournamentId={tournamentId}
                  />
                </TableCell>
                <TableCell className="text-center font-bold text-lg">
                  <EditableCell
                    value={team.points || 0}
                    teamId={team.id}
                    field="points"
                    isEditable={isEditable}
                    tournamentId={tournamentId}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-3">
        {sortedTeams.map((team, index) => (
          <div
            key={team.id}
            className="flex items-center p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
            data-testid={`card-team-${team.id}`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 flex items-center justify-center w-8 text-muted-foreground font-bold">
                {getRankIcon(index + 1) || `#${index + 1}`}
              </div>

              <Avatar className="h-10 w-10 flex-shrink-0">
                {getTeamAvatar(team) && (
                  <AvatarImage src={getTeamAvatar(team)!} alt={getTeamDisplayName(team)} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getTeamInitials(team)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold truncate text-base">
                  {getTeamDisplayName(team)}
                </div>
                <div className="flex items-center gap-3 text-sm mt-1">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">W:</span>
                    <span className="font-semibold text-green-500">
                      <EditableCell
                        value={team.wins || 0}
                        teamId={team.id}
                        field="wins"
                        isEditable={isEditable}
                        tournamentId={tournamentId}
                      />
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">L:</span>
                    <span className="font-semibold text-red-500">
                      <EditableCell
                        value={team.losses || 0}
                        teamId={team.id}
                        field="losses"
                        isEditable={isEditable}
                        tournamentId={tournamentId}
                      />
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-muted-foreground font-medium">Pts:</span>
                    <span className="font-bold text-foreground">
                      <EditableCell
                        value={team.points || 0}
                        teamId={team.id}
                        field="points"
                        isEditable={isEditable}
                        tournamentId={tournamentId}
                      />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
