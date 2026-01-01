import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, Upload, X } from "lucide-react";
import type { ChatMessage, Team } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface TeamMember {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
}

interface TeamWithMembers extends Team {
  members?: TeamMember[];
}

interface SubmitScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team1: TeamWithMembers | null;
  team2: TeamWithMembers | null;
  matchId: string;
  onSelectWinner: (winnerId: string) => Promise<void>;
}

export default function SubmitScoreDialog({ 
  open, 
  onOpenChange, 
  team1, 
  team2, 
  matchId,
  onSelectWinner,
}: SubmitScoreDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  if (!team1 || !team2) return null;

  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSelectingWinner, setIsSelectingWinner] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!matchId || !open) return;
    fetch(`/api/matches/${matchId}/messages`)
      .then(r => r.json())
      .then(data => setMessages(Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to fetch messages:", err));
  }, [matchId, open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get display name from team members (first member's username with @ prefix)
  const getTeamDisplayName = (team: TeamWithMembers | null): string => {
    if (team?.members && team.members.length > 0) {
      return `@${team.members[0].username}`;
    }
    return team?.name || "TBD";
  };

  const getTeamInitials = (team: TeamWithMembers | null): string => {
    if (team?.members && team.members.length > 0) {
      const username = team.members[0].username;
      return username.slice(0, 2).toUpperCase();
    }
    if (team?.name) {
      return team.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }
    return "?";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setUploadPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setUploadPreview(null);
      }
    }
  };

  const handleSendMessage = async () => {
    if (isSending || (!messageInput.trim() && !uploadedFile) || !user) return;

    setIsSending(true);
    try {
      let imageUrl: string | undefined = undefined;

      // Handle file upload if present
      if (uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        
        const uploadResponse = await fetch('/api/objects/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.url || uploadResult.fileUrl;
      }

      const response = await fetch(`/api/matches/${matchId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageInput.trim() || null,
          imageUrl: imageUrl || null,
          matchId: matchId,
          teamId: team1.id,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }
      
      const newMessage = await response.json();
      setMessages(prev => [...prev, newMessage]);
      setMessageInput("");
      setUploadedFile(null);
      setUploadPreview(null);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectWinner = async (winnerId: string) => {
    setIsSelectingWinner(true);
    try {
      await onSelectWinner(winnerId);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error selecting winner:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to select winner",
        variant: "destructive",
      });
    } finally {
      setIsSelectingWinner(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl" data-testid="text-match-chat-title">
            Match Chat: {getTeamDisplayName(team1)} vs {getTeamDisplayName(team2)}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-4 hide-scrollbar">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No messages yet. Teams can post updates here.</p>
              ) : (
                messages.map((msg) => {
                  const senderName = msg.senderDisplayName || (msg.userId === user?.id ? (user?.displayName || user?.username || "You") : "Unknown");
                  const isCurrentUser = msg.userId === user?.id;
                  
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                      data-testid={`message-${msg.id}`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {senderName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col gap-1 max-w-md ${isCurrentUser ? 'items-end' : ''}`}>
                        <span className="text-xs text-foreground">{senderName}</span>
                        {msg.imageUrl && (
                          <img 
                            src={msg.imageUrl} 
                            alt="Uploaded file" 
                            className="max-h-48 rounded w-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setEnlargedImageUrl(msg.imageUrl)}
                            onError={(e) => {
                              console.error("Image failed to load:", msg.imageUrl);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        {msg.message && <p className="text-sm break-words text-muted-foreground">{msg.message}</p>}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t pt-3 space-y-2">
            {uploadPreview && (
              <div className="relative">
                <img src={uploadPreview} alt="Preview" className="max-h-32 rounded" />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => {
                    setUploadedFile(null);
                    setUploadPreview(null);
                  }}
                  data-testid="button-remove-upload"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            {uploadedFile && !uploadPreview && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                <span>{uploadedFile.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 ml-auto"
                  onClick={() => {
                    setUploadedFile(null);
                    setUploadPreview(null);
                  }}
                  data-testid="button-remove-upload"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file-upload"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
                data-testid="button-upload-file"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isSending}
                data-testid="input-chat-message"
              />
              <Button 
                size="icon"
                onClick={handleSendMessage}
                disabled={isSending || (!messageInput.trim() && !uploadedFile)}
                data-testid="button-send-message"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4 border-t">
          <Button 
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-chat"
          >
            Close
          </Button>
          <Button 
            onClick={() => handleSelectWinner(team1.id)}
            disabled={isSelectingWinner}
            data-testid="button-team1-wins"
          >
            {isSelectingWinner ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {getTeamDisplayName(team1)} Wins
          </Button>
          <Button 
            onClick={() => handleSelectWinner(team2.id)}
            disabled={isSelectingWinner}
            data-testid="button-team2-wins"
          >
            {isSelectingWinner ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {getTeamDisplayName(team2)} Wins
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={!!enlargedImageUrl} onOpenChange={(open) => !open && setEnlargedImageUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex items-center justify-center p-0 bg-black/95">
          {enlargedImageUrl && (
            <img 
              src={enlargedImageUrl} 
              alt="Enlarged" 
              className="max-w-full max-h-[90vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
