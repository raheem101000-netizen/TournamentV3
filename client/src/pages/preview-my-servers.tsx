import { useState } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Trophy, Server as ServerIcon, Search, Crown, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Server, ServerRole } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

type ServerFilter = "all" | "owned" | "member" | "roles";

interface ServerWithRoles extends Server {
  userRoles?: string[];
}

export default function PreviewMyServers() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<ServerFilter>("all");
  
  // Fetch servers where user is a member
  const { data: memberServersData, isLoading: memberLoading } = useQuery<Server[]>({
    queryKey: [`/api/users/${user?.id}/servers`],
    enabled: !!user?.id,
  });

  // Fetch server roles for current user
  const { data: userRolesData } = useQuery<ServerRole[]>({
    queryKey: [`/api/users/${user?.id}/roles`],
    enabled: !!user?.id,
  });

  const myServers = memberServersData || [];
  const userRoles = userRolesData || [];
  
  // Get unique server IDs where user has roles
  const serverIdsWithRoles = new Set(userRoles.map(role => role.serverId));
  
  // Separate servers into owned, member, and role-based servers
  const ownedServers = myServers.filter(server => server.ownerId === user?.id);
  const memberServers = myServers.filter(server => server.ownerId !== user?.id && !serverIdsWithRoles.has(server.id));
  const roleServers = myServers.filter(server => serverIdsWithRoles.has(server.id)).map(server => ({
    ...server,
    userRoles: userRoles.filter(r => r.serverId === server.id).map(r => r.name)
  }));
  
  // Filter servers based on selection
  const displayedServers = filter === "owned" ? ownedServers : filter === "member" ? memberServers : filter === "roles" ? roleServers : myServers;
  
  const isLoading = memberLoading;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold">My Servers</h1>
            <Button size="sm" data-testid="button-create-server">
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Badge
              variant={filter === "all" ? "default" : "outline"}
              className="cursor-pointer hover-elevate px-3 py-1 whitespace-nowrap"
              onClick={() => setFilter("all")}
              data-testid="filter-all"
            >
              All Servers ({myServers.length})
            </Badge>
            <Badge
              variant={filter === "owned" ? "default" : "outline"}
              className="cursor-pointer hover-elevate px-3 py-1 whitespace-nowrap"
              onClick={() => setFilter("owned")}
              data-testid="filter-owned"
            >
              <Crown className="w-3 h-3 mr-1" />
              Owned ({ownedServers.length})
            </Badge>
            <Badge
              variant={filter === "member" ? "default" : "outline"}
              className="cursor-pointer hover-elevate px-3 py-1 whitespace-nowrap"
              onClick={() => setFilter("member")}
              data-testid="filter-member"
            >
              <Users className="w-3 h-3 mr-1" />
              Member ({memberServers.length})
            </Badge>
            <Badge
              variant={filter === "roles" ? "default" : "outline"}
              className="cursor-pointer hover-elevate px-3 py-1 whitespace-nowrap"
              onClick={() => setFilter("roles")}
              data-testid="filter-roles"
            >
              <Shield className="w-3 h-3 mr-1" />
              Roles ({roleServers.length})
            </Badge>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading servers...</p>
          </div>
        ) : displayedServers.length > 0 ? (
          <div className="space-y-3">
            {displayedServers.map((server) => {
              const isOwned = server.ownerId === user?.id;
              return (
                <Link key={server.id} href={`/server/${server.id}`}>
                  <Card
                    className="p-4 hover-elevate cursor-pointer"
                    data-testid={isOwned ? `server-owned-${server.id}` : `server-member-${server.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14">
                        <AvatarImage 
                          src={server.iconUrl || undefined} 
                          alt={server.name} 
                        />
                        <AvatarFallback className="text-xl font-semibold">
                          {server.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg truncate">
                            {server.name}
                          </h3>
                          {isOwned && (
                            <Badge variant="secondary" className="flex-shrink-0">
                              <Crown className="w-3 h-3 mr-1" />
                              Owner
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{server.memberCount || 0} members</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <Button size="sm" variant="outline" data-testid={isOwned ? `button-manage-${server.id}` : `button-view-${server.id}`}>
                          {isOwned ? "Manage" : "View"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <ServerIcon className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No servers yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Join a server from the Discovery page to get started!
            </p>
            <Link href="/discovery">
              <Button data-testid="button-go-to-discovery">
                <Search className="w-4 h-4 mr-2" />
                Discover Servers
              </Button>
            </Link>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
