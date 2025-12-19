import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Users, Calendar } from "lucide-react";

export default function MobilePreviewAccount() {
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex flex-col items-center mb-6">
        <Avatar className="h-20 w-20 mb-3" data-testid="user-avatar">
          <AvatarFallback className="text-xl bg-primary text-primary-foreground">
            DU
          </AvatarFallback>
        </Avatar>
        <h1 className="text-xl font-bold" data-testid="username">Demo User</h1>
        <p className="text-sm text-muted-foreground" data-testid="user-email">demo@example.com</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card data-testid="stat-tournaments">
          <CardContent className="p-6 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">12</p>
            <p className="text-sm text-muted-foreground">Tournaments</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-wins">
          <CardContent className="p-6 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">8</p>
            <p className="text-sm text-muted-foreground">Wins</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-teams">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">3</p>
            <p className="text-sm text-muted-foreground">Teams</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-recent-activity">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    </div>
  );
}
