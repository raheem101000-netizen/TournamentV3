import { useState } from "react";
import { MessagesListView } from "@/components/mobile-chat/MessagesListView";
import ChatChannel from "@/components/channels/ChatChannel";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function PreviewMessages() {
  const [, setLocation] = useLocation();

  // Parse query params manually since wouter's useSearch isn't always available/consistent in all versions
  const getThreadIdFromUrl = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("threadId");
    }
    return null;
  };

  const [selectedChatId, setSelectedChatId] = useState<string | null>(getThreadIdFromUrl());


  if (selectedChatId) {
    return (
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

            <span className="font-semibold text-lg">Chat</span>

            <button
              className="text-blue-500 text-lg font-normal min-w-[60px] text-right"
              onClick={() => {
                // Placeholder for rename or group settings
                // toast({ title: "Coming Soon", description: "Custom group names coming soon!" });
                alert("Custom group names coming soon!");
              }}
            >
              Edit
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 min-h-0">
            <ChatChannel threadId={selectedChatId} isPreview={false} />
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MessagesListView
      onSelectChat={(chatId) => setSelectedChatId(chatId)}
    />
  );
}
