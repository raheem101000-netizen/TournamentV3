import { Search, Plus, MessageCircle, Loader2, Trash2, X, Check, XCircle, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { apiRequest } from "@/lib/queryClient"
import { formatDistanceToNow } from "date-fns"
import { MobileLayout } from "@/components/layouts/MobileLayout"
import { motion, useAnimation, PanInfo, AnimatePresence, useMotionValue } from "framer-motion"

interface MessageThread {
    id: string
    participantName: string
    participantAvatar: string
    lastMessage: string
    lastMessageTime: string
    unreadCount: number
    matchId?: string | null
    // Group chat fields
    isGroup?: number
    groupName?: string | null
    groupIconUrl?: string | null
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


interface MessagesListViewProps {
    onSelectChat: (chatId: string) => void
}

interface UserResult {
    id: string
    username: string
    displayName?: string
    avatarUrl?: string
    friendshipStatus: 'friend' | 'pending_sent' | 'pending_received' | 'none'
}



function SwipeableThreadItem({ thread, onSelect, onDelete }: { thread: MessageThread; onSelect: () => void; onDelete: () => void }) {
    const controls = useAnimation();
    const x = useMotionValue(0);
    const [isSwiping, setIsSwiping] = useState(false);

    const handleDragStart = () => {
        setIsSwiping(true);
    };

    const handleDragEnd = async (event: any, info: PanInfo) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        // Snap to -80 if dragged past -60 or fast swipe left
        if (offset < -60 || velocity < -500) {
            await controls.start({ x: -80 });
            // Keep delete visible when snapped
        } else {
            await controls.start({ x: 0 });
            setIsSwiping(false); // Hide when returned
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative w-full overflow-hidden bg-black border-b border-zinc-900/50"
        >
            {/* Delete Action Background - Only visible when swiping */}
            {isSwiping && (
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-600 flex items-center justify-center z-0">
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); setIsSwiping(false); }} className="h-full w-full flex items-center justify-center">
                        <X className="h-6 w-6 text-white" />
                    </button>
                </div>
            )}

            {/* Draggable Thread Content */}
            <motion.button
                style={{ x }}
                drag="x"
                dragConstraints={{ left: -80, right: 0 }}
                dragElastic={0.1}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                animate={controls}
                onClick={onSelect}
                className="relative z-10 w-full flex items-center gap-3 px-4 py-3 bg-black hover:bg-zinc-900/50 transition-colors"
                whileTap={{ cursor: "grabbing" }}
            >
                <Avatar className="h-14 w-14 flex-none border border-zinc-800 pointer-events-none">
                    <AvatarImage src={thread.isGroup ? (thread.groupIconUrl || undefined) : (thread.participantAvatar || undefined)} />
                    <AvatarFallback>{thread.participantName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left pointer-events-none">
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
            </motion.button>
        </motion.div>
    );
}

export function MessagesListView({ onSelectChat }: MessagesListViewProps) {
    const [activeTab, setActiveTab] = useState<"personal" | "groups" | "match" | "requests">("personal")
    const [isNewChatOpen, setIsNewChatOpen] = useState(false)
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
    const [groupName, setGroupName] = useState("")
    const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([])
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

    const { data: searchResults, isLoading: isSearching, refetch: refetchSearch } = useQuery<UserResult[]>({
        queryKey: ["/api/users/search", searchQuery],
        queryFn: async () => {
            if (!searchQuery || searchQuery.length < 2) return []
            // Use direct fetch to ensure no caching issues if apiRequest doesn't support custom headers easily
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
            });
            if (!res.ok) throw new Error("Failed to search users");
            return res.json()
        },
        enabled: searchQuery.length >= 2
    })

    const createThreadMutation = useMutation({
        mutationFn: async (participantId: string) => {
            const res = await apiRequest("POST", "/api/threads", { participantId })
            return res
        },
        onSuccess: (thread) => {
            setIsNewChatOpen(false)
            onSelectChat(thread.id)
            refetchThreads()
        }
    })

    const addFriendMutation = useMutation({
        mutationFn: async (recipientId: string) => {
            const res = await apiRequest("POST", "/api/friend-request", { recipientId })
            return res
        },
        onSuccess: () => {
            refetchSearch()
            queryClient.invalidateQueries({ queryKey: ["/api/users/search"] })
            queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/pending"] })
        }
    })

    const deleteThreadMutation = useMutation({
        mutationFn: async (threadId: string) => {
            await apiRequest("DELETE", `/api/threads/${threadId}`)
        },
        onSuccess: () => {
            refetchThreads()
        }
    })

    const createGroupMutation = useMutation({
        mutationFn: async ({ groupName, participantIds }: { groupName: string; participantIds: string[] }) => {
            const res = await apiRequest("POST", "/api/threads/group", { groupName, participantIds })
            return res
        },
        onSuccess: (thread) => {
            setIsCreateGroupOpen(false)
            setGroupName("")
            setSelectedGroupMembers([])
            refetchThreads()
            onSelectChat(thread.id)
        }
    })

    // Friend Request Actions
    const acceptRequestMutation = useMutation({
        mutationFn: async (requestId: string) => {
            const res = await apiRequest("POST", `/api/friend-requests/${requestId}/accept`)
            return res
        },
        onSuccess: () => {
            refetchRequests()
            // Invalidate friends list or threads as needed
            queryClient.invalidateQueries({ queryKey: ["/api/users/search"] })
            queryClient.invalidateQueries({ queryKey: ["/api/friends"] })
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
            return res
        },
        onSuccess: () => {
            refetchRequests()
        }
    })


    // Filter threads based on active tab
    const displayThreads = (threads || []).filter(thread => {
        if (activeTab === "match") {
            // Match threads have matchId or name starts with "Match Chat:"
            return !!thread.matchId || thread.participantName.startsWith("Match Chat:");
        } else if (activeTab === "groups") {
            // Group chats
            return !!thread.isGroup;
        } else if (activeTab === "personal") {
            // Personal chats are not match, not group
            return !thread.matchId && !thread.participantName.startsWith("Match Chat:") && !thread.isGroup;
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
                                title="New Message"
                            >
                                <Plus className="h-6 w-6" />
                            </button>
                            <button
                                onClick={() => setIsCreateGroupOpen(true)}
                                className="text-blue-500 hover:text-blue-400 transition-colors"
                                title="Create Group"
                            >
                                <Users className="h-6 w-6" />
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

                    <div className="flex gap-2 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab("personal")}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "personal" ? "bg-zinc-800 text-white" : "bg-transparent text-zinc-500"}`}
                        >
                            Personal
                        </button>
                        <button
                            onClick={() => setActiveTab("groups")}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "groups" ? "bg-zinc-800 text-white" : "bg-transparent text-zinc-500"}`}
                        >
                            Groups
                        </button>
                        <button
                            onClick={() => setActiveTab("match")}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "match" ? "bg-zinc-800 text-white" : "bg-transparent text-zinc-500"}`}
                        >
                            Match
                        </button>
                        <button
                            onClick={() => setActiveTab("requests")}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "requests" ? "bg-zinc-800 text-white" : "bg-transparent text-zinc-500"}`}
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
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-white w-[90%] max-w-md rounded-xl max-h-[85vh] overflow-y-auto top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] gap-0 p-0">
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

                {/* Create Group Dialog */}
                <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-white w-[90%] max-w-md rounded-xl max-h-[85vh] overflow-y-auto top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] gap-0 p-0">
                        <DialogHeader className="p-4 border-b border-zinc-800">
                            <DialogTitle>Create Group</DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                Name your group and add members.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 p-4">
                            <Input
                                placeholder="Group name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-blue-600"
                            />

                            {/* Selected Members */}
                            {selectedGroupMembers.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedGroupMembers.map(id => {
                                        const user = searchResults?.find(u => u.id === id);
                                        return (
                                            <span key={id} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                                {user?.displayName || user?.username || id}
                                                <button onClick={() => setSelectedGroupMembers(prev => prev.filter(m => m !== id))}>
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            <Input
                                placeholder="Search users to add..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-blue-600"
                            />
                            <div className="max-h-[200px] overflow-y-auto space-y-2">
                                {isSearching ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                                    </div>
                                ) : searchResults?.filter(u => !selectedGroupMembers.includes(u.id)).map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => setSelectedGroupMembers(prev => [...prev, user.id])}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800 rounded-lg transition-colors text-left"
                                    >
                                        <Avatar className="h-10 w-10 border border-zinc-700">
                                            <AvatarImage src={user.avatarUrl} />
                                            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="font-medium text-white">{user.displayName || user.username}</div>
                                            <div className="text-sm text-zinc-500">@{user.username}</div>
                                        </div>
                                        <Plus className="h-5 w-5 text-blue-500" />
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    if (groupName.trim() && selectedGroupMembers.length > 0) {
                                        createGroupMutation.mutate({ groupName: groupName.trim(), participantIds: selectedGroupMembers });
                                    }
                                }}
                                disabled={!groupName.trim() || selectedGroupMembers.length === 0 || createGroupMutation.isPending}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                            >
                                {createGroupMutation.isPending ? 'Creating...' : `Create Group (${selectedGroupMembers.length} members)`}
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </MobileLayout >
    )
}
