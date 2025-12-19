import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserProfileModal from "./UserProfileModal";
import type { ChatMessage } from "@shared/schema";

interface MatchChatContentProps {
  matchId: string;
}

export default function MatchChatContent({ matchId }: MatchChatContentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { data: initialMessages } = useQuery<ChatMessage[]>({
    queryKey: [`/api/matches/${matchId}/messages`],
    enabled: !!matchId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      return await apiRequest("POST", `/api/matches/${matchId}/messages`, {
        message: text,
        userId: user?.id,
      });
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${matchId}/messages`] });
    },
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (messageText.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(messageText);
    }
  };

  const openUserProfile = (userId: string | null | undefined) => {
    if (userId) {
      setSelectedProfileId(userId);
      setProfileModalOpen(true);
    }
  };

  if (!messages || messages.length === 0) {
    return (
      <Card className="flex items-center justify-center h-full p-8">
        <p className="text-center text-muted-foreground">
          No messages yet. Start the conversation!
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map((message) => {
          const initials = (message as any).displayName?.charAt(0).toUpperCase() || 
                          (message as any).username?.charAt(0).toUpperCase() || 
                          message.message?.charAt(0).toUpperCase() || "?";
          const timestamp = new Date(message.createdAt).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          const senderName = (message as any).displayName || (message as any).username || "Team";

          return (
            <div key={message.id} className="flex gap-2">
              {message.userId ? (
                <button
                  onClick={() => openUserProfile(message.userId)}
                  className="p-0 border-0 bg-transparent cursor-pointer"
                  data-testid={`button-avatar-${message.id}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0 cursor-pointer hover-elevate">
                    {(message as any).avatarUrl && (
                      <AvatarImage src={(message as any).avatarUrl} alt={senderName} />
                    )}
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              ) : (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {(message as any).avatarUrl && (
                    <AvatarImage src={(message as any).avatarUrl} alt={senderName} />
                  )}
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  {message.userId ? (
                    <button
                      onClick={() => openUserProfile(message.userId)}
                      className="text-sm font-semibold hover:underline cursor-pointer p-0 border-0 bg-transparent text-left"
                      data-testid={`user-link-${message.id}`}
                    >
                      {senderName}
                    </button>
                  ) : (
                    <span className="text-sm font-semibold">{senderName}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{timestamp}</span>
                </div>
                <p className="text-sm mt-0.5">{message.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t pt-3 flex gap-2">
        <Input
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={sendMessageMutation.isPending}
          data-testid="input-match-message"
        />
        <Button
          size="icon"
          onClick={handleSendMessage}
          disabled={!messageText.trim() || sendMessageMutation.isPending}
          data-testid="button-send-message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      <UserProfileModal 
        userId={selectedProfileId} 
        open={profileModalOpen} 
        onOpenChange={setProfileModalOpen} 
      />
    </div>
  );
}
