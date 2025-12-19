import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, AlertCircle, Image as ImageIcon, X } from "lucide-react";
import type { ChatMessage, Team } from "@shared/schema";

interface MatchChatPanelProps {
  messages: (ChatMessage & { imageUrl?: string; displayName?: string; avatarUrl?: string })[];
  teams: Team[];
  currentTeamId?: string;
  onSendMessage: (message: string, image?: File) => void;
}

export default function MatchChatPanel({ 
  messages, 
  teams, 
  currentTeamId, 
  onSendMessage 
}: MatchChatPanelProps) {
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ').filter((p: string) => p);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    if (input.trim() || selectedImage) {
      onSendMessage(input.trim(), selectedImage || undefined);
      setInput("");
      handleRemoveImage();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="font-display flex items-center gap-2">
          Match Chat
          <Badge variant="outline" className="font-normal">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-0 px-6 pb-6">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((msg) => {
              const isSystem = msg.isSystem === 1;
              const senderName = (msg as any).displayName?.trim() || "Unknown";
              const isCurrentTeam = msg.teamId === currentTeamId;

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <Badge variant="outline" className="gap-2 py-1">
                      <AlertCircle className="w-3 h-3" />
                      {msg.message}
                    </Badge>
                  </div>
                );
              }

              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 ${isCurrentTeam ? 'flex-row-reverse' : ''}`}
                  data-testid={`message-${msg.id}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(senderName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col gap-1 max-w-[70%] ${isCurrentTeam ? 'items-end' : ''}`}>
                    <span className="text-xs text-muted-foreground">
                      {senderName}
                    </span>
                    <div 
                      className={`rounded-md overflow-hidden ${
                        isCurrentTeam 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                    >
                      {msg.imageUrl && (
                        <img 
                          src={msg.imageUrl} 
                          alt="Shared image" 
                          className="max-w-full h-auto max-h-60 object-contain"
                        />
                      )}
                      {msg.message && (
                        <p className="text-sm px-3 py-2">{msg.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="space-y-2">
          {imagePreview && (
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-32 rounded-md border"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={handleRemoveImage}
                data-testid="button-remove-image"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageSelect}
              data-testid="input-file-upload"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-upload-image"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Input
              placeholder="Type a message or attach an image..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              data-testid="input-chat-message"
            />
            <Button 
              size="icon" 
              onClick={handleSend}
              disabled={!input.trim() && !selectedImage}
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
