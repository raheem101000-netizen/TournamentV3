import { ChevronLeft, ImageIcon, Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface ChatMessage {
    id: string
    text: string
    isSelf: boolean
    timestamp: string
}

const mockChatMessages: ChatMessage[] = [
    {
        id: "1",
        text: "Hey! How are you doing?",
        isSelf: false,
        timestamp: "10:30 AM",
    },
    {
        id: "2",
        text: "I'm doing great! Thanks for asking",
        isSelf: true,
        timestamp: "10:31 AM",
    },
    {
        id: "3",
        text: "That's awesome! Are we still meeting tomorrow for the project?",
        isSelf: false,
        timestamp: "10:32 AM",
    },
    {
        id: "4",
        text: "Yes, absolutely! I'll be there at 2pm",
        isSelf: true,
        timestamp: "10:33 AM",
    },
    {
        id: "5",
        text: "Perfect! See you then 😊",
        isSelf: false,
        timestamp: "10:34 AM",
    },
]

interface ChatDetailsViewProps {
    chatId: string
    onBack: () => void
}

export function ChatDetailsView({ chatId, onBack }: ChatDetailsViewProps) {
    const [messageText, setMessageText] = useState("")
    const [messages, setMessages] = useState(mockChatMessages)

    const handleSend = () => {
        if (messageText.trim()) {
            setMessages([
                ...messages,
                {
                    id: Date.now().toString(),
                    text: messageText,
                    isSelf: true,
                    timestamp: new Date().toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                    }),
                },
            ])
            setMessageText("")
        }
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            {/* Header */}
            <div className="flex-none flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
                <button onClick={onBack} className="text-blue-500" aria-label="Back">
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <Avatar className="h-10 w-10">
                    <AvatarImage src="/diverse-woman-portrait.png" alt="Sarah Chen" />
                    <AvatarFallback>SC</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="font-semibold">Sarah Chen</div>
                </div>
            </div>

            {/* Messages Area - CRITICAL: Using flexbox with spacer div */}
            <div className="flex-1 flex flex-col overflow-y-auto px-4">
                {/* Spacer div to push messages to bottom */}
                <div className="flex-1" />

                {/* Messages */}
                <div className="flex flex-col gap-2 py-4">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex ${message.isSelf ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-[75%] px-4 py-2 rounded-2xl ${message.isSelf ? "bg-blue-600 text-white rounded-br-sm" : "bg-zinc-800 text-white rounded-bl-sm"
                                    }`}
                            >
                                <p className="text-sm leading-relaxed">{message.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Input Area */}
            <div className="flex-none flex items-center gap-3 px-4 py-3 border-t border-zinc-800 bg-black">
                <button className="text-zinc-400" aria-label="Add photo">
                    <ImageIcon className="h-6 w-6" />
                </button>
                <Input
                    type="text"
                    placeholder="iMessage..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSend()
                        }
                    }}
                    className="flex-1 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                />
                <button
                    onClick={handleSend}
                    className="text-blue-500 disabled:text-zinc-600"
                    disabled={!messageText.trim()}
                    aria-label="Send message"
                >
                    <Send className="h-6 w-6" />
                </button>
            </div>
        </div>
    )
}
