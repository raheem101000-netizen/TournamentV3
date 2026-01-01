import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { MessageSquare, Send, X, Image as ImageIcon, Paperclip, Loader2, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ChannelMessage } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import UserProfileModal from "@/components/UserProfileModal";

interface ChatChannelProps {
  channelId: string;
  isPreview?: boolean;
}

function renderMessageWithLinks(text: string): JSX.Element {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return (
    <>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          urlRegex.lastIndex = 0;
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

export default function ChatChannel({ channelId, isPreview = false }: ChatChannelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [stagedImage, setStagedImage] = useState<{ file: File; preview: string } | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChannelMessage | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<ChannelMessage | null>(null);
  const [longPressMessageId, setLongPressMessageId] = useState<string | null>(null);
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Fetch messages from API with polling for real-time updates
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery<ChannelMessage[]>({
    queryKey: ["/api/channels", channelId, "messages"],
    queryFn: async () => {
      const response = await fetch(`/api/channels/${channelId}/messages?limit=500`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return response.json();
    },
    enabled: !!channelId,
    refetchInterval: 3000,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // Refetch messages when channelId changes
  useEffect(() => {
    if (channelId) {
      refetchMessages();
    }
  }, [channelId, refetchMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // REST API mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string; imageUrl: string | null }) => {
      const response = await fetch(`/api/channels/${channelId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
        credentials: "include",
      });
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          throw new Error("Session expired. Please refresh the page and log in again.");
        }
        throw new Error(errorText || `Failed to send message (${response.status})`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels", channelId, "messages"] });
      setMessageInput("");
      setStagedImage(null);
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Try again",
        variant: "destructive",
      });
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) => {
      const response = await apiRequest("PATCH", `/api/messages/${id}`, { message });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels", channelId, "messages"] });
      setEditingMessage(null);
      setEditText("");
      toast({ title: "Message updated" });
    },
    onError: (error) => {
      console.error("Error editing message:", error);
      toast({ title: "Failed to edit message", variant: "destructive" });
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/messages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels", channelId, "messages"] });
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
      toast({ title: "Message deleted" });
    },
    onError: (error) => {
      console.error("Error deleting message:", error);
      toast({ title: "Failed to delete message", variant: "destructive" });
    },
  });

  const handleEditMessage = (message: ChannelMessage) => {
    setEditingMessage(message);
    setEditText(message.message || "");
  };

  const handleSaveEdit = () => {
    if (editingMessage && editText.trim()) {
      editMessageMutation.mutate({ id: editingMessage.id, message: editText.trim() });
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText("");
  };

  const handleDeleteMessage = (message: ChannelMessage) => {
    setMessageToDelete(message);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (messageToDelete) {
      deleteMessageMutation.mutate(messageToDelete.id);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() && !stagedImage) return;

    let imageUrl: string | null = null;

    if (stagedImage) {
      setIsUploadingImage(true);
      try {
        const formData = new FormData();
        formData.append('file', stagedImage.file);
        
        const uploadResponse = await fetch('/api/objects/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url || uploadData.fileUrl;
      } catch (error) {
        console.error("Image upload error:", error);
        toast({
          title: "Upload Failed",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
        setIsUploadingImage(false);
        return;
      }
      setIsUploadingImage(false);
    }

    sendMessageMutation.mutate({
      message: messageInput.trim(),
      imageUrl: imageUrl,
    });

    setStagedImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const clearLongPressMenu = () => {
    setLongPressMessageId(null);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast({
        title: "File upload feature coming soon",
        description: "File uploads will be available in a future update",
      });
    }
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const previewUrl = URL.createObjectURL(file);
    setStagedImage({ file, preview: previewUrl });
  };

  const clearStagedImage = () => {
    if (stagedImage) {
      URL.revokeObjectURL(stagedImage.preview);
      setStagedImage(null);
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b">
        <MessageSquare className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Chat</h2>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 pt-2">
            {messagesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const initials = message.username?.substring(0, 2).toUpperCase() || 'U';
                const isOwnMessage = message.userId === user?.id;
                const isEditing = editingMessage?.id === message.id;
                const senderName = message.username || 'Unknown User';
                const timestamp = new Date(message.createdAt || Date.now()).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });

                return (
                  <div 
                    key={message.id} 
                    className={`group relative flex gap-3 p-2 -m-2 rounded-md cursor-pointer ${longPressMessageId === message.id ? 'bg-muted' : ''}`}
                    data-testid={`message-${message.id}`}
                    onClick={() => {
                      if (isPreview || isEditing) return;
                      setLongPressMessageId(longPressMessageId === message.id ? null : message.id);
                    }}
                  >
                    {message.userId ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProfileId(message.userId);
                          setProfileModalOpen(true);
                        }}
                        className="p-0 border-0 bg-transparent cursor-pointer"
                        data-testid={`button-avatar-${message.id}`}
                      >
                        <Avatar className="h-8 w-8 cursor-pointer hover-elevate">
                          <AvatarImage src={(message as any).avatarUrl || ""} alt={senderName} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    ) : (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={(message as any).avatarUrl || ""} alt={senderName} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {/* Message action menu */}
                    {!isPreview && !isEditing && isOwnMessage && longPressMessageId === message.id && (
                      <div className="absolute right-2 top-2 flex flex-col gap-1 bg-card border rounded-md shadow-md p-1 z-10">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 justify-start gap-2"
                          onClick={(e) => { e.stopPropagation(); clearLongPressMenu(); handleEditMessage(message); }}
                          data-testid={`button-edit-message-${message.id}`}
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 justify-start gap-2 text-destructive"
                          onClick={(e) => { e.stopPropagation(); clearLongPressMenu(); handleDeleteMessage(message); }}
                          data-testid={`button-delete-message-${message.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    )}
                    <div className="flex flex-col gap-1 max-w-[70%]">
                      <div className="flex items-center gap-2">
                        {message.userId ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProfileId(message.userId);
                              setProfileModalOpen(true);
                            }}
                            className="text-xs text-muted-foreground hover:underline cursor-pointer p-0 border-0 bg-transparent text-left"
                            data-testid={`user-link-${message.id}`}
                          >
                            {senderName}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {senderName}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">{timestamp}</span>
                      </div>
                      {(message as any).imageUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEnlargedImageUrl((message as any).imageUrl);
                          }}
                          className="p-0 border-0 bg-transparent cursor-pointer hover-elevate rounded-md overflow-visible block"
                          data-testid={`button-img-message-${message.id}`}
                        >
                          <OptimizedImage 
                            src={(message as any).imageUrl} 
                            alt="Shared image" 
                            className="max-w-full h-auto max-h-60 rounded-md"
                            thumbnailSize="lg"
                          />
                        </button>
                      )}
                      {isEditing ? (
                        <div className="flex gap-2 w-full">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                            data-testid="input-edit-message"
                          />
                          <Button size="icon" onClick={handleSaveEdit} disabled={editMessageMutation.isPending} data-testid="button-save-edit">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={handleCancelEdit} data-testid="button-cancel-edit">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : message.message ? (
                        <p className="text-sm text-foreground whitespace-pre-wrap">{renderMessageWithLinks(message.message)}</p>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      <Card className="mt-4">
        <CardContent className="p-3">
          {stagedImage && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-md">
              <img 
                src={stagedImage.preview} 
                alt="Staged" 
                className="h-16 w-16 object-cover rounded-md"
              />
              <div className="flex-1 text-sm text-muted-foreground">
                Image ready to send
              </div>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={clearStagedImage}
                data-testid="button-clear-staged-image"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          {isPreview ? (
            <div className="w-full p-2 bg-muted rounded-md text-center text-sm text-muted-foreground">
              Join the server to send messages
            </div>
          ) : (
            <form className="flex gap-2" onSubmit={handleSendMessage}>
              <Button 
                size="icon" 
                variant="ghost"
                type="button"
                onClick={handleFileUpload}
                data-testid="button-attach-file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost"
                type="button"
                onClick={handleImageUpload}
                disabled={isUploadingImage}
                data-testid="button-attach-image"
              >
                {isUploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
              </Button>
              <Input
                placeholder="Type a message..."
                className="flex-1"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                data-testid="input-chat-message"
              />
              <Button size="icon" type="submit" data-testid="button-send-message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelected}
            data-testid="input-file-upload"
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelected}
            data-testid="input-image-upload"
          />
        </CardContent>
      </Card>

      {/* Image enlargement dialog */}
      <Dialog open={!!enlargedImageUrl} onOpenChange={() => setEnlargedImageUrl(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          {enlargedImageUrl && (
            <img 
              src={enlargedImageUrl} 
              alt="Enlarged" 
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Profile Modal */}
      <UserProfileModal
        userId={selectedProfileId}
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
    </div>
  );
}
