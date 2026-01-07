import { useState } from "react";
import MatchChatPanel from '../MatchChatPanel';

export default function MatchChatPanelExample() {
  const teams = [
    { id: "1", name: "Alpha Squad", tournamentId: "t1", wins: 2, losses: 0, points: 6, game: null, isRemoved: 0 },
    { id: "2", name: "Beta Force", tournamentId: "t1", wins: 1, losses: 1, points: 3, game: null, isRemoved: 0 },
  ];

  const [messages, setMessages] = useState([
    {
      id: "1",
      matchId: "m1",
      teamId: null,
      userId: null,
      message: "Match started",
      imageUrl: null,
      replyToId: null,
      isSystem: 1,
      createdAt: new Date(),
    },
    {
      id: "2",
      matchId: "m1",
      teamId: "1",
      userId: "u1",
      message: "GL HF!",
      imageUrl: null,
      replyToId: null,
      isSystem: 0,
      createdAt: new Date(),
    },
    {
      id: "3",
      matchId: "m1",
      teamId: "2",
      userId: "u2",
      message: "Good luck, have fun!",
      imageUrl: null,
      replyToId: null,
      isSystem: 0,
      createdAt: new Date(),
    },
    {
      id: "4",
      matchId: "m1",
      teamId: "1",
      userId: "u1",
      message: "Here's the final score screenshot",
      imageUrl: "https://placehold.co/400x300/0ea5e9/ffffff?text=Score+Screenshot",
      replyToId: null,
      isSystem: 0,
      createdAt: new Date(),
    },
  ]);

  const handleSendMessage = (message: string, image?: File) => {
    const newMessage = {
      id: `${messages.length + 1}`,
      matchId: "m1",
      teamId: "1",
      userId: "u1",
      message,
      imageUrl: image ? URL.createObjectURL(image) : null,
      replyToId: null,
      isSystem: 0,
      createdAt: new Date(),
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <div className="h-[600px]">
      <MatchChatPanel
        messages={messages}
        teams={teams}
        currentTeamId="1"
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
