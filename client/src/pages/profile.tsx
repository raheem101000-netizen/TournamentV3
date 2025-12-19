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
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">{userProfile.displayName || userProfile.username}</h1>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex gap-4 items-start">
              <Avatar className="w-16 h-16">
                {userProfile.avatarUrl && <AvatarImage src={userProfile.avatarUrl} />}
                <AvatarFallback className="text-xl">
                  {userProfile.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{userProfile.displayName || userProfile.username}</CardTitle>
                <p className="text-sm text-muted-foreground">@{userProfile.username}</p>
                {userProfile.email && (
                  <p className="text-sm text-muted-foreground mt-1">{userProfile.email}</p>
                )}
              </div>
              {!isOwnProfile && (
                <div className="flex gap-2">
                  <Button onClick={handleMessage} data-testid="button-message-user">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button 
                    onClick={handleAddFriend} 
                    disabled={isFriendRequestSent}
                    variant={isFriendRequestSent ? "secondary" : "outline"}
                    data-testid="button-add-friend"
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
          </CardHeader>
          <CardContent className="space-y-4">
            {userProfile.bio && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Bio</h3>
                <p className="text-sm text-foreground">{userProfile.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        {!achievementsLoading && achievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Achievements */}
        {!achievementsLoading && achievements.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No achievements yet</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
