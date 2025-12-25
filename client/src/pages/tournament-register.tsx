import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, Clock, Users, Trophy, Monitor, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Tournament, Server } from "@shared/schema";
import TournamentRegistrationForm from "@/components/TournamentRegistrationForm";
import { format } from "date-fns";

export default function TournamentRegister() {
  const [match, params] = useRoute("/tournament/:id/register");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const tournamentId = params?.id;

  const { data: tournament, isLoading } = useQuery<Tournament>({
    queryKey: [`/api/tournaments/${tournamentId}`],
    enabled: !!tournamentId,
  });

  const { data: server } = useQuery<Server>({
    queryKey: [`/api/servers/${tournament?.serverId}`],
    enabled: !!tournament?.serverId,
  });

  if (!match) return null;

  if (!user) {
    return (
      <div className="container max-w-lg mx-auto p-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-muted-foreground">You must be logged in to register for a tournament.</p>
            <Button onClick={() => setLocation("/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-lg mx-auto p-4 py-8">
        <p className="text-muted-foreground text-center">Loading tournament...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container max-w-lg mx-auto p-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-muted-foreground">Tournament not found.</p>
            <Button onClick={() => setLocation("/")}>Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background pb-20">
      <div className="container max-w-lg mx-auto px-4 pt-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display">{tournament.name}</h1>
            <p className="text-sm text-muted-foreground">{tournament.game}</p>
          </div>
        </div>

        {/* Tournament Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tournament Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tournament.imageUrl && (
              <img
                src={tournament.imageUrl}
                alt={tournament.name}
                className="w-full h-40 object-cover rounded-md"
              />
            )}

            {/* Server/Host Info */}
            {server && (
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  {server.iconUrl && <AvatarImage src={server.iconUrl} alt={server.name} />}
                  <AvatarFallback className="text-2xl">{server.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{server.name}</p>
                  <p className="text-sm text-muted-foreground">Tournament Host</p>
                </div>
              </div>
            )}

            {/* Prize Pool & Entry Fee */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Prize Pool</p>
                <p className="text-xl font-bold text-green-600">{tournament.prizeReward || "No Prize"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Entry Fee</p>
                <p className="text-xl font-bold">{tournament.entryFee || "Free"}</p>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Start Time</span>
                </div>
                <span className="font-semibold text-sm">
                  {tournament.startDate ? format(new Date(tournament.startDate), "MMM d, yyyy • h:mm a") : "TBD"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Teams/Players</span>
                </div>
                <span className="font-semibold text-sm">
                  {tournament.totalTeams === -1 ? "Unlimited" : `${tournament.totalTeams} max`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm">Format</span>
                </div>
                <span className="font-semibold text-sm capitalize">{tournament.format.replace("_", " ")}</span>
              </div>

              {tournament.platform && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Monitor className="w-4 h-4" />
                    <span className="text-sm">Platform</span>
                  </div>
                  <span className="font-semibold text-sm">{tournament.platform}</span>
                </div>
              )}

              {tournament.region && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Region</span>
                  </div>
                  <span className="font-semibold text-sm">{tournament.region}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        {((tournament.paymentMethod && tournament.paymentMethod !== "none") || tournament.paymentLink) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Information</CardTitle>
              <CardDescription>Details for paying your entry fee</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tournament.paymentMethod && tournament.paymentMethod !== "none" && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                  <p className="font-semibold capitalize">{tournament.paymentMethod.replace("_", " ")}</p>
                </div>
              )}
              {tournament.paymentLink && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Link</p>
                  <a
                    href={tournament.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium break-all"
                    data-testid="link-payment"
                  >
                    {tournament.paymentLink}
                  </a>
                </div>
              )}
              {tournament.paymentInstructions && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Instructions</p>
                  <p className="text-sm">{tournament.paymentInstructions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Registration Form */}
        {tournamentId && (
          <TournamentRegistrationForm
            tournamentId={tournamentId}
            tournamentName={tournament.name}
            onRegistrationSuccess={() => {
              setLocation("/");
            }}
          />
        )}
      </div>
    </div>
  );
}
