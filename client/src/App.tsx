import { useEffect, lazy, Suspense } from "react";
import { Switch, Route, Link, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import PreviewHome from "@/pages/preview-home";
import Login from "@/pages/login";
import Register from "@/pages/register";

const MobilePreviewHome = lazy(() => import("@/pages/mobile-preview-home"));
const MobilePreviewServers = lazy(() => import("@/pages/mobile-preview-servers"));
const MobilePreviewMessages = lazy(() => import("@/pages/mobile-preview-messages"));
const MobilePreviewNotifications = lazy(() => import("@/pages/mobile-preview-notifications"));
const MobilePreviewMyServers = lazy(() => import("@/pages/mobile-preview-myservers"));
const MobilePreviewServerDetail = lazy(() => import("@/pages/mobile-preview-server-detail"));
const MobilePreviewAccount = lazy(() => import("@/pages/mobile-preview-account"));
const PreviewDiscovery = lazy(() => import("@/pages/preview-discovery"));
const PreviewMessages = lazy(() => import("@/pages/preview-messages"));
const PreviewMyServers = lazy(() => import("@/pages/preview-my-servers"));
const PreviewServerDetail = lazy(() => import("@/pages/preview-server-detail"));
const PreviewAccount = lazy(() => import("@/pages/preview-account"));
const PreviewPosterBuilder = lazy(() => import("@/pages/preview-poster-builder"));
const PreviewCreateTeam = lazy(() => import("@/pages/preview-create-team"));
const PreviewOrganizerAward = lazy(() => import("@/pages/preview-organizer-award"));
const PreviewTemplates = lazy(() => import("@/pages/preview-templates"));
const PreviewAdminTemplates = lazy(() => import("@/pages/preview-admin-templates"));
const AccountSettings = lazy(() => import("@/pages/account-settings"));
const ServerSettings = lazy(() => import("@/pages/server-settings"));
const VerifyEmail = lazy(() => import("@/pages/verify"));
const CheckEmail = lazy(() => import("@/pages/check-email"));
const CreateServer = lazy(() => import("@/pages/create-server"));
const CreateTournament = lazy(() => import("@/pages/create-tournament"));
const ChatRoom = lazy(() => import("@/pages/chat-room"));
const TeamBuilder = lazy(() => import("@/pages/team-builder"));
const TournamentMatch = lazy(() => import("@/pages/tournament-match"));
const TournamentRegister = lazy(() => import("@/pages/tournament-register"));
const AdminPanel = lazy(() => import("@/pages/admin-panel"));
const Profile = lazy(() => import("@/pages/profile"));
const ServerPreview = lazy(() => import("@/pages/server-preview"));
const TournamentPublicView = lazy(() => import("@/pages/tournament-public-view"));

import { User, Search, Bell, Trophy, Server, MessageSquare, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { initializeApp } from "../../lib/initializeApp";

function LazyLoadFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

const appItems = [
  { title: "Home", url: "/", icon: Trophy },
  { title: "Discovery", url: "/discovery", icon: Search },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "My Servers", url: "/myservers", icon: Server },
  { title: "Account", url: "/account", icon: User },
];

function AppSidebar() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Check if user is admin
  const { data: adminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: isAuthenticated,
  });

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>10 on 10</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {appItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {adminCheck?.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/admin"}>
                    <Link href="/admin" data-testid="link-admin">
                      <Shield />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function ProtectedRoute({ component: Component, ...rest }: { component: any }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<LazyLoadFallback />}>
    <Switch>
      <Route path="/register">
        {() => isAuthenticated ? <Redirect to="/" /> : <Register />}
      </Route>
      <Route path="/login">
        {() => isAuthenticated ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route path="/verify">
        <VerifyEmail />
      </Route>
      <Route path="/check-email">
        <CheckEmail />
      </Route>
      
      <Route path="/create-server">
        {() => <ProtectedRoute component={CreateServer} />}
      </Route>
      <Route path="/create-tournament">
        {() => <ProtectedRoute component={CreateTournament} />}
      </Route>
      <Route path="/chat/:matchId">
        {() => <ProtectedRoute component={ChatRoom} />}
      </Route>
      <Route path="/team-builder">
        {() => <ProtectedRoute component={TeamBuilder} />}
      </Route>
      <Route path="/tournament/:tournamentId/match/:matchId">
        {() => <ProtectedRoute component={TournamentMatch} />}
      </Route>
      <Route path="/tournament/:id/register">
        {() => <ProtectedRoute component={TournamentRegister} />}
      </Route>
      <Route path="/tournament/:id/view">
        {() => <TournamentPublicView />}
      </Route>
      <Route path="/server/:serverId/preview">
        {() => <ServerPreview />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminPanel} />}
      </Route>
      <Route path="/">
        {() => <ProtectedRoute component={PreviewHome} />}
      </Route>
      <Route path="/discovery">
        {() => <ProtectedRoute component={PreviewDiscovery} />}
      </Route>
      <Route path="/messages">
        {() => <ProtectedRoute component={PreviewMessages} />}
      </Route>
      <Route path="/myservers">
        {() => <ProtectedRoute component={PreviewMyServers} />}
      </Route>
      <Route path="/server/:serverId">
        {() => <ProtectedRoute component={PreviewServerDetail} />}
      </Route>
      <Route path="/server/:serverId/settings">
        {() => <ProtectedRoute component={ServerSettings} />}
      </Route>
      <Route path="/account">
        {() => <ProtectedRoute component={PreviewAccount} />}
      </Route>
      <Route path="/account/settings">
        {() => <ProtectedRoute component={AccountSettings} />}
      </Route>
      <Route path="/poster-builder">
        {() => <ProtectedRoute component={PreviewPosterBuilder} />}
      </Route>
      <Route path="/create-team">
        {() => <ProtectedRoute component={PreviewCreateTeam} />}
      </Route>
      <Route path="/organizer-award">
        {() => <ProtectedRoute component={PreviewOrganizerAward} />}
      </Route>
      <Route path="/templates">
        {() => <ProtectedRoute component={PreviewTemplates} />}
      </Route>
      <Route path="/admin/templates">
        {() => <ProtectedRoute component={PreviewAdminTemplates} />}
      </Route>
      
      <Route path="/profile/:userId">
        {() => <ProtectedRoute component={Profile} />}
      </Route>
      <Route path="/notifications">
        {() => <ProtectedRoute component={MobilePreviewNotifications} />}
      </Route>
      
      <Route path="/old" component={MobilePreviewHome} />
      <Route path="/old/discovery" component={MobilePreviewServers} />
      <Route path="/old/messages" component={MobilePreviewMessages} />
      <Route path="/old/notifications" component={MobilePreviewNotifications} />
      <Route path="/old/myservers" component={MobilePreviewMyServers} />
      <Route path="/old/server/:serverId" component={MobilePreviewServerDetail} />
      <Route path="/old/account" component={MobilePreviewAccount} />
      
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    // Temporarily skip initialization for testing
    // initializeApp();
    
    // Enable dark mode by default for 10 on 10 theme
    document.documentElement.classList.add('dark');
  }, []);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1">
                <header className="flex items-center justify-between p-2 border-b">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <h1 className="text-lg font-semibold">10 on 10</h1>
                  <div className="w-9" />
                </header>
                <main className="flex-1 overflow-y-auto">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
