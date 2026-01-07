import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { Link, useLocation } from "wouter";
import { BottomNavigation } from "@/components/BottomNavigation";
import Particles from "@/components/ui/particles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
import { Search, Plus, Users, Send, ArrowLeft, Edit, Check, X, Image as ImageIcon, Paperclip, Smile, Loader2, AlertCircle, Trophy, Trash2, MessageSquare, UserPlus, UserCheck, Clock, Pencil } from "lucide-react";
import { isToday, isYesterday, format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getAchievementIcon, getAchievementColor } from "@/lib/achievement-utils";

interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  avatar?: string;
  groupImage?: string;
  lastMessage: string;
  lastMessageSenderName?: string;
  timestamp: string;
  unread: number;
  members: number;
  matchId?: string; // If present, this is a match chat using chatMessages API
}

interface MessageThread {
  id: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSenderId?: string;
  lastMessageSenderName?: string;
  unreadCount: number;
  matchId?: string; // If present, this is a match chat
}

interface ThreadMessage {
  id: string;
  threadId: string;
  userId: string;
  username: string;
  message: string;
  createdAt: string;
  imageUrl?: string;
  avatarUrl?: string;
  displayName?: string;
  tournamentId?: string;
}

interface User {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
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


function threadToChat(thread: MessageThread): Chat {
  const isMatchChat = !!thread.matchId;
  return {
    id: thread.id,
    name: thread.participantName,
    isGroup: isMatchChat,
    avatar: thread.participantAvatar || undefined,
    groupImage: isMatchChat ? (thread.participantAvatar || "💬") : undefined,
    lastMessage: thread.lastMessage,
    lastMessageSenderName: thread.lastMessageSenderName,
    timestamp: formatTime(thread.lastMessageTime),
    unread: thread.unreadCount,
    members: 0,
    matchId: thread.matchId,
  };
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

interface Tournament {
  id: string;
  name: string;
  game: string;
  posterUrl?: string | null;
  startDate?: string | null;
  prize?: string | null;
  entryFee?: string | null;
  maxTeams?: number | null;
}

function TournamentEmbed({ tournamentId }: { tournamentId: string }) {
  const [, setLocation] = useLocation();

  const { data: tournament, isLoading } = useQuery<Tournament>({
    queryKey: ['/api/tournaments', tournamentId],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      if (!response.ok) throw new Error('Tournament not found');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-[280px] overflow-hidden">
        <div className="h-32 bg-muted animate-pulse" />
        <CardContent className="p-3 space-y-2">
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!tournament) {
    return (
      <Card className="w-full max-w-[280px] p-3">
        <p className="text-sm text-muted-foreground">Tournament not found</p>
      </Card>
    );
  }

  return (
    <Card
      className="w-full max-w-[280px] overflow-hidden hover-elevate cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        setLocation(`/tournament/${tournamentId}/register`);
      }}
      data-testid={`tournament-embed-${tournamentId}`}
    >
      {tournament.posterUrl ? (
        <div className="relative h-36 overflow-hidden">
          <img
            src={tournament.posterUrl}
            alt={tournament.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2">
            <h4 className="font-semibold text-white text-sm line-clamp-1">{tournament.name}</h4>
            <p className="text-white/80 text-xs">{tournament.game}</p>
          </div>
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-primary/50" />
        </div>
      )}
      <CardContent className="p-3 space-y-2">
        {!tournament.posterUrl && (
          <>
            <h4 className="font-semibold text-sm line-clamp-1">{tournament.name}</h4>
            <p className="text-muted-foreground text-xs">{tournament.game}</p>
          </>
        )}
        <div className="flex items-center justify-between text-xs">
          {tournament.prize && (
            <Badge variant="secondary" className="text-xs">
              {tournament.prize}
            </Badge>
          )}
          {tournament.entryFee && (
            <span className="text-muted-foreground">{tournament.entryFee === "0" || tournament.entryFee === "$0" ? "Free" : tournament.entryFee}</span>
          )}
        </div>
        <Button
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            setLocation(`/tournament/${tournamentId}/register`);
          }}
          data-testid={`button-register-embed-${tournamentId}`}
        >
          <Trophy className="w-3 h-3 mr-1" />
          View Tournament
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PreviewMessages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [editingAvatar, setEditingAvatar] = useState<Chat | null>(null);
  const [newAvatarEmoji, setNewAvatarEmoji] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [messageRequests, setMessageRequests] = useState<Chat[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isFriendRequestSent, setIsFriendRequestSent] = useState(false);
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [stagedImage, setStagedImage] = useState<{ file: File; preview: string } | null>(null);
  const [editingMessage, setEditingMessage] = useState<ThreadMessage | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<ThreadMessage | null>(null);
  const [longPressMessageId, setLongPressMessageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch message threads from API
  const { data: threads = [], isLoading } = useQuery<MessageThread[]>({
    queryKey: ["/api/message-threads"],
  });

  // Fetch match details when viewing a match chat
  const { data: matchDetails } = useQuery<any>({
    queryKey: ["match-details", selectedChat?.matchId || "none"],
    enabled: !!selectedChat?.matchId,
    queryFn: async () => {
      if (!selectedChat?.matchId) return null;
      const response = await fetch(`/api/matches/${selectedChat.matchId}`);
      if (!response.ok) return null;
      return response.json();
    },
  });

  // Fetch profile data when viewing profile modal
  const { data: previewProfileData } = useQuery<any>({
    queryKey: ["/api/users/username", selectedProfileId],
    enabled: !!selectedProfileId && profileModalOpen,
    queryFn: async () => {
      if (!selectedProfileId) return null;
      const response = await fetch(`/api/users/${selectedProfileId}`);
      if (!response.ok) return null;
      return response.json();
    },
  });

  // Fetch achievements for profile modal
  const { data: previewAchievements = [], isLoading: achievementsLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${selectedProfileId}/achievements`],
    enabled: !!selectedProfileId && profileModalOpen,
    queryFn: async () => {
      if (!selectedProfileId) return [];
      const response = await fetch(`/api/users/${selectedProfileId}/achievements`);
      if (!response.ok) return [];
      const achievements = await response.json();
      console.log('Achievements fetched:', achievements);
      return achievements;
    },
  });

  // Fetch friend request status for profile modal
  const { data: friendRequestStatus, refetch: refetchFriendStatus } = useQuery<{
    status: "none" | "pending" | "accepted" | "declined";
    isSender?: boolean;
    friendRequest?: any;
  }>({
    queryKey: ["/api/friend-requests/status", selectedProfileId],
    enabled: !!selectedProfileId && profileModalOpen && !!currentUser && currentUser.id !== selectedProfileId,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const response = await fetch(`/api/friend-requests/status/${selectedProfileId}`, {
        credentials: "include",
      });
      if (!response.ok) return { status: "none" };
      return response.json();
    },
  });

  // Auto-select match chat if matchId is in URL query
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const matchIdParam = params.get("matchId");

    if (matchIdParam && threads.length > 0 && !selectedChat) {
      const matchThread = threads.find(t => t.matchId === matchIdParam);
      if (matchThread) {
        const chat = threadToChat(matchThread);
        setSelectedChat(chat);
      }
    }
  }, [threads, location, selectedChat]);

  // Reset friend request state when modal closes
  useEffect(() => {
    if (!profileModalOpen) {
      setIsFriendRequestSent(false);
    }
  }, [profileModalOpen]);

  // Mark thread as read when opened
  useEffect(() => {
    if (selectedChat?.id) {
      fetch(`/api/message-threads/${selectedChat.id}/mark-read`, {
        method: "POST",
        credentials: "include",
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/message-threads/unread-count"] });
      }).catch(() => { });
    }
  }, [selectedChat?.id, queryClient]);

  const handleAddFriend = async () => {
    if (!previewProfileData || !currentUser) return;

    try {
      const response = await fetch("/api/friend-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: previewProfileData.id,
        }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to send friend request");

      setIsFriendRequestSent(true);
      toast({
        title: "Friend request sent!",
        description: `Request sent to ${previewProfileData.displayName || previewProfileData.username}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const handleMessageProfile = async () => {
    if (!previewProfileData) return;

    try {
      const response = await fetch("/api/message-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: previewProfileData.id,
          participantName: previewProfileData.displayName || previewProfileData.username,
          participantAvatar: previewProfileData.avatarUrl,
        }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to create message thread");
      const thread = await response.json();

      setProfileModalOpen(false);
      setSelectedChat(threadToChat(thread));
      toast({
        title: "Opening message thread",
        description: `Chat with ${previewProfileData.displayName || previewProfileData.username}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open message thread",
        variant: "destructive",
      });
    }
  };

  // Fetch messages for selected thread or match
  // If selectedChat has a matchId, fetch from match API, otherwise from thread API
  // Fetch messages for selected thread or match with infinite scroll
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: messagesLoading
  } = useInfiniteQuery({
    queryKey: selectedChat?.matchId
      ? ["/api/matches", selectedChat.matchId, "messages"]
      : ["/api/message-threads", selectedChat?.id, "messages"],
    enabled: !!selectedChat,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: any[]) => {
      // If we got fewer messages than the limit (50), there are no more older messages
      if (!lastPage || lastPage.length < 50) return undefined;
      // The pages are returned in chronological order (oldest -> newest)
      // So the oldest message of the batch is at index 0
      return lastPage[0]?.createdAt;
    },
    queryFn: async ({ pageParam }) => {
      if (!selectedChat) return [];

      const baseUrl = selectedChat.matchId
        ? `/api/matches/${selectedChat.matchId}/messages`
        : `/api/message-threads/${selectedChat.id}/messages`;

      const params = new URLSearchParams();
      params.append("limit", "50");
      if (pageParam) {
        params.append("before", pageParam);
      }

      const response = await fetch(`${baseUrl}?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
  });

  // Flatten pages into a single array
  const threadMessages = messagesData?.pages.slice().reverse().flat() || [];

  // Auto-scroll to latest message when messages load or change
  // Smarter logic: Only scroll if we were already near bottom, or if it's the initial load
  useEffect(() => {
    // Only scroll to bottom if we are NOT fetching history (prevent jump)
    // And if we have data
    if (threadMessages.length > 0 && !isFetchingNextPage) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [threadMessages.length, isFetchingNextPage]); // Depend on length to trigger on new messages

  // Infinite scroll trigger
  const { ref: topRef, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const acceptedChats = threads.map(threadToChat);

  // Separate personal chats from match chats
  const personalChats = acceptedChats.filter(chat => !chat.matchId);
  const matchChats = acceptedChats.filter(chat => !!chat.matchId);

  // Filter chats based on search term
  const filteredPersonalChats = personalChats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMatchChats = matchChats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, imageUrl }: { message: string; imageUrl: string | null }) => {
      if (!selectedChat) throw new Error("No chat selected");

      // Use correct API endpoint based on chat type
      const url = selectedChat.matchId
        ? `/api/matches/${selectedChat.matchId}/messages`
        : `/api/message-threads/${selectedChat.id}/messages`;

      // For match chat, include userId and username
      const body = selectedChat.matchId
        ? {
          userId: currentUser?.id,
          username: currentUser?.username,
          message,
          imageUrl,
          replyToId: null
        }
        : { message, imageUrl, replyToId: null };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      return response.json();
    },
    onSuccess: () => {
      setMessageInput("");
      toast({
        title: "Message sent!",
      });
      // Refetch messages after sending - use correct queryKey based on chat type
      if (selectedChat?.matchId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/matches", selectedChat.matchId, "messages"]
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: ["/api/message-threads", selectedChat?.id, "messages"]
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, message }: { messageId: string; message: string }) => {
      if (!selectedChat) throw new Error("No chat selected");

      const url = selectedChat.matchId
        ? `/api/matches/${selectedChat.matchId}/messages/${messageId}`
        : `/api/message-threads/${selectedChat.id}/messages/${messageId}`;

      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error("Failed to update message");
      return response.json();
    },
    onSuccess: () => {
      setEditingMessage(null);
      setEditText("");
      toast({ title: "Message updated" });
      if (selectedChat?.matchId) {
        queryClient.invalidateQueries({ queryKey: ["/api/matches", selectedChat.matchId, "messages"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/message-threads", selectedChat?.id, "messages"] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive",
      });
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!selectedChat) throw new Error("No chat selected");

      const url = selectedChat.matchId
        ? `/api/matches/${selectedChat.matchId}/messages/${messageId}`
        : `/api/message-threads/${selectedChat.id}/messages/${messageId}`;

      const response = await fetch(url, { method: "DELETE" });

      if (!response.ok) throw new Error("Failed to delete message");
      return response.json();
    },
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
      toast({ title: "Message deleted" });
      if (selectedChat?.matchId) {
        queryClient.invalidateQueries({ queryKey: ["/api/matches", selectedChat.matchId, "messages"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/message-threads", selectedChat?.id, "messages"] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    },
  });

  // Message edit/delete handlers
  const handleEditMessage = (msg: ThreadMessage) => {
    setEditingMessage(msg);
    setEditText(msg.message || "");
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText("");
  };

  const handleSaveEdit = () => {
    if (editingMessage && editText.trim()) {
      editMessageMutation.mutate({ messageId: editingMessage.id, message: editText });
    }
  };

  const handleDeleteMessage = (msg: ThreadMessage) => {
    setMessageToDelete(msg);
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

  const handleSendMessage = async () => {
    // Must have either text or staged image
    if (!messageInput.trim() && !stagedImage) return;

    let imageUrl: string | null = null;

    // Upload staged image first if present
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

    sendMessageMutation.mutate({ message: messageInput, imageUrl });

    // Clear staged image
    setStagedImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast({
        title: "File upload coming soon",
        description: "File uploads will be available in a future update",
      });
    }
  };

  const setWinnerMutation = useMutation({
    mutationFn: async (winnerId: string) => {
      if (!selectedChat?.matchId) throw new Error("No match selected");
      const response = await fetch(`/api/matches/${selectedChat.matchId}/winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId }),
      });
      if (!response.ok) throw new Error("Failed to set winner");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Winner selected!" });
      queryClient.invalidateQueries({ queryKey: ["match-details", selectedChat?.matchId] });
      queryClient.invalidateQueries({ queryKey: ["/api/message-threads"] });

      // Invalidate Dashboard caches for this tournament to keep standings in sync
      if (matchDetails?.tournamentId) {
        queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${matchDetails.tournamentId}/teams`] });
        queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${matchDetails.tournamentId}/matches`] });
      }

      setSelectedChat(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const closeMatchChatMutation = useMutation({
    mutationFn: async () => {
      if (!selectedChat?.id) throw new Error("No chat selected");
      const response = await fetch(`/api/message-threads/${selectedChat.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to close match chat");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Match chat closed!" });
      queryClient.invalidateQueries({ queryKey: ["/api/message-threads"] });
      setSelectedChat(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (!selectedChat) return;

    // Create preview URL and stage the image
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

  const handleAcceptRequest = async (request: Chat) => {
    try {
      // Create a message thread from the request
      const response = await fetch("/api/message-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName: request.name,
          participantAvatar: request.avatar || request.groupImage,
        }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to accept request");

      // Refetch threads to show in personal messages
      queryClient.invalidateQueries({ queryKey: ["/api/message-threads"] });

      // Remove from message requests
      setMessageRequests(prev => prev.filter(r => r.id !== request.id));

      toast({
        title: "Message request accepted",
        description: `You can now chat with ${request.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept message request",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = (request: Chat) => {
    setMessageRequests(prev => prev.filter(r => r.id !== request.id));
    toast({
      title: "Message request declined",
      variant: "destructive",
    });
  };

  const updateAvatarMutation = useMutation({
    mutationFn: async (avatar: string) => {
      if (!editingAvatar) throw new Error("No group selected");

      const response = await fetch(`/api/message-threads/${editingAvatar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantAvatar: avatar }),
      });

      if (!response.ok) {
        throw new Error("Failed to update avatar");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Group avatar updated!",
        description: `Changed to ${newAvatarEmoji}`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/message-threads"] });
      setEditingAvatar(null);
      setNewAvatarEmoji("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update group avatar",
        variant: "destructive",
      });
    },
  });

  const handleUpdateAvatar = () => {
    if (!editingAvatar || !newAvatarEmoji.trim()) return;
    updateAvatarMutation.mutate(newAvatarEmoji);
  };

  const createGroupMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch("/api/message-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName: name,
          participantAvatar: "💬",
          lastMessage: "",
          unreadCount: 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create group");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Group chat created!",
        description: `${newGroupName} has been created`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/message-threads"] });
      setNewGroupName("");
      setShowCreateGroup(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create group chat",
        variant: "destructive",
      });
    },
  });

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    createGroupMutation.mutate(newGroupName);
  };

  // Conversation view
  if (selectedChat) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedChat(null)}
                data-testid="button-back-to-messages"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>

              <div className="relative cursor-pointer" onClick={() => selectedChat.isGroup && setEditingAvatar(selectedChat)}>
                <Avatar className="w-10 h-10">
                  {selectedChat.isGroup ? (
                    <AvatarFallback className="text-xl bg-primary/10">
                      {selectedChat.groupImage}
                    </AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src={selectedChat.avatar} />
                      <AvatarFallback className="text-sm bg-primary/10">
                        {selectedChat.name?.substring(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                {selectedChat.isGroup && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Edit className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h2 className="font-semibold">{selectedChat.name}</h2>
                {selectedChat.isGroup && (
                  <p className="text-xs text-muted-foreground">{selectedChat.members} members</p>
                )}
              </div>
              {selectedChat?.matchId && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => closeMatchChatMutation.mutate()}
                  disabled={closeMatchChatMutation.isPending}
                  data-testid="button-close-match-chat"
                  title="Close match chat"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden">
          <Card className="flex flex-col flex-1 h-full min-h-0 bg-background/80 backdrop-blur-md border-white/10">
            {selectedChat?.matchId && (
              <CardHeader className="pb-4">
                <CardTitle className="font-display flex items-center gap-2">
                  Match Chat
                  <Badge variant="outline" className="font-normal">
                    {threadMessages.length} messages
                  </Badge>
                </CardTitle>
              </CardHeader>
            )}
            <CardContent className="flex-1 flex flex-col p-0 pb-4 min-h-0 overflow-hidden">
              <ScrollArea className="flex-1 min-h-0 [&>[data-radix-scroll-area-viewport]]:h-full [&>[data-radix-scroll-area-viewport]>div]:min-h-full">
                <div className="space-y-1 pt-4 px-4 min-h-full flex flex-col justify-end">
                  {/* Loading spinner for history */}
                  {isFetchingNextPage && (
                    <div className="flex justify-center py-2 h-8">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {/* Invisible element to trigger loading more */}
                  <div ref={topRef} className="h-1" />

                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : threadMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    threadMessages.map((msg, index) => {
                      const isOwn = msg.userId === currentUser?.id;
                      const isSystem = false;
                      const prevMsg = threadMessages[index - 1];
                      const isNewDay = !prevMsg || !isSameDay(new Date(msg.createdAt), new Date(prevMsg.createdAt));

                      // Get proper initials
                      const getInitials = () => {
                        const name = (msg as any).displayName?.trim() || msg.username?.trim() || '';
                        if (!name) return 'U';
                        const parts = name.split(' ').filter((p: string) => p);
                        if (parts.length > 1) {
                          return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                        }
                        return name.substring(0, 2).toUpperCase();
                      };

                      const senderName = (msg as any).displayName?.trim() || msg.username?.trim() || 'Unknown User';

                      const isEditing = editingMessage?.id === msg.id;

                      return (
                        <div key={msg.id} className="flex flex-col gap-2">
                          {/* Date Separator */}
                          {isNewDay && (
                            <div className="flex justify-center my-4">
                              <span className="text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                                {formatMessageDate(new Date(msg.createdAt))}
                              </span>
                            </div>
                          )}

                          {isSystem ? (
                            <div className="flex justify-center my-2">
                              <Badge variant="outline" className="gap-2 py-1">
                                <AlertCircle className="w-3 h-3" />
                                {msg.message}
                              </Badge>
                            </div>
                          ) : (
                            <div
                              className={`group relative flex gap-2 max-w-[85%] ${isOwn ? 'ml-auto flex-row-reverse' : ''}`}
                              data-testid={`message-${msg.id}`}
                              onClick={() => {
                                if (isEditing) return;
                                setLongPressMessageId(longPressMessageId === msg.id ? null : msg.id);
                              }}
                            >
                              {/* Avatar - Only for others */}
                              {!isOwn && (
                                <div className="flex-shrink-0 self-end mb-1">
                                  {msg.userId ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedProfileId(msg.userId);
                                        setProfileModalOpen(true);
                                      }}
                                      className="p-0 border-0 bg-transparent cursor-pointer"
                                    >
                                      <Avatar className="h-8 w-8 hover-elevate">
                                        {msg.avatarUrl && <AvatarImage src={msg.avatarUrl} alt={senderName} />}
                                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                          {getInitials()}
                                        </AvatarFallback>
                                      </Avatar>
                                    </button>
                                  ) : (
                                    <Avatar className="h-8 w-8">
                                      {msg.avatarUrl && <AvatarImage src={msg.avatarUrl} alt={senderName} />}
                                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                        {getInitials()}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                              )}

                              {/* Message Bubble */}
                              <div className={`relative flex flex-col gap-1 min-w-[60px] p-3 shadow-sm
                                ${isOwn
                                  ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                                  : 'bg-muted/80 text-foreground rounded-2xl rounded-bl-sm'}
                              `}>
                                {/* Image Content */}
                                {msg.imageUrl && (
                                  <button
                                    onClick={() => setEnlargedImageUrl(msg.imageUrl)}
                                    className="p-0 border-0 bg-transparent cursor-pointer rounded-lg overflow-hidden mb-1"
                                  >
                                    <img
                                      src={msg.imageUrl}
                                      alt="Shared image"
                                      className="max-w-full h-auto max-h-60 object-contain rounded-lg"
                                    />
                                  </button>
                                )}

                                {/* Text Content */}
                                {isEditing ? (
                                  <div className="flex gap-2 w-full min-w-[200px]">
                                    <Input
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      className="flex-1 bg-background text-foreground h-8"
                                      autoFocus
                                    />
                                    <Button size="icon" className="h-8 w-8" onClick={handleSaveEdit}>
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : msg.message && (
                                  <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isOwn ? 'text-white' : 'text-foreground'}`}>
                                    {renderMessageWithLinks(msg.message)}
                                  </p>
                                )}

                                {/* Timestamp & Status */}
                                <div className={`text-[10px] flex items-center justify-end gap-1 mt-0.5 opacity-70 ${isOwn ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                  {format(new Date(msg.createdAt), 'h:mm a')}
                                </div>
                              </div>

                              {/* Context Menu for Own Messages */}
                              {!isEditing && isOwn && longPressMessageId === msg.id && (
                                <div className="absolute top-0 right-full mr-2 z-10">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 px-2 shadow-lg"
                                    onClick={(e) => { e.stopPropagation(); clearLongPressMenu(); handleDeleteMessage(msg); }}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>


              <div className="p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
                {/* Staged image preview */}
                {stagedImage && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-xl mb-2">
                    <img
                      src={stagedImage.preview}
                      alt="Staged"
                      className="h-16 w-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 text-sm text-muted-foreground">
                      Image ready to send
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full"
                      onClick={clearStagedImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-full border border-input focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-all">
                  {/* Left Side Actions */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-full text-muted-foreground hover:bg-background hover:text-foreground shrink-0"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploadingImage}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </Button>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={imageInputRef}
                    onChange={handleImageSelected}
                  />

                  {/* Text Input */}
                  <Input
                    placeholder="Message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 h-9 px-2"
                  />

                  {/* Right Side Actions */}
                  <Button
                    size="icon"
                    className={`h-9 w-9 rounded-full shrink-0 transition-transform ${messageInput.trim() || stagedImage ? 'bg-blue-600 hover:bg-blue-700' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'}`}
                    onClick={handleSendMessage}
                    disabled={(!messageInput.trim() && !stagedImage) || isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Send className="w-4 h-4 text-white ml-0.5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Full-Page Profile Modal - Inside conversation view */}
        <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-50" style={{ zIndex: 50 }}>
            {previewProfileData ? (
              <div className="space-y-6">
                {/* Close Button */}
                <div className="flex justify-end -mt-2 -mr-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setProfileModalOpen(false)}
                    data-testid="button-close-profile-modal"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Profile Header */}
                <div className="flex gap-4 items-start">
                  <Avatar className="w-20 h-20">
                    {previewProfileData.avatarUrl && (
                      <AvatarImage src={previewProfileData.avatarUrl} alt={previewProfileData.displayName || previewProfileData.username} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {previewProfileData.displayName?.[0]?.toUpperCase() || previewProfileData.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{previewProfileData.displayName || previewProfileData.username}</h2>
                    <p className="text-sm text-muted-foreground">@{previewProfileData.username}</p>
                    {previewProfileData.email && (
                      <p className="text-sm text-muted-foreground">{previewProfileData.email}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {currentUser?.id !== selectedProfileId && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleMessageProfile}
                      className="flex-1"
                      data-testid="button-message-profile-user"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    {friendRequestStatus?.status === "accepted" ? (
                      <Button variant="secondary" disabled className="flex-1" data-testid="button-friends">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Friends
                      </Button>
                    ) : friendRequestStatus?.status === "pending" && friendRequestStatus?.isSender ? (
                      <Button variant="secondary" disabled className="flex-1" data-testid="button-request-pending">
                        <Clock className="w-4 h-4 mr-2" />
                        Request Sent
                      </Button>
                    ) : friendRequestStatus?.status === "pending" && !friendRequestStatus?.isSender ? (
                      <Button onClick={handleAddFriend} className="flex-1" data-testid="button-accept-friend">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Accept Request
                      </Button>
                    ) : (
                      <Button
                        onClick={handleAddFriend}
                        disabled={isFriendRequestSent}
                        variant={isFriendRequestSent ? "secondary" : "outline"}
                        className="flex-1"
                        data-testid="button-add-friend-profile"
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
                    )}
                  </div>
                )}

                {/* Bio */}
                {previewProfileData.bio && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Bio</h3>
                    <p className="text-sm text-foreground">{previewProfileData.bio}</p>
                  </div>
                )}

                {/* Achievements */}
                {!achievementsLoading && previewAchievements.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Achievements</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {previewAchievements.map((achievement: any) => {
                        const IconComponent = getAchievementIcon(achievement.iconUrl);
                        const colorClass = getAchievementColor(achievement.iconUrl);
                        return (
                          <div key={achievement.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8">
                              <IconComponent className={`w-5 h-5 ${colorClass}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm">{achievement.title}</h4>
                              {achievement.game && <p className="text-xs text-muted-foreground">{achievement.game}</p>}
                              {achievement.serverName && <p className="text-xs text-muted-foreground">{achievement.serverName}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!achievementsLoading && previewAchievements.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">No achievements yet</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Enlarged Image Dialog */}
        <Dialog open={!!enlargedImageUrl} onOpenChange={(open) => !open && setEnlargedImageUrl(null)}>
          <DialogContent className="max-w-fit w-auto max-h-[90vh] p-2 border bg-background flex items-center justify-center">
            <button
              onClick={() => setEnlargedImageUrl(null)}
              className="absolute top-2 right-2 z-50 p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              data-testid="button-close-enlarged-image"
            >
              <X className="w-5 h-5" />
            </button>
            {enlargedImageUrl && (
              <img
                src={enlargedImageUrl}
                alt="Enlarged image"
                className="max-w-full max-h-[85vh] object-contain rounded-md"
                data-testid="img-enlarged"
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog - Inside conversation view */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Message</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this message? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-conv">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete-conv"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Main messages list view
  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-lg mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Messages</h1>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowCreateGroup(true)}
              data-testid="button-create-group-header"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-messages"
            />
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-2">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="personal" data-testid="tab-personal">
              Personal
              {personalChats.filter(c => c.unread > 0).length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {personalChats.reduce((sum, c) => sum + c.unread, 0)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="matches" data-testid="tab-matches">
              Match Chats
              {matchChats.filter(c => c.unread > 0).length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {matchChats.reduce((sum, c) => sum + c.unread, 0)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-requests">
              Requests
              {messageRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {messageRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-1">
            {isLoading ? (
              <Card className="p-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </Card>
            ) : filteredPersonalChats.length === 0 ? (
              <Card>
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? "No personal messages match your search" : "No personal messages yet"}
                  </p>
                </div>
              </Card>
            ) : (
              filteredPersonalChats.map((chat) => (
                <Card
                  key={chat.id}
                  className="p-4 hover-elevate cursor-pointer border-0 shadow-none"
                  onClick={() => setSelectedChat(chat)}
                  data-testid={`chat-${chat.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        {chat.isGroup ? (
                          <AvatarFallback className="text-2xl bg-primary/10">
                            {chat.groupImage}
                          </AvatarFallback>
                        ) : (
                          <AvatarImage src={chat.avatar} />
                        )}
                      </Avatar>
                      {chat.unread > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                          {chat.unread}
                        </Badge>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">
                            {chat.name}
                          </h3>
                          {chat.isGroup && chat.members > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {chat.members}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {chat.timestamp}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${chat.unread > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {chat.lastMessageSenderName ? `${chat.lastMessageSenderName}: ${chat.lastMessage}` : chat.lastMessage}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="matches" className="space-y-1">
            {isLoading ? (
              <Card className="p-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </Card>
            ) : filteredMatchChats.length === 0 ? (
              <Card>
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? "No match chats match your search" : "No match chats yet"}
                  </p>
                </div>
              </Card>
            ) : (
              filteredMatchChats.map((chat) => (
                <Card
                  key={chat.id}
                  className="p-4 hover-elevate cursor-pointer border-0 shadow-none"
                  onClick={() => setSelectedChat(chat)}
                  data-testid={`match-chat-${chat.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="text-2xl bg-primary/10">
                        ⚔️
                      </AvatarFallback>
                    </Avatar>
                    {chat.unread > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {chat.unread}
                      </Badge>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">
                          {chat.name}
                        </h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {chat.timestamp}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${chat.unread > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {chat.lastMessageSenderName ? `${chat.lastMessageSenderName}: ${chat.lastMessage}` : chat.lastMessage}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-1">
            {messageRequests.length === 0 ? (
              <Card>
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No message requests</p>
                </div>
              </Card>
            ) : (
              messageRequests.map((request) => (
                <Card
                  key={request.id}
                  className="p-4 border-0 shadow-none"
                  data-testid={`request-${request.id}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      {request.isGroup ? (
                        <AvatarFallback className="text-2xl bg-primary/10">
                          {request.groupImage}
                        </AvatarFallback>
                      ) : (
                        <AvatarImage src={request.avatar} />
                      )}
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {request.name}
                        </h3>
                        {request.isGroup && (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            {request.members}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 truncate">
                        {request.lastMessage}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAcceptRequest(request)}
                          data-testid={`button-accept-${request.id}`}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleDeclineRequest(request)}
                          data-testid={`button-decline-${request.id}`}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNavigation />

      <Particles
        particleCount={150}
        particleSpread={15}
        speed={0.05}
        particleColors={['#8b5cf6', '#a78bfa', '#c4b5fd']}
        alphaParticles={false}
        particleBaseSize={200}
        cameraDistance={10}
        sizeRandomness={0.5}
        disableRotation={false}
        className="fixed inset-0 z-50 pointer-events-none"
      />

      {/* Edit Group Avatar Dialog */}
      <Dialog open={!!editingAvatar} onOpenChange={() => {
        setEditingAvatar(null);
        setNewAvatarEmoji("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Group Avatar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="text-4xl bg-primary/10">
                  {newAvatarEmoji || editingAvatar?.groupImage}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">{editingAvatar?.name}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Enter emoji</label>
              <Input
                placeholder="Enter an emoji (e.g., 🎮, ⚡, 👑)"
                value={newAvatarEmoji}
                onChange={(e) => setNewAvatarEmoji(e.target.value.slice(0, 2))}
                maxLength={2}
                className="text-center text-2xl"
                data-testid="input-new-avatar"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {["🎮", "⚡", "👑", "🏆", "🔥", "💎", "⚔️", "🎯"].map((emoji) => (
                <Button
                  key={emoji}
                  variant="outline"
                  className="text-2xl h-12"
                  onClick={() => setNewAvatarEmoji(emoji)}
                  data-testid={`button-emoji-${emoji}`}
                >
                  {emoji}
                </Button>
              ))}
            </div>

            <Button
              className="w-full"
              onClick={handleUpdateAvatar}
              disabled={!newAvatarEmoji.trim() || updateAvatarMutation.isPending}
              data-testid="button-update-avatar"
            >
              {updateAvatarMutation.isPending ? "Updating..." : "Update Avatar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Group Chat Dialog */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Name</label>
              <Input
                placeholder="Enter group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                data-testid="input-group-name"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || createGroupMutation.isPending}
              data-testid="button-create-group-confirm"
            >
              {createGroupMutation.isPending ? "Creating..." : "Create Group"}
            </Button>
          </div>
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
