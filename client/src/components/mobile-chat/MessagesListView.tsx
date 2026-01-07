import { Search, Plus, Home, Compass, MessageCircle, Server, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface Message {
    id: string
    username: string
    avatar: string
    lastMessage: string
    timestamp: string
    unread: boolean
}

const mockMessages: Message[] = [
    {
        id: "1",
        username: "Sarah Chen",
        avatar: "/diverse-woman-portrait.png",
        lastMessage: "Hey! Are we still meeting tomorrow?",
        timestamp: "25m ago",
        unread: true,
    },
    {
        id: "2",
        username: "Mike Johnson",
        avatar: "/man.jpg",
        lastMessage: "Thanks for your help earlier!",
        timestamp: "1h ago",
        unread: false,
    },
    {
        id: "3",
        username: "Emily Davis",
        avatar: "/woman-2.jpg",
        lastMessage: "Did you see the latest update?",
        timestamp: "3h ago",
        unread: true,
    },
    {
        id: "4",
        username: "Alex Kim",
        avatar: "/diverse-group.png",
        lastMessage: "Let me know when you're free",
        timestamp: "5h ago",
        unread: false,
    },
]

interface MessagesListViewProps {
    onSelectChat: (chatId: string) => void
}

export function MessagesListView({ onSelectChat }: MessagesListViewProps) {
    const [activeTab, setActiveTab] = useState<"personal" | "match" | "requests">("personal")

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            {/* Header */}
            <div className="flex-none px-4 pt-12 pb-4 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold">Messages</h1>
                    <div className="flex items-center gap-4">
                        <button className="text-blue-500" aria-label="Add new message">
                            <Plus className="h-6 w-6" />
                        </button>
                        <button className="text-blue-500" aria-label="Search">
                            <Search className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                    <Input
                        type="search"
                        placeholder="Search messages..."
                        className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab("personal")}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === "personal" ? "bg-zinc-800 text-white" : "bg-transparent text-zinc-500"
                            }`}
                    >
                        Personal
                    </button>
                    <button
                        onClick={() => setActiveTab("match")}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === "match" ? "bg-zinc-800 text-white" : "bg-transparent text-zinc-500"
                            }`}
                    >
                        Match Chats
                    </button>
                    <button
                        onClick={() => setActiveTab("requests")}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === "requests" ? "bg-zinc-800 text-white" : "bg-transparent text-zinc-500"
                            }`}
                    >
                        Requests
                    </button>
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto">
                {mockMessages.map((message) => (
                    <button
                        key={message.id}
                        onClick={() => onSelectChat(message.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 border-b border-zinc-900 hover:bg-zinc-900 transition-colors"
                    >
                        <Avatar className="h-12 w-12 flex-none">
                            <AvatarImage src={message.avatar || "/placeholder.svg"} alt={message.username} />
                            <AvatarFallback>{message.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 text-left">
                            <div className="font-semibold text-white">{message.username}</div>
                            <div className="text-sm text-zinc-400 truncate">{message.lastMessage}</div>
                        </div>
                        <div className="flex-none flex flex-col items-end gap-1">
                            <div className="text-xs text-zinc-500">{message.timestamp}</div>
                            {message.unread && <div className="h-2 w-2 bg-blue-500 rounded-full" />}
                        </div>
                    </button>
                ))}
            </div>

            {/* Bottom Navigation */}
            <div className="flex-none flex items-center justify-around py-3 px-4 border-t border-zinc-800 bg-black">
                <button className="flex flex-col items-center gap-1 text-zinc-400" aria-label="Home">
                    <Home className="h-6 w-6" />
                    <span className="text-xs">Home</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-zinc-400" aria-label="Discovery">
                    <Compass className="h-6 w-6" />
                    <span className="text-xs">Discovery</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-blue-500" aria-label="Messages">
                    <MessageCircle className="h-6 w-6" />
                    <span className="text-xs">Messages</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-zinc-400" aria-label="My Servers">
                    <Server className="h-6 w-6" />
                    <span className="text-xs">My Servers</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-zinc-400" aria-label="Account">
                    <User className="h-6 w-6" />
                    <span className="text-xs">Account</span>
                </button>
            </div>
        </div>
    )
}
