import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ChannelMessage } from "@shared/schema";

interface AnnouncementsChannelProps {
  channelId: string;
}

export default function AnnouncementsChannel({ channelId }: AnnouncementsChannelProps) {
  const { data: messages = [], isLoading } = useQuery<ChannelMessage[]>({
    queryKey: [`/api/channels/${channelId}/messages`],
    enabled: !!channelId,
  });

  // Sort messages by date (newest first)
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Server Announcements</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : sortedMessages.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No announcements yet. Check back later!
            </p>
          </CardContent>
        </Card>
      ) : (
        sortedMessages.map((message) => (
          <Card key={message.id} data-testid={`announcement-${message.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-base">{message.message}</CardTitle>
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
