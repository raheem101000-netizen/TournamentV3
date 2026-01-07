import { Search, Plus, MessageCircle, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { apiRequest } from "@/lib/queryClient"
import { formatDistanceToNow } from "date-fns"
import { BottomNavigation } from "@/components/BottomNavigation"
import { MobileLayout } from "@/components/layouts/MobileLayout"

interface MessageThread {
    id: string
    participantName: string
    participantAvatar: string
    lastMessage: string
    lastMessageTime: string
    unreadCount: number
}

interface UserResult {
    id: string
    username: string
    displayName: string
    avatarUrl: string
    friendshipStatus: 'none' | 'friend' | 'pending_sent' | 'pending_received'
}

interface MessagesListViewProps {
    onSelectChat: (chatId: string) => void
}

export function MessagesListView({ onSelectChat }: MessagesListViewProps) {
    const [activeTab, setActiveTab] = useState<"personal" | "match" | "requests">("personal")
    const [isNewChatOpen, setIsNewChatOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const { data: threads, isLoading } = useQuery<MessageThread[]>({
        queryKey: ["/api/threads"],
    })

    const { data: searchResults, isLoading: isSearching, refetch: refetchSearch } = useQuery<UserResult[]>({
        queryKey: ["/api/users/search", searchQuery],
        queryFn: async () => {
            if (!searchQuery || searchQuery.length < 2) return []
            const res = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(searchQuery)}`)
            return res.json()
        },
        enabled: searchQuery.length >= 2
    })

    const createThreadMutation = useMutation({
        mutationFn: async (participantId: string) => {
            const res = await apiRequest("POST", "/api/threads", { participantId })
            return res.json()
        },
        onSuccess: (thread) => {
            setIsNewChatOpen(false)
            onSelectChat(thread.id)
        }
    })

    const addFriendMutation = useMutation({
        mutationFn: async (recipientId: string) => {
            const res = await apiRequest("POST", "/api/friend-request", { recipientId })
            return res.json()
        },
        onSuccess: () => {
            refetchSearch()
        }
    })

    // Filter threads based on active tab (assuming mostly personal for now)
    const displayThreads = threads || []

    return (
        <MobileLayout>
            <div className="flex flex-col min-h-screen bg-black text-white pb-20">
                {/* Header */}
                <div className="flex-none px-4 pt-4 pb-4 border-b border-zinc-800">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold">Messages</h1>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsNewChatOpen(true)}
                                className="text-blue-500 hover:text-blue-400 transition-colors"
                                aria-label="Add new message"
                            >
                                <Plus className="h-6 w-6" />
                            </button>
                            <button className="text-blue-500 hover:text-blue-400 transition-colors" aria-label="Search">
                                <Search className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-4">
                        <Input
                            type="search"
                            placeholder="Search messages..."
                            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-blue-500"
                        />
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab("personal")}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === "personal" ? "bg-zinc-800 text-white" : "bg-transparent text-zinc-500"}`}
                        >
                            Personal
                        </button>
                        <button
                            onClick={() => setActiveTab("match")}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === "match" ? "bg-zinc-800 text-white" : "bg-transparent text-zinc-500"}`}
                        >
                            Match Chats
                        </button>
                        <button
                            onClick={() => setActiveTab("requests")}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === "requests" ? "bg-zinc-800 text-white" : "bg-transparent text-zinc-500"}`}
                        >
                            Requests
                        </button>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                        </div>
                    ) : displayThreads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-zinc-500 mt-10">
                            <MessageCircle className="h-16 w-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">No messages yet</p>
                            <p className="text-sm text-zinc-600 mb-4">Start connecting with other players!</p>
                            <button
                                onClick={() => setIsNewChatOpen(true)}
                                className="text-blue-500 text-sm font-semibold hover:underline bg-blue-500/10 px-4 py-2 rounded-full"
                            >
                                Start a conversation
                            </button>
                        </div>
                    ) : (
                        displayThreads.map((thread) => (
                            <button
                                key={thread.id}
                                onClick={() => onSelectChat(thread.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 border-b border-zinc-900/50 hover:bg-zinc-900/50 transition-colors"
                            >
                                <Avatar className="h-14 w-14 flex-none border border-zinc-800">
                                    <AvatarImage src={thread.participantAvatar || undefined} />
                                    <AvatarFallback>{thread.participantName[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <div className="font-semibold text-white truncate pr-2 text-base">{thread.participantName}</div>
                                        <div className="text-xs text-zinc-500 flex-none font-medium">
                                            {thread.lastMessageTime && formatDistanceToNow(new Date(thread.lastMessageTime), { addSuffix: true })}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm text-zinc-400 truncate pr-2 leading-snug">{thread.lastMessage}</div>
                                        {thread.unreadCount > 0 && (
                                            <div className="h-2.5 w-2.5 bg-blue-500 rounded-full flex-none ring-2 ring-black" />
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* New Chat Dialog */}
                <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-white w-[90%] max-w-md rounded-xl">
                        <DialogHeader>
                            <DialogTitle>New Message</DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                Search for a user to start a conversation with.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <Input
                                placeholder="Search users by name or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-blue-600"
                            />
                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                                {isSearching ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                                    </div>
                                ) : searchResults?.map((user) => (
                                    <div
                                        key={user.id}
                                        className="w-full flex items-center justify-between gap-3 p-3 hover:bg-zinc-800 rounded-lg transition-colors text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border border-zinc-700">
                                                <AvatarImage src={user.avatarUrl} />
                                                <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium text-white group-hover:text-blue-400 transition-colors">{user.displayName || user.username}</div>
                                                <div className="text-sm text-zinc-500">@{user.username}</div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        {user.friendshipStatus === 'friend' ? (
                                            <button
                                                onClick={() => createThreadMutation.mutate(user.id)}
                                                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors"
                                            >
                                                Message
                                            </button>
                                        ) : user.friendshipStatus === 'pending_sent' ? (
                                            <span className="text-xs text-zinc-500 font-medium px-2">Pending</span>
                                        ) : user.friendshipStatus === 'pending_received' ? (
                                            <span className="text-xs text-blue-400 font-medium px-2">Request Received</span>
                                        ) : (
                                            <button
                                                onClick={() => addFriendMutation.mutate(user.id)}
                                                disabled={addFriendMutation.isPending}
                                                className="text-xs bg-zinc-700 text-white px-3 py-1.5 rounded-full hover:bg-zinc-600 transition-colors disabled:opacity-50"
                                            >
                                                {addFriendMutation.isPending ? 'Adding...' : 'Add Friend'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {searchQuery.length >= 2 && searchResults?.length === 0 && (
                                    <p className="text-center text-zinc-500 py-4">No users found</p>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </MobileLayout>
    )
}
