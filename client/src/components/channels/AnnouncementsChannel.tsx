import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone } from "lucide-react";

export default function AnnouncementsChannel() {
  const announcements = [
    {
      id: "1",
      title: "Welcome to the Server!",
      content: "Thanks for joining! Check out the tournament dashboard for upcoming competitions.",
      date: "2024-11-14",
      author: "Server Admin",
    },
    {
      id: "2",
      title: "Tournament Schedule Updated",
      content: "New tournaments have been added for next month. Visit the Tournament Dashboard to register your team.",
      date: "2024-11-13",
      author: "Tournament Manager",
    },
    {
      id: "3",
      title: "Server Rules",
      content: "Please be respectful to all members. No spam, harassment, or cheating will be tolerated.",
      date: "2024-11-10",
      author: "Moderator",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Server Announcements</h2>
      </div>

      {announcements.map((announcement) => (
        <Card key={announcement.id} data-testid={`announcement-${announcement.id}`}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <CardTitle className="text-base">{announcement.title}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Posted by {announcement.author} on {new Date(announcement.date).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                Announcement
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{announcement.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
