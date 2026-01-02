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
    <nav className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      {/* Glass container with floating effect */}
      <div className="mx-4 mb-4 rounded-2xl glass-heavy border-white/10 shadow-lg shadow-black/5 overflow-hidden">
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
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-300 relative group",
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
              >
                {/* Active Indicator Glow */}
                {isActive && (
                  <div className="absolute inset-0 bg-primary/10 rounded-xl mx-2 my-1 animate-fade-in" />
                )}

                <div className="relative z-10 transition-transform duration-300 group-hover:-translate-y-1 group-active:scale-95">
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-all duration-300",
                      isActive ? "text-primary fill-primary/20 scale-110" : "text-muted-foreground group-hover:text-primary/80"
                    )}
                  />
                  {showBadge && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse shadow-md"
                      data-testid="badge-unread-messages"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-300",
                  isActive ? "text-primary translate-y-0 opacity-100" : "text-muted-foreground translate-y-1 opacity-70 group-hover:translate-y-0 group-hover:opacity-100"
                )}>
                  {item.label}
                </span>

                {/* Bottom Active Dot */}
                {isActive && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary shadow-glow animate-scale-in" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
