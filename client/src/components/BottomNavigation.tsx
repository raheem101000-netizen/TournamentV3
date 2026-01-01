import { Home, Compass, MessageCircle, Server, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/discovery", icon: Compass, label: "Discovery" },
  { path: "/messages", icon: MessageCircle, label: "Messages" },
  { path: "/myservers", icon: Server, label: "My Servers" },
  { path: "/account", icon: User, label: "Account" },
];

export function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/message-threads/unread-count"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count || 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          const showBadge = item.path === "/messages" && unreadCount > 0;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors hover-elevate active-elevate-2",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive && "fill-current")} />
                {showBadge && (
                  <span 
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full"
                    data-testid="badge-unread-messages"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
