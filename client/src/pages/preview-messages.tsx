import { useState } from "react";
import { MessagesListView } from "@/components/mobile-chat/MessagesListView";
import ChatChannel from "@/components/channels/ChatChannel";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import { ChevronLeft, User, BellOff, Trash2, Ban, Flag, Info, Settings } from "lucide-react";
import { useLocation } from "wouter";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { GroupChatSettingsDrawer } from "@/components/mobile-chat/GroupChatSettingsDrawer";
import { useQuery } from "@tanstack/react-query";
import RichMatchChat from "@/components/RichMatchChat";

export default function PreviewMessages() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);

  // Parse query params manually since wouter's useSearch isn't always available/consistent in all versions
  const getThreadIdFromUrl = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("threadId");
    }
    return null;
  };

  const [selectedChatId, setSelectedChatId] = useState<string | null>(getThreadIdFromUrl());

  // Query to check if the thread is a group chat
  const { data: threadData } = useQuery({
    queryKey: ["/api/threads", selectedChatId],
    queryFn: async () => {
      if (!selectedChatId) return null;
      const res = await fetch(`/api/threads/${selectedChatId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedChatId,
  });

  const isGroupChat = threadData?.isGroup === 1;

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  const currentUserId = (currentUser as any)?.id || "";


  if (selectedChatId) {
    return (
      /* Lazy load RichMatchChat to avoid circular dependencies/bloat if possible, or just import at top if standard. 
         Let's use the existing lazy imports structure if consistent, but here we can just import it.
         However, the file imports MessagesListView etc. 
      */
      <MobileLayout showBottomNav={false}>
        <div className="fixed inset-0 z-40 flex flex-col bg-black text-white overflow-hidden supports-[height:100dvh]:h-[100dvh]">
          {/* Header */}
          <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-black z-10">
            <button
              onClick={() => setSelectedChatId(null)}
              className="text-blue-500 flex items-center gap-1 min-w-[60px]"
              aria-label="Back"
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="text-lg">Back</span>
            </button>

            <span className="font-semibold text-lg">
              {threadData?.matchId ? "Match Chat" : "Chat"}
            </span>

            <div className="flex items-center gap-3">
              {isGroupChat && (
                <button
                  onClick={() => setIsGroupSettingsOpen(true)}
                  className="text-blue-500 text-lg font-normal"
                  aria-label="Settings"
                >
                  <Settings className="h-5 w-5" />
                </button>
              )}
              {/* Hide Details button for match chats or keep it? 
                  Match chats usually have their own details in RichMatchChat header or we can keep generic details.
                  For now keeping it but maybe disabling if matchId?
                  Actually, RichMatchChat has its own header. 
                  If we use RichMatchChat, we might want to hide THIS header and let RichMatchChat handle it?
                  OR pass isPreview={false} to RichMatchChat and let it render inside the content area.
                  RichMatchChat has a Card Header.
                  Let's render RichMatchChat inside the content area.
              */}
              {!threadData?.matchId && (
                <Drawer>
                  <DrawerTrigger asChild>
                    <button
                      className="text-blue-500 text-lg font-normal min-w-[60px] text-right"
                    >
                      Details
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="bg-zinc-900 border-zinc-800 text-white pb-6">
                    <div className="mx-auto w-full max-w-sm">
                      <DrawerHeader>
                        <DrawerTitle className="text-center text-xl font-bold">Details</DrawerTitle>
                      </DrawerHeader>

                      <div className="px-4 space-y-6 mt-4">
                        {/* User Profile Section */}
                        <div className="flex flex-col items-center gap-2">
                          <Avatar className="h-20 w-20 border-2 border-zinc-700">
                            <AvatarImage src={threadData?.participantAvatar || undefined} />
                            <AvatarFallback>
                              {threadData?.participantName?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-center">
                            <h3 className="font-bold text-lg">{threadData?.participantName || "User"}</h3>
                            <p className="text-zinc-400">@{threadData?.participantName?.toLowerCase().replace(/\s+/g, '') || "user"}</p>
                          </div>

                          <div className="flex gap-4 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full border-zinc-700 text-white bg-transparent hover:bg-zinc-800"
                              onClick={() => {
                                toast({ title: "Opening Profile", description: "Navigating to user profile..." });
                              }}
                            >
                              <User className="w-4 h-4 mr-2" />
                              Profile
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full border-zinc-700 text-white bg-transparent hover:bg-zinc-800"
                              onClick={() => {
                                toast({ title: "Coming Soon", description: "Search in chat coming soon" });
                              }}
                            >
                              <Info className="w-4 h-4 mr-2" />
                              Search
                            </Button>
                          </div>
                        </div>

                        <Separator className="bg-zinc-800" />

                        {/* Actions List */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-purple-500/20 text-purple-400">
                                <BellOff className="w-5 h-5" />
                              </div>
                              <span className="font-medium">Mute Notifications</span>
                            </div>
                            <Switch
                              checked={isMuted}
                              onCheckedChange={(checked) => {
                                setIsMuted(checked);
                                toast({
                                  title: checked ? "Notifications Muted" : "Notifications On",
                                  description: checked ? "You won't receive alerts for this chat." : "Alerts enabled."
                                });
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 h-12 text-base font-normal px-3"
                              onClick={() => {
                                toast({ title: "Blocked", description: "User has been blocked.", variant: "destructive" });
                              }}
                            >
                              <Ban className="w-5 h-5 mr-3" />
                              Block User
                            </Button>

                            <Button
                              variant="ghost"
                              className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10 h-12 text-base font-normal px-3"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this conversation?")) {
                                  toast({ title: "Conversation Deleted", variant: "destructive" });
                                  setSelectedChatId(null);
                                }
                              }}
                            >
                              <Trash2 className="w-5 h-5 mr-3" />
                              Delete Conversation
                            </Button>
                          </div>
                        </div>
                      </div>

                      <DrawerFooter>
                        <DrawerClose asChild>
                          <Button variant="outline" className="w-full border-zinc-700 bg-transparent text-white hover:bg-zinc-800">Cancel</Button>
                        </DrawerClose>
                      </DrawerFooter>
                    </div>
                  </DrawerContent>
                </Drawer>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 min-h-0">
            {threadData?.matchId ? (
              <RichMatchChat matchId={threadData.matchId} canManage={false} />
            ) : (
              <ChatChannel threadId={selectedChatId} isPreview={false} />
            )}
          </div>

          {/* Group Chat Settings Drawer */}
          {isGroupChat && selectedChatId && (
            <GroupChatSettingsDrawer
              isOpen={isGroupSettingsOpen}
              onClose={() => setIsGroupSettingsOpen(false)}
              threadId={selectedChatId}
              currentUserId={currentUserId}
            />
          )}
        </div>
      </MobileLayout>
    );
  }

  return (
    <MessagesListView
      onSelectChat={(chatId: string) => setSelectedChatId(chatId)}
    />
  );
}
