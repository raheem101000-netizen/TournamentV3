import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal } from "lucide-react";
import type { Team } from "@shared/schema";

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
}

export default function StandingsTable({ teams }: StandingsTableProps) {
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
    <div className="rounded-md border">
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
                {team.wins}
              </TableCell>
              <TableCell className="text-center font-semibold text-destructive">
                {team.losses}
              </TableCell>
              <TableCell className="text-center font-bold text-lg">
                {team.points}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
