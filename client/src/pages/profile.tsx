import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, MessageSquare, UserPlus, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}

interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  icon: string;
  serverId: string;
  createdAt: string;
}

export default function Profile() {
  const [match, params] = useRoute("/profile/:userId");
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const userId = params?.userId;
  const [isFriendRequestSent, setIsFriendRequestSent] = useState(false);

  const handleMessage = async () => {
    if (!userProfile) return;

    try {
      // Create or get message thread
      const response = await fetch("/api/message-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName: userProfile.displayName || userProfile.username,
          participantAvatar: userProfile.avatarUrl,
        }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to create message thread");
      const thread = await response.json();

      // Navigate to messages with this thread selected
      setLocation(`/messages?threadId=${thread.id}`);
      toast({
        title: "Opening message thread",
        description: `Chat with ${userProfile.displayName || userProfile.username}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open message thread",
        variant: "destructive",
      });
    }
  };

  const handleAddFriend = async () => {
    if (!userProfile || !currentUser) return;

    try {
      const response = await fetch("/api/friend-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: userProfile.id,
        }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to send friend request");

      setIsFriendRequestSent(true);
      toast({
        title: "Friend request sent!",
        description: `Request sent to ${userProfile.displayName || userProfile.username}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  // Fetch user profile
  const { data: userProfile, isLoading: userLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Fetch user achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: [`/api/users/${userId}/achievements`],
    enabled: !!userId,
  });

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="flex flex-col min-h-screen bg-background animate-fade-in">
      {/* Hero Header with Glassmorphism */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 via-primary/10 to-background">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)] pointer-events-none" />

        <header className="sticky top-0 z-40">
          <div className="container max-w-5xl mx-auto px-4 py-4">
            <Button
              size="icon"
              className="glass hover:bg-white/10 text-foreground rounded-full"
              onClick={() => setLocation("/")}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
        </header>
      </div>

      {/* Profile Content */}
      <main className="flex-1 container max-w-5xl mx-auto px-4 -mt-20 md:-mt-24 pb-12 space-y-8 relative z-10">
        {/* Profile Card */}
        <div className="glass-heavy rounded-xl p-6 md:p-8 animate-slide-up">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-2xl ring-4 ring-primary/10">
              {userProfile.avatarUrl && <AvatarImage src={userProfile.avatarUrl} className="object-cover" />}
              <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                {userProfile.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2 mb-2">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{userProfile.displayName || userProfile.username}</h1>
                <Badge variant="secondary" className="w-fit glass border-primary/20 text-primary">
                  @{userProfile.username}
                </Badge>
              </div>

              {userProfile.email && (
                <p className="text-muted-foreground">{userProfile.email}</p>
              )}

              {userProfile.bio && (
                <p className="text-foreground/80 max-w-2xl mt-4 leading-relaxed">{userProfile.bio}</p>
              )}
            </div>

            {!isOwnProfile && (
              <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                <Button onClick={handleMessage} className="flex-1 md:flex-none shadow-lg shadow-primary/20 transition-all hover:scale-105">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button
                  onClick={handleAddFriend}
                  disabled={isFriendRequestSent}
                  variant={isFriendRequestSent ? "secondary" : "outline"}
                  className="flex-1 md:flex-none glass border-primary/20 hover:bg-primary/5"
                >
                  {isFriendRequestSent ? (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Requested
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up [animation-delay:100ms]">
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-primary mb-1">1</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Level</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-primary mb-1">0</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Wins</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-primary mb-1">0</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Tournaments</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-primary mb-1">#1</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Rank</div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="space-y-4 animate-slide-up [animation-delay:200ms]">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Achievements
            {achievements.length > 0 && <Badge variant="outline" className="ml-2 glass">{achievements.length}</Badge>}
          </h2>

          {!achievementsLoading && achievements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="glass-card p-4 rounded-xl flex items-start gap-4 hover:border-primary/50 group">
                  <div className="text-3xl p-3 bg-secondary/50 rounded-lg group-hover:bg-primary/10 transition-colors">
                    {achievement.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">{achievement.title}</h4>
                    <p className="text-xs text-muted-foreground leading-snug">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="glass border-dashed border-2">
              <CardContent className="py-12 text-center">
                <div className="text-4xl mb-4 opacity-20">🏆</div>
                <p className="text-muted-foreground font-medium">No achievements yet</p>
                <p className="text-xs text-muted-foreground mt-1">Join tournaments to earn trophies!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
