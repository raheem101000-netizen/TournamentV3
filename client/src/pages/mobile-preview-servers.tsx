import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Loader2 } from "lucide-react";
import type { Server } from "@shared/schema";

export default function MobilePreviewServers() {
  const { data: servers, isLoading } = useQuery<Server[]>({
    queryKey: ["/api/mobile-preview/servers"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4" data-testid="page-title">Discover Servers</h1>
      <p className="text-sm text-muted-foreground mb-6" data-testid="page-description">
        Find and join gaming communities
      </p>
      
      <div className="space-y-3">
        {servers?.map((server) => (
          <Card 
            key={server.id} 
            className="hover-elevate overflow-hidden relative"
            data-testid={`server-card-${server.id}`}
          >
            {server.iconUrl && (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{ backgroundImage: `url(${server.iconUrl})` }}
                data-testid={`server-background-${server.id}`}
              />
            )}
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center gap-4">
                <Avatar data-testid={`server-avatar-${server.id}`}>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {server.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1" data-testid={`server-name-${server.id}`}>
                    {server.name}
                  </h3>
                  {server.description && (
                    <p className="text-sm text-muted-foreground mb-2" data-testid={`server-description-${server.id}`}>
                      {server.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1" data-testid={`server-members-${server.id}`}>
                      <Users className="h-4 w-4" />
                      <span>{server.memberCount} members</span>
                    </div>
                    {server.category && (
                      <span 
                        className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs"
                        data-testid={`server-category-${server.id}`}
                      >
                        {server.category}
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="default" 
                  size="sm"
                  data-testid={`button-join-${server.id}`}
                >
                  Join
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!servers || servers.length === 0 && (
        <div className="text-center py-12" data-testid="no-servers-message">
          <p className="text-muted-foreground">No servers available</p>
        </div>
      )}
    </div>
  );
}
