import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, UserMinus, Camera, Edit2, Loader2, X, Plus } from "lucide-react";

interface GroupParticipant {
    id: string;
    threadId: string;
    userId: string;
    role: "admin" | "member";
    joinedAt: string;
    user: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
    } | null;
}

interface GroupChatSettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    threadId: string;
    currentUserId: string;
}

export function GroupChatSettingsDrawer({
    isOpen,
    onClose,
    threadId,
    currentUserId,
}: GroupChatSettingsDrawerProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState("");
    const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    // Fetch group participants
    const { data: groupData, isLoading } = useQuery({
        queryKey: ["/api/threads", threadId, "participants"],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/threads/${threadId}/participants`);
            return res as {
                participants: GroupParticipant[];
                createdBy: string;
                groupName: string;
                groupIconUrl: string | null;
            };
        },
        enabled: isOpen && !!threadId,
    });

    // User search for adding members
    const { data: searchResults } = useQuery({
        queryKey: ["/api/users/search", searchQuery],
        queryFn: async () => {
            if (!searchQuery || searchQuery.length < 2) return [];
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
            if (!res.ok) throw new Error("Failed to search users");
            return res.json();
        },
        enabled: isAddMembersOpen && searchQuery.length >= 2,
    });

    // Check if current user is admin
    const isAdmin = groupData?.participants.some(
        (p) => p.userId === currentUserId && (p.role === "admin" || groupData.createdBy === currentUserId)
    );

    // Kick participant mutation
    const kickMutation = useMutation({
        mutationFn: async (userId: string) => {
            await apiRequest("DELETE", `/api/threads/${threadId}/participants/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/threads", threadId, "participants"] });
            queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
            toast({ title: "Member removed", description: "The member has been removed from the group." });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to remove member",
                variant: "destructive",
            });
        },
    });

    // Add participants mutation
    const addMembersMutation = useMutation({
        mutationFn: async (userIds: string[]) => {
            await apiRequest("POST", `/api/threads/${threadId}/participants`, { userIds });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/threads", threadId, "participants"] });
            queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
            setIsAddMembersOpen(false);
            setSelectedUserIds([]);
            setSearchQuery("");
            toast({ title: "Members added", description: "New members have been added to the group." });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to add members",
                variant: "destructive",
            });
        },
    });

    // Update group name mutation
    const updateNameMutation = useMutation({
        mutationFn: async (groupName: string) => {
            await apiRequest("PATCH", `/api/threads/${threadId}`, { groupName });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/threads", threadId, "participants"] });
            queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
            setIsEditingName(false);
            toast({ title: "Group name updated" });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update group name",
                variant: "destructive",
            });
        },
    });

    // Update group icon mutation
    const updateIconMutation = useMutation({
        mutationFn: async (groupIconUrl: string) => {
            await apiRequest("PATCH", `/api/threads/${threadId}`, { groupIconUrl });
        },
        onSuccess: async () => {
            // Force immediate refetch of both queries
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["/api/threads", threadId, "participants"] }),
                queryClient.invalidateQueries({ queryKey: ["/api/threads"] }),
            ]);
            await queryClient.refetchQueries({ queryKey: ["/api/threads"] });
            toast({ title: "Group icon updated" });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update group icon",
                variant: "destructive",
            });
        },
    });

    const handleKick = (userId: string, userName: string) => {
        if (confirm(`Are you sure you want to remove ${userName} from the group?`)) {
            kickMutation.mutate(userId);
        }
    };

    const handleSaveName = () => {
        if (editedName.trim()) {
            updateNameMutation.mutate(editedName.trim());
        }
    };

    const handleAddMembers = () => {
        if (selectedUserIds.length > 0) {
            addMembersMutation.mutate(selectedUserIds);
        }
    };

    // Filter out users who are already members
    const existingMemberIds = groupData?.participants.map((p) => p.userId) || [];
    const availableUsers = (searchResults || []).filter(
        (user: any) => !existingMemberIds.includes(user.id)
    );

    return (
        <>
            <Drawer open={isOpen} onOpenChange={onClose}>
                <DrawerContent className="bg-zinc-900 border-zinc-800 text-white pb-6">
                    <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader>
                            <DrawerTitle className="text-center text-xl font-bold">Group Settings</DrawerTitle>
                        </DrawerHeader>

                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                            </div>
                        ) : (
                            <div className="px-4 space-y-6 mt-4">
                                {/* Group Icon */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className="relative group">
                                        <Avatar className="h-24 w-24 border-2 border-zinc-700">
                                            <AvatarImage src={groupData?.groupIconUrl || undefined} />
                                            <AvatarFallback className="text-2xl">
                                                <Users className="h-12 w-12" />
                                            </AvatarFallback>
                                        </Avatar>
                                        {isAdmin && (
                                            <>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;

                                                        try {
                                                            const formData = new FormData();
                                                            formData.append("file", file);

                                                            const response = await fetch("/api/objects/upload", {
                                                                method: "POST",
                                                                body: formData,
                                                            });

                                                            if (!response.ok) throw new Error("Upload failed");

                                                            const data = await response.json();
                                                            updateIconMutation.mutate(data.url);
                                                        } catch (error) {
                                                            toast({
                                                                title: "Upload failed",
                                                                description: "Failed to upload image",
                                                                variant: "destructive",
                                                            });
                                                        }
                                                    }}
                                                    className="hidden"
                                                    id="group-icon-upload"
                                                    disabled={updateIconMutation.isPending}
                                                />
                                                <label
                                                    htmlFor="group-icon-upload"
                                                    className={`absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${updateIconMutation.isPending ? 'pointer-events-none' : 'cursor-pointer'
                                                        }`}
                                                >
                                                    {updateIconMutation.isPending ? (
                                                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                                                    ) : (
                                                        <Camera className="h-6 w-6 text-white" />
                                                    )}
                                                </label>
                                                {updateIconMutation.isPending && (
                                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-100">
                                                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Group Name */}
                                    <div className="flex items-center gap-2">
                                        {isEditingName ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={editedName}
                                                    onChange={(e) => setEditedName(e.target.value)}
                                                    className="bg-zinc-950 border-zinc-800 text-white"
                                                    placeholder="Group name"
                                                />
                                                <Button size="sm" onClick={handleSaveName} disabled={updateNameMutation.isPending}>
                                                    {updateNameMutation.isPending ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        "Save"
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setIsEditingName(false)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="font-bold text-lg">{groupData?.groupName}</h3>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => {
                                                            setEditedName(groupData?.groupName || "");
                                                            setIsEditingName(true);
                                                        }}
                                                        className="text-blue-500 hover:text-blue-400"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <p className="text-zinc-400 text-sm">
                                        {groupData?.participants.length} member{groupData?.participants.length !== 1 ? "s" : ""}
                                    </p>
                                </div>

                                <Separator className="bg-zinc-800" />

                                {/* Members Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold">Members</h4>
                                        {isAdmin && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setIsAddMembersOpen(true)}
                                                className="border-zinc-700 text-white bg-transparent hover:bg-zinc-800"
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add
                                            </Button>
                                        )}
                                    </div>

                                    {/* Members List */}
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {groupData?.participants.map((participant) => {
                                            const isCreator = participant.userId === groupData.createdBy;
                                            const canKick = isAdmin && !isCreator && participant.userId !== currentUserId;

                                            return (
                                                <div
                                                    key={participant.id}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 border border-zinc-700">
                                                            <AvatarImage src={participant.user?.avatarUrl || undefined} />
                                                            <AvatarFallback>
                                                                {participant.user?.username?.[0]?.toUpperCase() || "U"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium text-white">
                                                                {participant.user?.displayName || participant.user?.username}
                                                                {participant.userId === currentUserId && (
                                                                    <span className="text-zinc-500 ml-2">(You)</span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-zinc-500">
                                                                {isCreator ? "Creator" : participant.role === "admin" ? "Admin" : "Member"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {canKick && (
                                                        <button
                                                            onClick={() =>
                                                                handleKick(
                                                                    participant.userId,
                                                                    participant.user?.displayName || participant.user?.username || "User"
                                                                )
                                                            }
                                                            disabled={kickMutation.isPending}
                                                            className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                                                        >
                                                            <UserMinus className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="px-4 mt-6">
                            <DrawerClose asChild>
                                <Button
                                    variant="outline"
                                    className="w-full border-zinc-700 bg-transparent text-white hover:bg-zinc-800"
                                >
                                    Close
                                </Button>
                            </DrawerClose>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Add Members Dialog */}
            <Dialog open={isAddMembersOpen} onOpenChange={setIsAddMembersOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white w-[90%] max-w-md rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Add Members</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Search for users to add to the group.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-blue-600"
                        />

                        {/* Selected Users */}
                        {selectedUserIds.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedUserIds.map((id) => {
                                    const user = searchResults?.find((u: any) => u.id === id);
                                    return (
                                        <span
                                            key={id}
                                            className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"
                                        >
                                            {user?.displayName || user?.username || id}
                                            <button onClick={() => setSelectedUserIds((prev) => prev.filter((uid) => uid !== id))}>
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        {/* User List */}
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                            {availableUsers?.map((user: any) => (
                                <button
                                    key={user.id}
                                    onClick={() => {
                                        if (selectedUserIds.includes(user.id)) {
                                            setSelectedUserIds((prev) => prev.filter((id) => id !== user.id));
                                        } else {
                                            setSelectedUserIds((prev) => [...prev, user.id]);
                                        }
                                    }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${selectedUserIds.includes(user.id)
                                        ? "bg-blue-600/20 border border-blue-600"
                                        : "hover:bg-zinc-800"
                                        }`}
                                >
                                    <Avatar className="h-10 w-10 border border-zinc-700">
                                        <AvatarImage src={user.avatarUrl} />
                                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="font-medium text-white">{user.displayName || user.username}</div>
                                        <div className="text-sm text-zinc-500">@{user.username}</div>
                                    </div>
                                    {selectedUserIds.includes(user.id) && (
                                        <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
                                            <Plus className="h-3 w-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                            {searchQuery.length >= 2 && availableUsers?.length === 0 && (
                                <p className="text-center text-zinc-500 py-4">No users found</p>
                            )}
                        </div>

                        <Button
                            onClick={handleAddMembers}
                            disabled={selectedUserIds.length === 0 || addMembersMutation.isPending}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                        >
                            {addMembersMutation.isPending
                                ? "Adding..."
                                : `Add ${selectedUserIds.length} member${selectedUserIds.length !== 1 ? "s" : ""}`}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
