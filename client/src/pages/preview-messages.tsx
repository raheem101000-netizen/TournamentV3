import { useState } from "react";
import { MessagesListView } from "@/components/mobile-chat/MessagesListView";
import { ChatDetailsView } from "@/components/mobile-chat/ChatDetailsView";

export default function PreviewMessages() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  if (selectedChatId) {
    return (
      <ChatDetailsView
        chatId={selectedChatId}
        onBack={() => setSelectedChatId(null)}
      />
    );
  }

  return (
    <MessagesListView
      onSelectChat={(chatId) => setSelectedChatId(chatId)}
    />
  );
}
