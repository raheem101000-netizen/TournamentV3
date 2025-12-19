import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Server as ServerIcon, Users, Crown, Search } from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Server } from "@shared/schema";

export default function MobilePreviewMyServers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  // Fetch all servers to determine owned servers
  const { data: allServers = [], isLoading: isLoadingAll } = useQuery<Server[]>({
    queryKey: ["/api/mobile-preview/servers"],
  });

  // Fetch servers user is a member of
  const currentUserId = "user-demo-123"; // TODO: Replace with real auth
  const { data: memberServersList = [], isLoading: isLoadingMember } = useQuery<Server[]>({
    queryKey: [`/api/users/${currentUserId}/servers`],
  });

  const isLoading = isLoadingAll || isLoadingMember;

  if (isLoading) {
    return (
      <div className="p-4 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">My Servers</h1>
        <p className="text-sm text-muted-foreground">Loading servers...</p>
      </div>
    );
  }

  const ownedServers = allServers.filter(s => s.ownerId === currentUserId);
  
  // Get all available game tags from all servers for filtering
  const allGameTags = Array.from(
    new Set(allServers.flatMap(s => s.gameTags || []))
  ).sort();
  
  // Filter servers based on search and game selection
  const filterServers = (servers: Server[]) => {
    return servers.filter(server => {
      const matchesSearch = searchQuery === "" || 
        server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGame = !selectedGame || 
        (server.gameTags && server.gameTags.includes(selectedGame));
      
      return matchesSearch && matchesGame;
    });
  };
  
  const filteredOwnedServers = filterServers(ownedServers);
  const filteredMemberServers = filterServers(memberServersList);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4" data-testid="page-title">My Servers</h1>
      <p className="text-sm text-muted-foreground mb-4" data-testid="page-description">
        Your gaming communities and tournament servers
      </p>

      {/* Search and Filter */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search servers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-servers"
          />
        </div>

        {allGameTags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={selectedGame === null ? "default" : "outline"}
              className="cursor-pointer hover-elevate active-elevate-2"
              onClick={() => setSelectedGame(null)}
              data-testid="badge-filter-all"
            >
              All Games
            </Badge>
            {allGameTags.map((game) => (
              <Badge
                key={game}
                variant={selectedGame === game ? "default" : "outline"}
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => setSelectedGame(game)}
                data-testid={`badge-filter-${game.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {game}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {filteredOwnedServers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Owned Servers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOwnedServers.map((server) => (
              <Link key={server.id} href={`/server/${server.id}`}>
                <Card 
                  className="hover-elevate active-elevate-2 cursor-pointer transition-all" 
                  data-testid={`card-server-${server.id}`}
                >
                  <CardHeader className="space-y-1 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Avatar className="w-12 h-12 rounded-md">
                        <AvatarImage 
                          src={server.iconUrl ? `${window.location.origin}${server.iconUrl}` : ''} 
                          alt={server.name} 
                        />
                        <AvatarFallback className="rounded-md">
                          {server.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <Badge variant="outline" className="text-xs">
                        {server.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-base line-clamp-1">{server.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {server.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{server.memberCount?.toLocaleString()} members</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {filteredMemberServers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Servers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMemberServers.map((server) => (
              <Link key={server.id} href={`/server/${server.id}`}>
                <Card 
                  className="hover-elevate active-elevate-2 cursor-pointer transition-all" 
                  data-testid={`card-server-${server.id}`}
                >
                  <CardHeader className="space-y-1 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Avatar className="w-12 h-12 rounded-md">
                        <AvatarImage 
                          src={server.iconUrl ? `${window.location.origin}${server.iconUrl}` : ''} 
                          alt={server.name} 
                        />
                        <AvatarFallback className="rounded-md">
                          {server.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <Badge variant="outline" className="text-xs">
                        {server.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-base line-clamp-1">{server.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {server.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{server.memberCount?.toLocaleString()} members</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {filteredOwnedServers.length === 0 && filteredMemberServers.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              {searchQuery || selectedGame ? "No servers match your filters" : "No servers found"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
