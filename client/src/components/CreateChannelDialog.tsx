import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageSquare, Megaphone } from "lucide-react";

interface CreateChannelDialogProps {
  serverId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ChannelType = "chat" | "announcements";

export default function CreateChannelDialog({ serverId, open, onOpenChange }: CreateChannelDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [channelType, setChannelType] = useState<ChannelType>("chat");

  const createChannelMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; icon: string; isPrivate: number; slug: string; serverId: string; position: number }) => {
      return await apiRequest("POST", `/api/servers/${serverId}/channels`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/channels`] });
      toast({
        title: "Channel created",
        description: "Your new channel has been created successfully.",
      });
      onOpenChange(false);
      setName("");
      setChannelType("chat");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create channel",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Channel name is required",
        variant: "destructive",
      });
      return;
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const icon = channelType === "announcements" ? "📢" : "💬";
    
    createChannelMutation.mutate({
      name: name.trim(),
      type: channelType,
      icon,
      isPrivate: 0,
      slug,
      serverId,
      position: 999,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Add a new channel to your server.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="channel-name">Channel Name</Label>
            <Input
              id="channel-name"
              placeholder="e.g., general-chat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-channel-name"
            />
          </div>

          <div className="space-y-3">
            <Label>Channel Type</Label>
            <RadioGroup
              value={channelType}
              onValueChange={(value) => setChannelType(value as ChannelType)}
              className="space-y-3"
            >
              <div 
                className={`flex items-start gap-3 p-4 rounded-md border cursor-pointer transition-colors ${
                  channelType === "chat" ? "border-primary bg-primary/5" : "border-border hover-elevate"
                }`}
                onClick={() => setChannelType("chat")}
              >
                <RadioGroupItem value="chat" id="type-chat" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <Label htmlFor="type-chat" className="font-semibold cursor-pointer">
                      General Chat
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Everyone in the server can send messages in this channel.
                  </p>
                </div>
              </div>

              <div 
                className={`flex items-start gap-3 p-4 rounded-md border cursor-pointer transition-colors ${
                  channelType === "announcements" ? "border-primary bg-primary/5" : "border-border hover-elevate"
                }`}
                onClick={() => setChannelType("announcements")}
              >
                <RadioGroupItem value="announcements" id="type-announcements" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-primary" />
                    <Label htmlFor="type-announcements" className="font-semibold cursor-pointer">
                      Announcement Channel
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Only the server owner and users with permission can post messages.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createChannelMutation.isPending}
              data-testid="button-submit"
            >
              {createChannelMutation.isPending ? "Creating..." : "Create Channel"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
