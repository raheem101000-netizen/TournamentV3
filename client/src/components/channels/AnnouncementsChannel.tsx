import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Loader2, Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ChannelMessage } from "@shared/schema";

interface AnnouncementsChannelProps {
  channelId: string;
  canPost?: boolean;
}

export default function AnnouncementsChannel({ channelId, canPost = false }: AnnouncementsChannelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newAnnouncement, setNewAnnouncement] = useState("");

  const { data: messages = [], isLoading } = useQuery<ChannelMessage[]>({
    queryKey: [`/api/channels/${channelId}/messages`],
    enabled: !!channelId,
  });

  const postAnnouncementMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/channels/${channelId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to post announcement");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/channels/${channelId}/messages`] });
      setNewAnnouncement("");
      toast({
        title: "Announcement posted",
        description: "Your announcement has been published.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to post",
        description: error instanceof Error ? error.message : "Try again",
        variant: "destructive",
      });
    },
  });

  const handlePost = () => {
    const trimmed = newAnnouncement.trim();
    if (!trimmed) return;
    postAnnouncementMutation.mutate(trimmed);
  };

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Server Announcements</h2>
      </div>

      {canPost && (
        <Card className="mb-4" data-testid="card-new-announcement">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Post New Announcement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Write your announcement..."
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
              className="min-h-[100px]"
              data-testid="input-announcement"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handlePost}
                disabled={!newAnnouncement.trim() || postAnnouncementMutation.isPending}
                data-testid="button-post-announcement"
              >
                {postAnnouncementMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Post Announcement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : sortedMessages.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No announcements yet. {canPost ? "Post one above!" : "Check back later!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        sortedMessages.map((message) => (
          <Card key={message.id} data-testid={`announcement-${message.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base whitespace-pre-wrap break-words">{message.message}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Posted by {message.username} on {new Date(message.createdAt || Date.now()).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Announcement
                </Badge>
              </div>
            </CardHeader>
            {message.imageUrl && (
              <CardContent>
                <img 
                  src={message.imageUrl} 
                  alt="Announcement" 
                  className="rounded-md max-w-full h-auto"
                />
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
