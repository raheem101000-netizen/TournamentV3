import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Trash2, Settings, Loader2 } from "lucide-react";
import type { Channel } from "@shared/schema";

const channelSchema = z.object({
    name: z.string().min(2, "Channel name must be at least 2 characters"),
    icon: z.string().min(1, "Icon is required"),
});

interface ChannelSettingsDialogProps {
    channelId: string;
    serverId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDeleted?: () => void;
}

export function ChannelSettingsDialog({
    channelId,
    serverId,
    open,
    onOpenChange,
    onDeleted,
}: ChannelSettingsDialogProps) {
    const { toast } = useToast();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { data: channel, isLoading } = useQuery<Channel>({
        queryKey: [`/api/channels/${channelId}`],
        enabled: open && !!channelId,
    });

    const form = useForm({
        resolver: zodResolver(channelSchema),
        defaultValues: {
            name: "",
            icon: "📝",
        },
    });

    useEffect(() => {
        if (channel) {
            form.reset({
                name: channel.name || "",
                icon: channel.icon || "📝",
            });
        }
    }, [channel, form]);

    const updateMutation = useMutation({
        mutationFn: async (data: z.infer<typeof channelSchema>) => {
            return await apiRequest("PATCH", `/api/channels/${channelId}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/channels`] });
            queryClient.invalidateQueries({ queryKey: [`/api/channels/${channelId}`] });
            toast({
                title: "Channel updated",
                description: "Channel settings have been saved.",
            });
            onOpenChange(false);
        },
        onError: (error: Error) => {
            toast({
                title: "Update failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            return await apiRequest("DELETE", `/api/channels/${channelId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/channels`] });
            toast({
                title: "Channel deleted",
                description: "The channel has been permanently deleted.",
            });
            onOpenChange(false);
            onDeleted?.();
        },
        onError: (error: Error) => {
            toast({
                title: "Delete failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: z.infer<typeof channelSchema>) => {
        updateMutation.mutate(data);
    };

    const EMOJI_OPTIONS = ["📝", "💬", "📢", "🎮", "🏆", "📊", "🎯", "⚙️", "📸", "🔒"];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Channel Settings
                    </DialogTitle>
                    <DialogDescription>
                        Edit channel details or delete this channel.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Channel Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="general-chat"
                                                data-testid="input-channel-name"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="icon"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Channel Icon</FormLabel>
                                        <div className="flex flex-wrap gap-2">
                                            {EMOJI_OPTIONS.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => field.onChange(emoji)}
                                                    className={`w-10 h-10 text-xl rounded-lg border transition-all ${field.value === emoji
                                                            ? "border-primary bg-primary/10 scale-110"
                                                            : "border-border hover:border-primary/50"
                                                        }`}
                                                    data-testid={`icon-option-${emoji}`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Custom emoji"
                                                className="mt-2"
                                                data-testid="input-channel-icon"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="flex flex-col gap-3 sm:flex-row">
                                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            className="w-full sm:w-auto"
                                            data-testid="button-delete-channel"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Channel
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete this channel?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete <span className="font-semibold">{channel?.name}</span> and all its messages. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                onClick={() => deleteMutation.mutate()}
                                                disabled={deleteMutation.isPending}
                                                data-testid="button-confirm-delete"
                                            >
                                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                <Button
                                    type="submit"
                                    disabled={updateMutation.isPending}
                                    className="w-full sm:w-auto"
                                    data-testid="button-save-channel"
                                >
                                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
