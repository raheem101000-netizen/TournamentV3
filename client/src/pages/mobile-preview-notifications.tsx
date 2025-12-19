import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Trophy, UserPlus, Info, UserCheck, X } from "lucide-react";
import { Loader2 } from "lucide-react";
import type { Notification } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "match_result":
      return <Trophy className="h-5 w-5" />;
    case "friend_request":
      return <UserPlus className="h-5 w-5" />;
    case "tournament_alert":
      return <Bell className="h-5 w-5" />;
    default:
      return <Info className="h-5 w-5" />;
  }
};

export default function MobilePreviewNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set());

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/mobile-preview/notifications"],
  });

  const handleAcceptFriendRequest = async (notification: any) => {
    if (!notification.senderId || !user) return;
    
    setProcessingIds(prev => new Set(prev).add(notification.id));
    
    try {
      // Use the accept-from endpoint which handles missing friend request records
      const acceptRes = await fetch(`/api/friend-requests/accept-from/${notification.senderId}`, {
        method: "POST",
        credentials: "include",
      });
      
      if (acceptRes.ok) {
        setHandledIds(prev => new Set(prev).add(notification.id));
        toast({
          title: "Friend added!",
          description: `You are now friends with ${notification.senderName || 'this user'}`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/mobile-preview/notifications"] });
      } else {
        throw new Error("Failed to accept");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(notification.id);
        return next;
      });
    }
  };

  const handleDeclineFriendRequest = async (notification: any) => {
    if (!notification.senderId || !user) return;
    
    setProcessingIds(prev => new Set(prev).add(notification.id));
    
    try {
      const declineRes = await fetch(`/api/friend-requests/decline-from/${notification.senderId}`, {
        method: "POST",
        credentials: "include",
      });
      
      if (declineRes.ok) {
        setHandledIds(prev => new Set(prev).add(notification.id));
        toast({
          title: "Request declined",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/mobile-preview/notifications"] });
      } else {
        throw new Error("Failed to decline");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline friend request",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(notification.id);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4" data-testid="page-title">Notifications</h1>
      <p className="text-sm text-muted-foreground mb-6" data-testid="page-description">
        Stay updated with your latest alerts
      </p>
      
      <div className="space-y-3">
        {notifications?.map((notification) => (
          <Card 
            key={notification.id}
            className={`${
              !notification.isRead ? 'bg-accent/50' : ''
            }`}
            data-testid={`notification-${notification.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div 
                  className={`p-2 rounded-full ${
                    notification.type === 'match_result' 
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      : notification.type === 'friend_request'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : notification.type === 'tournament_alert'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                  data-testid={`notification-icon-${notification.id}`}
                >
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold" data-testid={`notification-title-${notification.id}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-muted-foreground" data-testid={`notification-timestamp-${notification.id}`}>
                      {notification.timestamp ? formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true }) : 'Just now'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground" data-testid={`notification-message-${notification.id}`}>
                    {notification.type === 'friend_request' && (notification as any).senderName
                      ? `${(notification as any).senderName} sent you a friend request`
                      : notification.message}
                  </p>
                  
                  {notification.type === 'friend_request' && !handledIds.has(notification.id) && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptFriendRequest(notification)}
                        disabled={processingIds.has(notification.id)}
                        data-testid={`button-accept-${notification.id}`}
                      >
                        {processingIds.has(notification.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <UserCheck className="h-4 w-4 mr-1" />
                        )}
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineFriendRequest(notification)}
                        disabled={processingIds.has(notification.id)}
                        data-testid={`button-decline-${notification.id}`}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                  
                  {notification.type === 'friend_request' && handledIds.has(notification.id) && (
                    <p className="text-sm text-muted-foreground mt-2">Handled</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!notifications || notifications.length === 0) && (
        <div className="text-center py-12" data-testid="no-notifications-message">
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      )}
    </div>
  );
}
