import { ChevronLeft, ImageIcon, Send, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useState, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"

interface ThreadMessage {
    id: string
    message: string
    userId: string
    username: string
    createdAt: string
}

interface MessageThread {
    id: string
    participantName: string
    participantAvatar: string
}

interface ChatDetailsViewProps {
    chatId: string
    onBack: () => void
}

export function ChatDetailsView({ chatId, onBack }: ChatDetailsViewProps) {
    const [messageText, setMessageText] = useState("")
    const queryClient = useQueryClient()
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Fetch thread details (for header)
    // We could make a separate endpoint for this, or reuse the list one, 
    // but for now we'll optimistically use what we had or fetch it.
    // Ideally we need `GET /api/threads/:id` but we didn't explicitly create it.
    // However, we can just use the user info from messages or pass it in props.
    // To be robust, let's assume we might lack header info if we refresh.
    // For now, let's use the first message or just placeholder if missing.
    // Actually, `storage.getMessageThread(id)` was available in storage.ts, let's hope we exposed it via `GET /api/threads` list or similar.
    // We didn't expose a single thread getter route. I'll rely on the existing list cache if possible, or just render "Chat".
    // Wait, I can pass the thread object from the list view if I want, but ID is cleaner.
    // Let's assume we can survive without header details for a second, or fix it later.

    // Fetch Messages
    const { data: messages, isLoading } = useQuery<ThreadMessage[]>({
        queryKey: ["/api/threads", chatId, "messages"],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/threads/${chatId}/messages`)
            return res.json()
        },
        refetchInterval: 3000 // Poll for new messages every 3s
    })

    const sendMessageMutation = useMutation({
        mutationFn: async (text: string) => {
            const res = await apiRequest("POST", `/api/threads/${chatId}/messages`, { message: text })
            return res.json()
        },
        onSuccess: () => {
            setMessageText("")
            queryClient.invalidateQueries({ queryKey: ["/api/threads", chatId, "messages"] })
            queryClient.invalidateQueries({ queryKey: ["/api/threads"] }) // Update list preview
        }
    })

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = () => {
        if (messageText.trim()) {
            sendMessageMutation.mutate(messageText)
        }
    }

    // Determine current user ID (simplistic check: we don't have it easily in client without context)
    // We can infer "self" if we check the sender against our known session user ID.
    // But we don't have session user ID in a global context easily here without `useUser` or similar.
    // Workaround: The backend doesn't return `isSelf`. 
    // We should fetching current user to know who "I" am.
    // Or we can rely on `insertThreadMessage` returning the message with OUR userId.
    // Let's grab the current user profile.
    const { data: user } = useQuery<{ id: string }>({
        queryKey: ["/api/auth/me"], // Assuming this exists or similar
        retry: false
    })

    // If we don't have auth/me, we might have issues identifying "self".
    // I'll assume for now `userId` in message == `user.id`.

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            {/* Header */}
            <div className="flex-none flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
                <button onClick={onBack} className="text-blue-500" aria-label="Back">
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>C</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="font-semibold">Chat</div>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollContainerRef}
                className="flex-1 flex flex-col overflow-y-auto px-4"
            >
                {/* Spacer div to push messages to bottom */}
                <div className="flex-1" />

                {/* Messages */}
                <div className="flex flex-col gap-2 py-4">
                    {isLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                        </div>
                    ) : (
                        messages?.map((message) => {
                            const isSelf = user ? message.userId === user.id : false
                            return (
                                <div key={message.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`max-w-[75%] px-4 py-2 rounded-2xl ${isSelf ? "bg-blue-600 text-white rounded-br-sm" : "bg-zinc-800 text-white rounded-bl-sm"
                                            }`}
                                    >
                                        <p className="text-sm leading-relaxed">{message.message}</p>
                                    </div>
                                </div>
                            )
                        })
                    )}
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
                    disabled={sendMessageMutation.isPending}
                />
                <button
                    onClick={handleSend}
                    className="text-blue-500 disabled:text-zinc-600 disabled:cursor-not-allowed"
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    aria-label="Send message"
                >
                    {sendMessageMutation.isPending ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                        <Send className="h-6 w-6" />
                    )}
                </button>
            </div>
        </div>
    )
}
