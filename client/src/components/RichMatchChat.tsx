import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Send, Trophy, ImageIcon, Loader2, X, Pencil, Trash2, Check } from "lucide-react";
import { useRef, useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import UserProfileModal from "./UserProfileModal";
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
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
import type { ChatMessage } from "@shared/schema";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { ImageGrid } from "@/components/chat/ImageGrid";

const formatMessageDate = (date: Date) => {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d, yyyy");
};

// Group consecutive image messages from same user
function groupImageMessages(messages: any[]) {
  const groups: Array<{
    type: 'image-group' | 'regular';
    userId: string;
    timestamp: number;
    messages: any[];
  }> = [];

  let currentGroup: typeof groups[0] | null = null;

  for (const msg of messages) {
    const isImageOnly = msg.imageUrl && !msg.message;
    const sameUser = currentGroup?.userId === msg.userId;
    const within5Min = currentGroup ?
      Math.abs(new Date(currentGroup.timestamp).getTime() - new Date(msg.createdAt).getTime()) < 300000 :
      false;

    if (isImageOnly && currentGroup?.type === 'image-group' && sameUser && within5Min) {
      currentGroup.messages.push(msg);
    } else {
      if (currentGroup) groups.push(currentGroup);

      if (isImageOnly) {
        currentGroup = {
          type: 'image-group',
          userId: msg.userId,
          timestamp: new Date(msg.createdAt).getTime(),
          messages: [msg]
        };
      } else {
        currentGroup = {
          type: 'regular',
          userId: msg.userId,
          timestamp: new Date(msg.createdAt).getTime(),
          messages: [msg]
        };
      }
    }
  }

  if (currentGroup) groups.push(currentGroup);
  return groups;
}

interface RichMatchChatProps {
  matchId: string;
  winnerId?: string | null;
  tournamentId?: string;
  team1Name?: string;
  team2Name?: string;
  team1Id?: string;
  team2Id?: string;
  canManage?: boolean;
}

export default function RichMatchChat({
  matchId,
  winnerId,
  tournamentId,
  team1Name = "Team 1",
  team2Name = "Team 2",
  team1Id = "",
  team2Id = "",
  canManage = false
}: RichMatchChatProps) {
  const [messageInput, setMessageInput] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [stagedImage, setStagedImage] = useState<{ file: File; preview: string } | null>(null);
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
  const [longPressMessageId, setLongPressMessageId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  // Fetch match details if not provided fully via props
  const { data: matchData } = useQuery<any>({
    queryKey: [`/api/matches/${matchId}`],
    enabled: !!matchId,
    staleTime: 60000,
  });

  // Use props first, then fall back to fetched data
  const finalTeam1Name = team1Name !== "Team 1" ? team1Name : (matchData?.team1?.name || "Team 1");
  const finalTeam2Name = team2Name !== "Team 2" ? team2Name : (matchData?.team2?.name || "Team 2");
  const finalTeam1Id = team1Id || matchData?.team1Id;
  const finalTeam2Id = team2Id || matchData?.team2Id;
  const finalWinnerId = winnerId || matchData?.winnerId;
  // If we fetched the match, we might know if the user is an organizer derived from tournament data, 
  // but for now relying on passed `canManage` or if the user is admin.

  const { data: threadMessages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/matches/${matchId}/messages`],
    enabled: !!matchId,
    refetchInterval: 5000, // Polling for new messages
    staleTime: 1000,
  });

  // Auto-scroll to latest message when messages load or change
  useEffect(() => {
    if (threadMessages.length > 0 && !messagesLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [threadMessages, messagesLoading]);

  // Mark match chat as read when opened
  useEffect(() => {
    if (matchId && currentUser?.id) {
      fetch(`/api/matches/${matchId}/mark-read`, {
        method: 'POST',
        credentials: 'include',
      }).catch(err => console.error('Failed to mark match as read:', err));
    }
  }, [matchId, currentUser?.id]);

  // Extract unique users from thread messages
  const chatUsers = useMemo(() => {
    const userMap = new Map<string, any>();
    threadMessages.forEach((msg) => {
      if (msg.userId && !userMap.has(msg.userId)) {
        userMap.set(msg.userId, {
          id: msg.userId,
          username: msg.username,
          displayName: (msg as any).displayName?.trim() || msg.username,
          avatarUrl: (msg as any).avatarUrl,
        });
      }
    });
    return Array.from(userMap.values());
  }, [threadMessages]);

  // Filter users based on mention query
  const filteredUsers = useMemo(() => {
    if (!mentionQuery) return chatUsers;
    const query = mentionQuery.toLowerCase();
    return chatUsers.filter(user =>
      user.username.toLowerCase().includes(query) ||
      user.displayName.toLowerCase().includes(query)
    );
  }, [chatUsers, mentionQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setMessageInput(text);

    // Detect mention: find @ and track what comes after it
    const cursorPos = e.target.selectionStart || text.length;
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const afterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if we're still in the mention (no space after @)
      if (!afterAt.includes(" ")) {
        setMentionIndex(lastAtIndex);
        setMentionQuery(afterAt);
        setMentionOpen(true);
        return;
      }
    }

    setMentionOpen(false);
    setMentionQuery("");
    setMentionIndex(-1);
  };

  const selectMention = (user: any) => {
    if (mentionIndex === -1) return;

    const beforeMention = messageInput.substring(0, mentionIndex);
    const afterMention = messageInput.substring(mentionIndex + mentionQuery.length + 1);

    // Insert mention tag in format: @username
    const newMessage = `${beforeMention}@${user.username} ${afterMention}`;
    setMessageInput(newMessage);
    setMentionOpen(false);
    setMentionQuery("");
    setMentionIndex(-1);
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      return await apiRequest("POST", `/api/matches/${matchId}/messages`, {
        message: data.message,
        userId: currentUser?.id
      });
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${matchId}/messages`] });
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) => {
      const response = await apiRequest("PATCH", `/api/match-messages/${id}`, { message });
      return response.json();
    },
    onSuccess: () => {
      setEditingMessage(null);
      setEditText("");
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${matchId}/messages`] });
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
      await apiRequest("DELETE", `/api/match-messages/${id}`);
    },
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${matchId}/messages`] });
      toast({ title: "Message deleted" });
    },
    onError: (error) => {
      console.error("Error deleting message:", error);
      toast({ title: "Failed to delete message", variant: "destructive" });
    },
  });

  const handleEditMessage = (message: ChatMessage) => {
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

  const handleDeleteMessage = (message: ChatMessage) => {
    setMessageToDelete(message);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (messageToDelete) {
      deleteMessageMutation.mutate(messageToDelete.id);
    }
  };

  const clearLongPressMenu = () => {
    setLongPressMessageId(null);
  };

  const setWinnerMutation = useMutation({
    mutationFn: async (winnerId: string) => {
      return await apiRequest("POST", `/api/matches/${matchId}/winner`, { winnerId });
    },
    onSuccess: (data, winnerId) => {
      const winnerName = winnerId === finalTeam1Id ? finalTeam1Name : finalTeam2Name;
      toast({
        title: "Winner Selected",
        description: `${winnerName} has been set as the winner!`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${matchId}/messages`] });
      if (tournamentId) {
        // Immediately update the cache with the new data
        queryClient.setQueryData([`/api/tournaments/${tournamentId}/matches`], (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.map((match: any) =>
            match.id === matchId ? { ...match, winnerId, status: 'completed' } : match
          );
        });
        // Invalidate and refetch BOTH matches and teams - teams data changes when winner is selected
        queryClient.refetchQueries({ queryKey: [`/api/tournaments/${tournamentId}/matches`] });
        queryClient.refetchQueries({ queryKey: [`/api/tournaments/${tournamentId}/teams`] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to set winner. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Parse mentions from message text and create interactive elements
  const renderMessageWithMentions = (text: string) => {
    if (!text) return null;

    // Regex to find @username mentions
    const mentionRegex = /@([\w-]+)/g;
    const parts: Array<{ type: 'mention' | 'text'; content: string; username?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }
      // Add mention
      parts.push({
        type: 'mention',
        content: match[0],
        username: match[1]
      });
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }

    return parts.length === 0 ? text : (
      <>
        {parts.map((part, idx) => {
          if (part.type === 'text') {
            return part.content;
          } else {
            // Find the user by username
            const mentionedUser = chatUsers.find(u => u.username === part.username);
            return (
              <button
                key={idx}
                onClick={() => {
                  if (mentionedUser) {
                    setSelectedProfileId(mentionedUser.id);
                    setProfileModalOpen(true);
                  }
                }}
                className="bg-primary/10 text-primary hover:bg-primary/20 px-1.5 py-0.5 rounded font-semibold text-sm hover-elevate cursor-pointer"
                data-testid={`mention-${part.username}`}
              >
                {part.content}
              </button>
            );
          }
        })}
      </>
    );
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() && !stagedImage) return;

    let imageUrl: string | null = null;

    // Upload image if staged
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

    // Send message with optional image
    try {
      await apiRequest("POST", `/api/matches/${matchId}/messages`, {
        message: messageInput.trim(),
        imageUrl: imageUrl,
        userId: currentUser?.id
      });

      queryClient.invalidateQueries({ queryKey: [`/api/matches/${matchId}/messages`] });

      // Clear inputs
      setMessageInput("");
      setStagedImage(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }

      // Detect mentions
      if (messageInput.trim()) {
        const mentionRegex = /@([\w-]+)/g;
        let match;
        const mentionedUsernames = new Set<string>();

        while ((match = mentionRegex.exec(messageInput)) !== null) {
          mentionedUsernames.add(match[1]);
        }

        if (mentionedUsernames.size > 0) {
          const mentionedList = Array.from(mentionedUsernames).join(', ');
          toast({
            title: "Mentions Sent",
            description: `You mentioned: @${mentionedList}`,
            variant: "default",
          });
        }
      }
    } catch (error: any) {
      console.error("Message send error:", error);
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send message.",
        variant: "destructive",
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
    <div className="flex flex-col h-full gap-4">
      <Card className="flex flex-col min-h-0 flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="font-display flex items-center gap-2 text-sm">
            Match Chat
            <Badge variant="outline" className="font-normal">
              {threadMessages.length} messages
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3 p-0 px-4 pb-4 pt-4 min-h-0">
          <ScrollArea className="flex-1 pr-4 [&>[data-radix-scroll-area-viewport]]:h-full [&>[data-radix-scroll-area-viewport]>div]:min-h-full [&>[data-radix-scroll-area-viewport]>div]:flex [&>[data-radix-scroll-area-viewport]>div]:flex-col">
            <div className="flex flex-col min-h-full space-y-4 pt-2">
              {/* Spacer that grows to push messages to bottom */}
              <div className="flex-1" />
              {messagesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : threadMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                threadMessages.map((msg) => {
                  const isOwn = msg.userId === currentUser?.id;
                  const isAdmin = (currentUser as any)?.role === 'admin' || (currentUser as any)?.role === 'organizer';
                  const canDelete = isOwn || isAdmin;
                  const senderName = (msg as any).displayName?.trim() || msg.username?.trim() || 'Unknown User';
                  const isEditing = editingMessage?.id === msg.id;

                  const getInitials = () => {
                    const name = (msg as any).displayName?.trim() || msg.username?.trim() || '';
                    if (!name) return 'U';
                    const parts = name.split(' ').filter((p: string) => p);
                    if (parts.length > 1) {
                      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                    }
                    return name.substring(0, 2).toUpperCase();
                  };

                  return (
                    <div
                      key={msg.id}
                      className={`group relative flex gap-2 p-2 -m-2 rounded-md cursor-pointer ${isOwn ? 'flex-row-reverse' : ''} ${longPressMessageId === msg.id ? 'bg-muted' : ''}`}
                      data-testid={`message-${msg.id}`}
                      onClick={() => {
                        if (isEditing) return;
                        setLongPressMessageId(longPressMessageId === msg.id ? null : msg.id);
                      }}
                    >
                      {msg.userId ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProfileId(msg.userId);
                            setProfileModalOpen(true);
                          }}
                          className="p-0 border-0 bg-transparent cursor-pointer"
                          data-testid={`button-avatar-${msg.id}`}
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0 cursor-pointer hover-elevate">
                            {(msg as any).avatarUrl && (
                              <AvatarImage
                                src={(msg as any).avatarUrl}
                                alt={senderName}
                              />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials()}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                      ) : (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          {(msg as any).avatarUrl && (
                            <AvatarImage
                              src={(msg as any).avatarUrl}
                              alt={senderName}
                            />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {/* Message action menu - positioned at right of message row */}
                      {!isEditing && canDelete && longPressMessageId === msg.id && (
                        <div className="absolute right-2 top-2 flex flex-col gap-1 bg-card border rounded-md shadow-md p-1 z-10">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 justify-start gap-2 text-destructive"
                            onClick={(e) => { e.stopPropagation(); clearLongPressMenu(); handleDeleteMessage(msg); }}
                            data-testid={`button-delete-message-${msg.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      )}
                      <div className={`flex flex-col gap-1 min-w-0`}>
                        {/* Sender Name (for others only) */}
                        {!isOwn && (
                          <span className="text-[11px] text-muted-foreground ml-1 font-medium">
                            {senderName}
                          </span>
                        )}

                        {/* Message Bubble - iOS Messages Style */}
                        <div className={`relative shadow-sm min-w-[60px]
                          ${msg.imageUrl && !msg.message ? 'p-0' : 'px-4 py-3'}
                          ${isOwn
                            ? 'bg-[#007AFF] text-white rounded-[20px] rounded-br-[4px]'
                            : 'bg-[#262628] text-white rounded-[20px] rounded-bl-[4px]'}
                        `}>

                          {/* Image inside bubble - compact */}
                          {msg.imageUrl && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEnlargedImageUrl(msg.imageUrl);
                              }}
                              className="p-0 border-0 bg-transparent cursor-pointer rounded-[16px] overflow-hidden w-full block"
                              data-testid={`button-img-message-${msg.id}`}
                            >
                              <img
                                src={msg.imageUrl}
                                alt="Shared image"
                                className="w-full h-auto max-h-48 object-cover rounded-[16px]"
                              />
                            </button>
                          )}

                          {/* Message text or edit mode */}
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
                          ) : msg.message ? (
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{renderMessageWithMentions(msg.message)}</p>
                          ) : null}
                        </div>

                        {/* Timestamp - Outside Bubble */}
                        <div className={`text-[10px] text-muted-foreground/60 flex items-center gap-2 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          {format(new Date(msg.createdAt), "h:mm a")}
                          {/* Message Actions (Delete) - Only shown on long press */}
                          {!isEditing && canDelete && longPressMessageId === msg.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => { e.stopPropagation(); clearLongPressMenu(); handleDeleteMessage(msg); }}
                              data-testid={`button-delete-message-${msg.id}`}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {canManage && finalTeam1Id && finalTeam2Id && (
            <div className="border-t pt-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Select Winner:</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setWinnerMutation.mutate(team1Id)}
                  disabled={setWinnerMutation.isPending}
                  className="flex-1 text-xs"
                  data-testid="button-team1-wins"
                >
                  <Trophy className="w-3 h-3 mr-1" />
                  {finalTeam1Name}
                </Button>
                <Button
                  onClick={() => setWinnerMutation.mutate(finalTeam2Id)}
                  disabled={setWinnerMutation.isPending}
                  className="flex-1 text-xs"
                  data-testid="button-team2-wins"
                >
                  <Trophy className="w-3 h-3 mr-1" />
                  {finalTeam2Name}
                </Button>
              </div>
            </div>
          )}

          <div className="border-t pt-3 space-y-2">
            <div className="flex gap-2 relative">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={imageInputRef}
                onChange={handleImageSelected}
                data-testid="input-file-upload"
              />
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImage}
                data-testid="button-upload-image"
              >
                {isUploadingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </Button>
              {/* Message input area */}
              <div className="flex-1 relative">
                {/* Staged Image Preview */}
                {stagedImage && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-background border rounded-md">
                    <div className="relative inline-block">
                      <img
                        src={stagedImage.preview}
                        alt="Staged upload"
                        className="max-h-40 rounded"
                      />
                      <button
                        onClick={clearStagedImage}
                        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <Input
                  placeholder="Type @ to mention... or type a message"
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (mentionOpen && e.key === 'ArrowDown') {
                      e.preventDefault();
                    } else if (e.key === 'Enter' && !e.shiftKey && !mentionOpen) {
                      handleSendMessage();
                    }
                  }}
                  className="w-full h-9"
                  data-testid="input-message"
                />
                {mentionOpen && filteredUsers.length > 0 && (
                  <div className="absolute bottom-full right-0 w-56 mb-2 z-50 border border-border rounded-md bg-background shadow-lg">
                    <Command>
                      <CommandEmpty>No users found</CommandEmpty>
                      <CommandGroup>
                        {filteredUsers.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.username}
                            onSelect={() => selectMention(user)}
                            className="cursor-pointer"
                            data-testid={`mention-option-${user.id}`}
                          >
                            <Avatar className="h-6 w-6 mr-2">
                              {user.avatarUrl && (
                                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                              )}
                              <AvatarFallback className="text-xs">
                                {user.displayName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{user.displayName}</span>
                              <span className="text-xs text-muted-foreground">@{user.username}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </div>
                )}
              </div>
              <Button
                size="icon"
                className="h-9 w-9"
                onClick={handleSendMessage}
                disabled={(!messageInput.trim() && !stagedImage) || isUploadingImage}
                data-testid="button-send-message"
              >
                {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <UserProfileModal
        userId={selectedProfileId}
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />

      <Dialog open={!!enlargedImageUrl} onOpenChange={(open) => !open && setEnlargedImageUrl(null)}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 border-0 bg-black/90 flex items-center justify-center" aria-describedby="enlarged-image-description">
          <DialogTitle className="sr-only">Enlarged Image Preview</DialogTitle>
          <div id="enlarged-image-description" className="sr-only">
            Preview of the image sent in chat
          </div>
          <button
            onClick={() => setEnlargedImageUrl(null)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            data-testid="button-close-enlarged-image"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {enlargedImageUrl && (
            <img
              src={enlargedImageUrl}
              alt="Enlarged image"
              className="max-w-full max-h-[90vh] object-contain"
              data-testid="img-enlarged"
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
    </div>
  );
}
