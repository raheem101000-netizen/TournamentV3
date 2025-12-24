import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageSquare, Megaphone, ChevronDown, ChevronUp } from "lucide-react";

interface CreateChannelDialogProps {
  serverId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ChannelType = "chat" | "announcements";

const CHAT_ICONS = [
  "💬", "📝", "🗣️", "💭", "🎮", "🕹️", "🎯", "⚡"
];

const ANNOUNCEMENT_ICONS = [
  "📢", "📣", "🔔", "📌", "📜", "🚨", "📡", "🎉"
];

const ALL_ICONS = [
  { category: "Text & Chat", icons: ["📝", "💬", "🗣️", "💭", "🗂️"] },
  { category: "Announcements", icons: ["📢", "📣", "🔔", "📌", "📜"] },
  { category: "Gaming", icons: ["🎮", "🕹️", "🏆", "⚔️", "🎯"] },
  { category: "Media", icons: ["🎨", "📸", "🎥", "🎵", "🎧"] },
  { category: "Community", icons: ["👋", "🙋", "🎉", "🌟", "❓"] },
  { category: "Admin", icons: ["🔐", "🛡️", "🚨", "⚙️", "🛠️"] },
  { category: "Economy", icons: ["💰", "🪙", "📊", "📈", "🏅"] },
  { category: "Other", icons: ["⚡", "🔥", "💎", "🎪", "📡"] },
];

export default function CreateChannelDialog({ serverId, open, onOpenChange }: CreateChannelDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [channelType, setChannelType] = useState<ChannelType>("chat");
  const [selectedIcon, setSelectedIcon] = useState("💬");
  const [showAllIcons, setShowAllIcons] = useState(false);

  const handleTypeChange = (type: ChannelType) => {
    setChannelType(type);
    setSelectedIcon(type === "announcements" ? "📢" : "💬");
  };

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
      setSelectedIcon("💬");
      setShowAllIcons(false);
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
      type: channelType,
      icon: selectedIcon,
      isPrivate: 0,
      slug,
      serverId,
      position: 999,
    });
  };

  const quickIcons = channelType === "announcements" ? ANNOUNCEMENT_ICONS : CHAT_ICONS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Add a new channel to your server.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
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
              onValueChange={(value) => handleTypeChange(value as ChannelType)}
              className="space-y-2"
            >
              <div 
                className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                  channelType === "chat" ? "border-primary bg-primary/5" : "border-border hover-elevate"
                }`}
                onClick={() => handleTypeChange("chat")}
              >
                <RadioGroupItem value="chat" id="type-chat" />
                <MessageSquare className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <Label htmlFor="type-chat" className="font-semibold cursor-pointer">
                    General Chat
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Everyone can send messages
                  </p>
                </div>
              </div>

              <div 
                className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                  channelType === "announcements" ? "border-primary bg-primary/5" : "border-border hover-elevate"
                }`}
                onClick={() => handleTypeChange("announcements")}
              >
                <RadioGroupItem value="announcements" id="type-announcements" />
                <Megaphone className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <Label htmlFor="type-announcements" className="font-semibold cursor-pointer">
                    Announcement
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Only owner/permitted users can post
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Channel Icon</Label>
            <div className="flex flex-wrap gap-2">
              {quickIcons.map((icon) => (
                <Button
                  key={icon}
                  type="button"
                  variant={selectedIcon === icon ? "default" : "outline"}
                  className="h-10 w-10 text-xl p-0"
                  onClick={() => setSelectedIcon(icon)}
                  data-testid={`icon-${icon}`}
                >
                  {icon}
                </Button>
              ))}
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAllIcons(!showAllIcons)}
              className="text-muted-foreground"
            >
              {showAllIcons ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Hide more icons
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Show more icons
                </>
              )}
            </Button>

            {showAllIcons && (
              <ScrollArea className="h-48 rounded-md border p-3">
                <div className="space-y-4">
                  {ALL_ICONS.map((category) => (
                    <div key={category.category}>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {category.category}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {category.icons.map((icon) => (
                          <Button
                            key={icon}
                            type="button"
                            variant={selectedIcon === icon ? "default" : "outline"}
                            className="h-9 w-9 text-lg p-0"
                            onClick={() => setSelectedIcon(icon)}
                            data-testid={`icon-all-${icon}`}
                          >
                            {icon}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
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
