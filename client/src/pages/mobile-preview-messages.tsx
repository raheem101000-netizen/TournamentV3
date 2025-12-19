import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import type { MessageThread } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function MobilePreviewMessages() {
  const { data: messages, isLoading } = useQuery<MessageThread[]>({
    queryKey: ["/api/mobile-preview/messages"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4" data-testid="page-title">Messages</h1>
      <p className="text-sm text-muted-foreground mb-6" data-testid="page-description">
        Your recent conversations
      </p>
      
      <div className="space-y-3">
        {messages?.map((thread) => (
          <Card 
            key={thread.id} 
            className="hover-elevate cursor-pointer"
            data-testid={`message-thread-${thread.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar data-testid={`avatar-${thread.id}`}>
                  <AvatarFallback>{thread.participantName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate" data-testid={`participant-name-${thread.id}`}>
                      {thread.participantName}
                    </h3>
                    <span className="text-xs text-muted-foreground" data-testid={`timestamp-${thread.id}`}>
                      {thread.lastMessageTime ? formatDistanceToNow(new Date(thread.lastMessageTime), { addSuffix: true }) : 'Just now'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate" data-testid={`last-message-${thread.id}`}>
                      {thread.lastMessage}
                    </p>
                    {thread.unreadCount != null && thread.unreadCount > 0 && (
                      <span 
                        className="ml-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium"
                        data-testid={`unread-count-${thread.id}`}
                      >
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!messages || messages.length === 0 && (
        <div className="text-center py-12" data-testid="no-messages-message">
          <p className="text-muted-foreground">No messages yet</p>
        </div>
      )}
    </div>
  );
}
