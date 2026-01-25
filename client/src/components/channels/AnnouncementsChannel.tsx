import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Loader2, Send, Pencil, Trash2, X, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ChannelMessage } from "@shared/schema";
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

interface AnnouncementsChannelProps {
  channelId: string;
  canPost?: boolean;
}

export default function AnnouncementsChannel({ channelId, canPost = false }: AnnouncementsChannelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<ChannelMessage[]>({
    queryKey: [`/api/channels/${channelId}/messages`],
    enabled: !!channelId,
  });

  // Get current user info to check permissions
  const { data: currentUser } = useQuery<{ id: string; isAdmin?: boolean }>({
    queryKey: ['/api/auth/me'],
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

  const editAnnouncementMutation = useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) => {
      const response = await fetch(`/api/channels/${channelId}/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to edit announcement");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/channels/${channelId}/messages`] });
      setEditingId(null);
      setEditContent("");
      toast({
        title: "Announcement updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to edit",
        description: error instanceof Error ? error.message : "Try again",
        variant: "destructive",
      });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/channels/${channelId}/messages/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to delete announcement");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/channels/${channelId}/messages`] });
      setDeleteId(null);
      toast({
        title: "Announcement deleted",
        description: "The announcement has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete",
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

  const handleEdit = (message: ChannelMessage) => {
    setEditingId(message.id);
    setEditContent(message.message || "");
  };

  const handleSaveEdit = () => {
    if (!editingId || !editContent.trim()) return;
    editAnnouncementMutation.mutate({ id: editingId, message: editContent.trim() });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const canEditOrDelete = (message: ChannelMessage) => {
    return currentUser?.id === message.userId || currentUser?.isAdmin || canPost;
  };

  const sortedMessages = [...messages].sort((a, b) =>
    new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sortedMessages.length, channelId]); // Scroll on new messages or channel change

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
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
              {editingId === message.id ? (
                // Edit mode
                <div className="space-y-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={editAnnouncementMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={!editContent.trim() || editAnnouncementMutation.isPending}
                    >
                      {editAnnouncementMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base whitespace-pre-wrap break-words">{message.message}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Posted by {message.username} on {new Date(message.createdAt || Date.now()).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Announcement
                      </Badge>
                      {canEditOrDelete(message) && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(message)}
                            className="h-8 w-8 p-0"
                            title="Edit announcement"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteId(message.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Delete announcement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardHeader>
            {message.imageUrl && editingId !== message.id && (
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
      <div ref={scrollRef} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The announcement will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteAnnouncementMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
