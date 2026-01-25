// Vercel Rebuild Trigger: Restoring Web Stability
import { useEffect, lazy, Suspense } from "react";
import { Switch, Route, Link, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";

// Lazy Load Components
const MobilePreviewHome = lazy(() => import("@/pages/mobile-preview-home"));
const MobilePreviewNotifications = lazy(() => import("@/pages/mobile-preview-notifications"));
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
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
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
const TeamProfile = lazy(() => import("@/pages/team-profile"));
const Particles = lazy(() => import("@/components/ui/particles"));

import { initializeApp } from "../../lib/initializeApp";

import { AppShellLoader } from "@/components/loaders/AppShellLoader";

function LazyLoadFallback() {
  return <AppShellLoader />;
}

function ProtectedRoute({ component: Component, ...rest }: { component: any }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AppShellLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AppShellLoader />;
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
        <Route path="/forgot-password">
          <ForgotPassword />
        </Route>
        <Route path="/reset-password">
          <ResetPassword />
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
          {() => <ProtectedRoute component={MobilePreviewHome} />}
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
        <Route path="/team/:id">
          {() => <TeamProfile />}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    // Enable dark mode by default for 10 on 10 theme
    document.documentElement.classList.add('dark');

    // PREFETCHING: Start fetching public data immediately (parallel to Auth check)
    // This removes the "Waterfall" effect where we wait for Auth -> Then fetch Data
    const prefetchData = async () => {
      try {
        await Promise.all([
          queryClient.prefetchQuery({ queryKey: ["/api/tournaments"] }),
          queryClient.prefetchQuery({ queryKey: ["/api/mobile-preview/servers"] })
        ]);
      } catch (e) {
        // Ignore prefetch errors - actual components will handle them/retry
        console.log('Prefetch hint:', e);
      }
    };
    prefetchData();
  }, []);



  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Suspense fallback={null}>
            <div className="fixed inset-0 z-50 pointer-events-none">
              <Particles
                particleColors={['#ffffff', '#ffffff', '#ffffff']}
                particleCount={150}
                particleSpread={20}
                speed={0.05}
                particleBaseSize={100}
                cameraDistance={15}
                sizeRandomness={0.3}
                moveParticlesOnHover={false}
                alphaParticles={false}
                disableRotation={false}
                className="w-full h-full"
              />
            </div>
          </Suspense>
          <div className="flex flex-col min-h-screen w-full bg-background text-foreground">
            {/* Desktop Header / Mobile Header handled per page */}
            <div className="flex-1 flex flex-col min-h-0 bg-background">
              <Router />
            </div>
          </div>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
