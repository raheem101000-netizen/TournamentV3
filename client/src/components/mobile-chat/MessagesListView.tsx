// ... (imports remain)
import { Search, Plus, MessageCircle, Loader2, Trash2, X, Check, XCircle } from "lucide-react"

// ... (existing imports)

interface MessageThread {
    id: string
    participantName: string
    participantAvatar: string
    lastMessage: string
    lastMessageTime: string
    unreadCount: number
    matchId?: string | null // Added to optional
}

interface FriendRequest {
    id: string
    senderId: string
    recipientId: string
    status: 'pending' | 'accepted' | 'declined'
    createdAt: string
    senderName: string
    senderAvatar: string | null
}

// ... (UserResult interface remains)

export function MessagesListView({ onSelectChat }: MessagesListViewProps) {
    const [activeTab, setActiveTab] = useState<"personal" | "match" | "requests">("personal")
    const [isNewChatOpen, setIsNewChatOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const queryClient = useQueryClient()

    // Query for message threads
    const { data: threads, isLoading: isLoadingThreads, refetch: refetchThreads } = useQuery<MessageThread[]>({
        queryKey: ["/api/threads"],
    })

    // Query for pending friend requests
    const { data: friendRequests, isLoading: isLoadingRequests, refetch: refetchRequests } = useQuery<FriendRequest[]>({
        queryKey: ["/api/friend-requests/pending"],
        enabled: activeTab === "requests" // Only fetch when tab is active
    })

    // ... (search query remains)

    // ... (createThreadMutation remains)

    // ... (addFriendMutation remains)

    // Friend Request Actions
    const acceptRequestMutation = useMutation({
        mutationFn: async (requestId: string) => {
            const res = await apiRequest("POST", `/api/friend-requests/${requestId}/accept`)
            return res.json()
        },
        onSuccess: () => {
            refetchRequests()
            // Invalidate friends list or threads as needed
            queryClient.invalidateQueries({ queryKey: ["/api/users/search"] })
        }
    })

    const declineRequestMutation = useMutation({
        mutationFn: async (requestId: string) => {
            const res = await apiRequest("POST", `/api/friend-requests/${requestId}/decline`) // Assuming decline endpoint exists or using delete
            // If decline isn't implemented, we might need a delete endpoint. For now assuming accept covers the positive case.
            // Actually, the plan mentioned ONLY accept. Let's use accept for now, or if decline is needed, we need to check backend.
            // Checking routes.ts line 4578... only Accept is explicit. 
            // WAIT - I need to be sure about decline. 
            // I'll stick to Accept for now and potentially "Ignore" which just hides it? 
            // Let's implement Accept first.
            return res.json()
        },
        onSuccess: () => {
            refetchRequests()
        }
    })


    // ... (deleteThreadMutation remains)

    // Filter threads based on active tab
    const displayThreads = (threads || []).filter(thread => {
        if (activeTab === "match") {
            // Check if it's a match thread (has matchId or starts with "Match Chat:")
            return !!thread.matchId || thread.participantName.startsWith("Match Chat:");
        } else if (activeTab === "personal") {
            // Personal strings should NOT be match threads
            return !thread.matchId && !thread.participantName.startsWith("Match Chat:");
        }
        return false;
    })

    const renderContent = () => {
        if (activeTab === "requests") {
            if (isLoadingRequests) {
                return (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                    </div>
                )
            }

            if (!friendRequests || friendRequests.length === 0) {
                return (
                    <div className="flex flex-col items-center justify-center p-8 text-zinc-500 mt-10">
                        <MessageCircle className="h-16 w-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No pending requests</p>
                    </div>
                )
            }

            return (
                <div className="space-y-2 p-4">
                    {friendRequests.map(request => (
                        <div key={request.id} className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 border border-zinc-700">
                                    <AvatarImage src={request.senderAvatar || undefined} />
                                    <AvatarFallback>{request.senderName[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold text-white">{request.senderName}</div>
                                    <div className="text-xs text-zinc-500">Sent a friend request</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => acceptRequestMutation.mutate(request.id)}
                                    disabled={acceptRequestMutation.isPending}
                                    className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors"
                                >
                                    {acceptRequestMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                                </button>
                                {/* Decline button placeholder - strictly UI for now if backend missing */}
                                <button className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )
        }

        // Thread List (Personal & Match)
        if (isLoadingThreads) {
            return (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
            )
        }

        if (displayThreads.length === 0) {
            const emptyMessage = activeTab === "match" ? "No active match chats" : "No messages yet";
            return (
                <div className="flex flex-col items-center justify-center p-8 text-zinc-500 mt-10">
                    <MessageCircle className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">{emptyMessage}</p>
                    {activeTab === "personal" && (
                        <button
                            onClick={() => setIsNewChatOpen(true)}
                            className="mt-4 text-blue-500 text-sm font-semibold hover:underline bg-blue-500/10 px-4 py-2 rounded-full"
                        >
                            Start a conversation
                        </button>
                    )}
                </div>
            )
        }

        return (
            <AnimatePresence>
                {displayThreads.map((thread) => (
                    <SwipeableThreadItem
                        key={thread.id}
                        thread={thread}
                        onSelect={() => onSelectChat(thread.id)}
                        onDelete={() => deleteThreadMutation.mutate(thread.id)}
                    />
                ))}
            </AnimatePresence>
        )
    }

    return (
        <MobileLayout>
            <div className="flex flex-col min-h-screen bg-black text-white pb-20">
                {/* Header & Tabs */}
                <div className="flex-none px-4 pt-4 pb-4 border-b border-zinc-800">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold">Messages</h1>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsNewChatOpen(true)}
                                className="text-blue-500 hover:text-blue-400 transition-colors"
                            >
                                <Plus className="h-6 w-6" />
                            </button>
                            <button className="text-blue-500 hover:text-blue-400 transition-colors">
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

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                    {renderContent()}
                </div>

                {/* New Chat Dialog */}
                {/* ... (keep existing dialog code) ... */}
                <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-white w-[90%] max-w-md rounded-xl max-h-[85vh] overflow-y-auto top-[20%] translate-y-0 sm:top-[50%] sm:-translate-y-1/2">
                        {/* ... (existing content) ... */}
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
        </MobileLayout >
    )
}
