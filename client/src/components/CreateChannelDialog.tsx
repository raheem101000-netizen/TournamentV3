import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CreateChannelDialogProps {
  serverId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHANNEL_ICONS = [
  { category: "Text Channels", icons: [
    { emoji: "📝", label: "Text channel" },
    { emoji: "📢", label: "Announcements" },
    { emoji: "💬", label: "General chat" },
    { emoji: "🗂️", label: "Threads" },
  ]},
  { category: "Voice Channels", icons: [
    { emoji: "🔊", label: "Voice channel" },
    { emoji: "🎤", label: "Stage channel" },
    { emoji: "🎧", label: "Listening/music channel" },
  ]},
  { category: "Categories", icons: [
    { emoji: "📁", label: "Folder/category" },
    { emoji: "📂", label: "Sub-category" },
  ]},
  { category: "Bots & Automations", icons: [
    { emoji: "🤖", label: "Bot channel" },
    { emoji: "🛠️", label: "Admin tools" },
    { emoji: "⚙️", label: "Settings" },
  ]},
  { category: "Gaming Channels", icons: [
    { emoji: "🎮", label: "Gaming" },
    { emoji: "🕹️", label: "Controller" },
    { emoji: "🏆", label: "Tournaments" },
  ]},
  { category: "Media Channels", icons: [
    { emoji: "🎨", label: "Art" },
    { emoji: "📸", label: "Photos" },
    { emoji: "🎥", label: "Videos" },
    { emoji: "🎵", label: "Music" },
  ]},
  { category: "Information Channels", icons: [
    { emoji: "📌", label: "Rules" },
    { emoji: "📜", label: "Guidelines" },
    { emoji: "📢", label: "Announcements" },
    { emoji: "❓", label: "Help / FAQ" },
    { emoji: "📣", label: "Updates" },
  ]},
  { category: "Economy / Points", icons: [
    { emoji: "💰", label: "Money / economy" },
    { emoji: "🪙", label: "Coins / credits" },
    { emoji: "📊", label: "Stats" },
    { emoji: "📝", label: "Leaderboards" },
  ]},
  { category: "Community", icons: [
    { emoji: "👋", label: "Welcome" },
    { emoji: "🙋", label: "Introductions" },
    { emoji: "🗣️", label: "Discussion" },
    { emoji: "🎉", label: "Events" },
  ]},
  { category: "Security / Staff", icons: [
    { emoji: "🔐", label: "Staff-only" },
    { emoji: "🛡️", label: "Moderation" },
    { emoji: "🚨", label: "Reports" },
  ]},
];

export default function CreateChannelDialog({ serverId, open, onOpenChange }: CreateChannelDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  const [selectedIcon, setSelectedIcon] = useState("📝");
  const [isPrivate, setIsPrivate] = useState(false);

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
      setType("text");
      setSelectedIcon("📝");
      setIsPrivate(false);
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
    createChannelMutation.mutate({
      name: name.trim(),
      type,
      icon: selectedIcon,
      isPrivate: isPrivate ? 1 : 0,
      slug,
      serverId,
      position: 999, // Will be sorted at the end
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Add a new channel to your server. Choose an icon and customize the settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="channel-type">Channel Type</Label>
            <Input
              id="channel-type"
              placeholder="e.g., text, voice, announcement"
              value={type}
              onChange={(e) => setType(e.target.value)}
              data-testid="input-channel-type"
            />
          </div>

          <div className="space-y-2">
            <Label>Channel Icon</Label>
            <ScrollArea className="h-64 rounded-md border p-4">
              <div className="space-y-4">
                {CHANNEL_ICONS.map((category) => (
                  <div key={category.category}>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {category.category}
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {category.icons.map((icon) => (
                        <Button
                          key={icon.emoji}
                          type="button"
                          variant={selectedIcon === icon.emoji ? "default" : "outline"}
                          className="h-12 text-2xl"
                          onClick={() => setSelectedIcon(icon.emoji)}
                          data-testid={`icon-${icon.emoji}`}
                        >
                          {icon.emoji}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="private-channel">Private Channel</Label>
            <Switch
              id="private-channel"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              data-testid="switch-private"
            />
          </div>

          <div className="flex gap-2 pt-4">
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
