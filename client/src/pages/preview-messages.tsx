import { useState } from "react";
import { MessagesListView } from "@/components/mobile-chat/MessagesListView";
import ChatChannel from "@/components/channels/ChatChannel";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import { ChevronLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PreviewMessages() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  if (selectedChatId) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="flex flex-col h-screen bg-black text-white pb-20">
          {/* Header */}
          <div className="flex-none flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-black z-10">
            <button
              onClick={() => setSelectedChatId(null)}
              className="text-blue-500 flex items-center gap-1"
              aria-label="Back"
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="text-lg">Back</span>
            </button>

            {/* We could fetch thread details here to show name/avatar, 
                for now we'll show a generic header or just "Chat" 
                until we lift state or fetch details */}
            <div className="flex-1 flex justify-center mr-8"> {/* mr-8 balances the back button */}
              <span className="font-semibold text-lg">Chat</span>
            </div>
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
