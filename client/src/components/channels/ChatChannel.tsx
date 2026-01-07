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

import { motion, AnimatePresence } from "framer-motion";
import { isToday, isYesterday, format, isSameDay } from "date-fns";

const formatMessageDate = (date: Date) => {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d, yyyy");
};

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
    <div className="flex flex-col h-full bg-background relative">
      {/* Header - Optional, sometimes handled by parent */}
      {/* <div className="flex items-center gap-2 p-3 border-b bg-background/95 backdrop-blur z-10">
        <MessageSquare className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Chat</h2>
      </div> */}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <ScrollArea className="flex-1 [&>[data-radix-scroll-area-viewport]]:h-full [&>[data-radix-scroll-area-viewport]>div]:min-h-full">
          <div className="flex flex-col justify-end min-h-full px-4 py-4 space-y-6">
            <AnimatePresence initial={false}>
              {messagesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const prevMsg = messages[index - 1];
                  const isNewDay = !prevMsg || !isSameDay(new Date(message.createdAt || Date.now()), new Date(prevMsg.createdAt || Date.now()));

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
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="flex flex-col"
                    >
                      {/* Date Separator */}
                      {isNewDay && (
                        <div className="flex justify-center my-6">
                          <span className="text-xs font-semibold text-muted-foreground/60 tracking-wide uppercase">
                            {formatMessageDate(new Date(message.createdAt || Date.now()))}
                          </span>
                        </div>
                      )}

                      <div
                        className={`group relative flex gap-3 max-w-[85%] ${isOwnMessage ? 'ml-auto flex-row-reverse' : ''}`}
                        data-testid={`message-${message.id}`}
                        onClick={() => {
                          if (isPreview || isEditing) return;
                          setLongPressMessageId(longPressMessageId === message.id ? null : message.id);
                        }}
                      >
                        {/* Avatar - Only for others */}
                        {!isOwnMessage && (
                          <div className="flex-shrink-0 self-end mb-5">
                            {message.userId ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProfileId(message.userId);
                                  setProfileModalOpen(true);
                                }}
                                className="p-0 border-0 bg-transparent cursor-pointer transition-transform active:scale-95"
                                data-testid={`button-avatar-${message.id}`}
                              >
                                <Avatar className="h-8 w-8 hover-elevate shadow-sm">
                                  <AvatarImage src={(message as any).avatarUrl || ""} alt={senderName} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-[10px] font-bold">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                              </button>
                            ) : (
                              <Avatar className="h-8 w-8 shadow-sm">
                                <AvatarImage src={(message as any).avatarUrl || ""} alt={senderName} />
                                <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )}

                        <div className="flex flex-col gap-1 min-w-0">
                          {/* Sender Name (for others) */}
                          {!isOwnMessage && (
                            <span className="text-[11px] text-muted-foreground ml-1 font-medium">
                              {senderName}
                            </span>
                          )}

                          {/* Message Bubble */}
                          <div className={`relative px-4 py-3 shadow-sm min-w-[60px]
                            ${isOwnMessage
                              ? 'bg-[#007AFF] text-white rounded-[20px] rounded-br-[4px]'
                              : 'bg-[#262628] text-white rounded-[20px] rounded-bl-[4px]'}
                          `}>

                            {(message as any).imageUrl && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEnlargedImageUrl((message as any).imageUrl);
                                }}
                                className="p-0 border-0 bg-transparent cursor-pointer rounded-lg overflow-hidden mb-2 w-full"
                                data-testid={`button-img-message-${message.id}`}
                              >
                                <OptimizedImage
                                  src={(message as any).imageUrl}
                                  alt="Shared image"
                                  className="w-full h-auto max-h-60 object-cover rounded-lg"
                                  thumbnailSize="lg"
                                />
                              </button>
                            )}

                            {isEditing ? (
                              <div className="flex gap-2 w-full min-w-[200px]">
                                <Input
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="flex-1 bg-white/10 text-white border-0 h-8 text-sm focus-visible:ring-1 focus-visible:ring-white/50"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                  autoFocus
                                  data-testid="input-edit-message"
                                />
                                <Button size="icon" className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white" onClick={handleSaveEdit} disabled={editMessageMutation.isPending}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" onClick={handleCancelEdit}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : message.message ? (
                              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{renderMessageWithLinks(message.message)}</p>
                            ) : null}
                          </div>

                          {/* Timestamp - Outside Bubble */}
                          <div className={`text-[10px] text-muted-foreground/60 flex items-center gap-2 px-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            {timestamp}
                            {/* Message Actions (Edit/Delete) - Only shown on long press */}
                            {!isPreview && !isEditing && isOwnMessage && longPressMessageId === message.id && (
                              <div className="flex items-center gap-2 ml-2">
                                <button onClick={(e) => { e.stopPropagation(); clearLongPressMenu(); handleEditMessage(message); }} className="text-primary hover:underline">Edit</button>
                                <button onClick={(e) => { e.stopPropagation(); clearLongPressMenu(); handleDeleteMessage(message); }} className="text-destructive hover:underline">Delete</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area - Pill Shaped */}
      <div className="p-4 bg-background border-t">
        <div className="max-w-4xl mx-auto">
          {stagedImage && (
            <div className="flex items-center gap-3 mb-3 p-2 bg-muted/50 rounded-xl animate-in fade-in slide-in-from-bottom-2">
              <div className="relative group">
                <img
                  src={stagedImage.preview}
                  alt="Staged"
                  className="h-20 w-20 object-cover rounded-lg"
                />
                <button
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={clearStagedImage}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Ready to send</p>
                <p className="text-xs text-muted-foreground">Image attached</p>
              </div>
            </div>
          )}

          {isPreview ? (
            <div className="w-full p-4 bg-muted/30 rounded-full text-center text-sm text-muted-foreground border border-dashed">
              Join the server to send messages
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 border-transparent focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
                  onClick={handleImageUpload}
                  disabled={isUploadingImage}
                  data-testid="button-attach-image"
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </Button>

                <Input
                  placeholder="iMessage..."
                  className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-2 h-9 text-[15px] placeholder:text-muted-foreground/50"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  data-testid="input-chat-message"
                />

                <Button
                  size="icon"
                  type="submit"
                  className={`h-8 w-8 rounded-full shrink-0 transition-all duration-300 ${messageInput.trim() || stagedImage ? 'bg-[#007AFF] text-white hover:bg-[#0069d9]' : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20'}`}
                  disabled={!messageInput.trim() && !stagedImage}
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4 ml-0.5" />
                </Button>
              </div>
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
        </div>
      </div>

      {/* Image enlargement dialog */}
      <Dialog open={!!enlargedImageUrl} onOpenChange={() => setEnlargedImageUrl(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/90 border-0">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          {enlargedImageUrl && (
            <img
              src={enlargedImageUrl}
              alt="Enlarged"
              className="w-full h-auto max-h-[90vh] object-contain"
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
