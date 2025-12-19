import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Trash2, Shield, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Tournament, Achievement, Report, CustomerServiceMessage } from "@shared/schema";

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [achievementForm, setAchievementForm] = useState({
    userId: "",
    title: "",
    description: "",
    type: "solo" as const,
  });

  const [reportResponse, setReportResponse] = useState<{ [key: string]: string }>({});
  const [csResponse, setCsResponse] = useState<{ [key: string]: string }>({});

  // Check admin access
  if ((user as any)?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">Only admins can access this panel</p>
        <Button onClick={() => setLocation("/")} variant="outline">
          Go Home
        </Button>
      </div>
    );
  }

  // Fetch data
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: organizers } = useQuery<User[]>({
    queryKey: ["/api/admin/organizers"],
  });

  const { data: tournaments } = useQuery<Tournament[]>({
    queryKey: ["/api/admin/tournaments"],
  });

  const { data: reports } = useQuery<Report[]>({
    queryKey: ["/api/admin/reports"],
  });

  const { data: customerServiceMessages } = useQuery<CustomerServiceMessage[]>({
    queryKey: ["/api/admin/customer-service-messages"],
  });

  const { data: achievements } = useQuery<(Achievement & { username?: string })[]>({
    queryKey: ["/api/admin/achievements"],
  });

  // Mutations
  const giveAchievementMutation = useMutation({
    mutationFn: async () => {
      if (!achievementForm.userId || !achievementForm.title) {
        throw new Error("User and title are required");
      }
      return await apiRequest("POST", "/api/admin/achievements", {
        ...achievementForm,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/achievements"] });
      setAchievementForm({
        userId: "",
        title: "",
        description: "",
        type: "solo",
      });
      toast({ title: "Achievement given successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAchievementMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      return await apiRequest("DELETE", `/api/admin/achievements/${achievementId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/achievements"] });
      toast({ title: "Achievement deleted" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleOrganizerPermissionMutation = useMutation({
    mutationFn: async ({ organizerId, canGive }: { organizerId: string; canGive: boolean }) => {
      return await apiRequest(
        "PATCH",
        `/api/admin/organizers/${organizerId}/permissions`,
        { canGiveAchievements: canGive ? 1 : 0 }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizers"] });
      toast({ title: "Permission updated" });
    },
  });

  const changeUserRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      newRole,
    }: {
      userId: string;
      newRole: "player" | "organizer" | "admin";
    }) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}/role`, {
        role: newRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizers"] });
      toast({ title: "User role updated" });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}/ban`, {
        isBanned: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User banned" });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}/ban`, {
        isBanned: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User unbanned" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted" });
    },
  });

  const deleteTournamentMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      return await apiRequest("DELETE", `/api/admin/tournaments/${tournamentId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tournaments"] });
      toast({ title: "Tournament deleted" });
    },
  });

  const freezeTournamentMutation = useMutation({
    mutationFn: async ({
      tournamentId,
      frozen,
    }: {
      tournamentId: string;
      frozen: boolean;
    }) => {
      return await apiRequest("PATCH", `/api/admin/tournaments/${tournamentId}`, {
        isFrozen: frozen ? 1 : 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tournaments"] });
      toast({ title: "Tournament status updated" });
    },
  });

  const resolveReportMutation = useMutation({
    mutationFn: async ({
      reportId,
      status,
    }: {
      reportId: string;
      status: "resolved" | "dismissed";
    }) => {
      return await apiRequest("PATCH", `/api/admin/reports/${reportId}`, {
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({ title: "Report resolved" });
    },
  });

  const respondToCSMutation = useMutation({
    mutationFn: async ({
      messageId,
      response,
    }: {
      messageId: string;
      response: string;
    }) => {
      return await apiRequest("PATCH", `/api/admin/customer-service-messages/${messageId}`, {
        response,
        status: "resolved",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/customer-service-messages"],
      });
      setCsResponse({});
      toast({ title: "Response sent" });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setLocation("/")}
                data-testid="button-admin-back"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  Admin Panel
                </h1>
              </div>
            </div>
            <Badge variant="secondary">Super Admin</Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="customer-service">Support</TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6 mt-6">
            {/* Organizer Permissions */}
            <Card>
              <CardHeader>
                <CardTitle>Organizer Permissions</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Control which organizers can give achievements
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {organizers?.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`organizer-permission-${org.id}`}
                    >
                      <div>
                        <p className="font-semibold">{org.username}</p>
                        <p className="text-sm text-muted-foreground">{org.email}</p>
                      </div>
                      <Switch
                        checked={(org as any).canGiveAchievements !== 0}
                        onCheckedChange={(checked) => {
                          toggleOrganizerPermissionMutation.mutate({
                            organizerId: org.id,
                            canGive: checked,
                          });
                        }}
                        data-testid={`switch-organizer-${org.id}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Give Achievement */}
            <Card>
              <CardHeader>
                <CardTitle>Give Achievement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">User</label>
                  <Select value={achievementForm.userId} onValueChange={(val) => setAchievementForm((p) => ({ ...p, userId: val }))}>
                    <SelectTrigger data-testid="select-achievement-user">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Achievement title"
                    value={achievementForm.title}
                    onChange={(e) =>
                      setAchievementForm((p) => ({ ...p, title: e.target.value }))
                    }
                    data-testid="input-achievement-title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Achievement description"
                    value={achievementForm.description}
                    onChange={(e) =>
                      setAchievementForm((p) => ({ ...p, description: e.target.value }))
                    }
                    data-testid="textarea-achievement-description"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select value={achievementForm.type} onValueChange={(val: any) => setAchievementForm((p) => ({ ...p, type: val }))}>
                    <SelectTrigger data-testid="select-achievement-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => giveAchievementMutation.mutate()}
                  disabled={giveAchievementMutation.isPending}
                  className="w-full"
                  data-testid="button-give-achievement"
                >
                  {giveAchievementMutation.isPending ? "Giving..." : "Give Achievement"}
                </Button>
              </CardContent>
            </Card>

            {/* Achievements List */}
            <Card>
              <CardHeader>
                <CardTitle>All Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {achievements?.map((ach) => (
                    <div
                      key={ach.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`achievement-${ach.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{ach.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {ach.username} • {ach.type}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteAchievementMutation.mutate(ach.id)}
                        disabled={deleteAchievementMutation.isPending}
                        data-testid={`button-delete-achievement-${ach.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {users?.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`user-row-${u.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{u.username}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <Badge className="mt-2">{u.role}</Badge>
                        {u.isBanned ? (
                          <Badge variant="destructive" className="ml-2">
                            Banned
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={u.role || "player"}
                          onValueChange={(newRole: any) => {
                            changeUserRoleMutation.mutate({
                              userId: u.id,
                              newRole,
                            });
                          }}
                        >
                          <SelectTrigger className="w-32" data-testid={`select-user-role-${u.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="player">Player</SelectItem>
                            <SelectItem value="organizer">Organizer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        {!u.isBanned ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => banUserMutation.mutate(u.id)}
                            disabled={banUserMutation.isPending}
                            data-testid={`button-ban-${u.id}`}
                          >
                            Ban
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => unbanUserMutation.mutate(u.id)}
                            disabled={unbanUserMutation.isPending}
                            data-testid={`button-unban-${u.id}`}
                          >
                            Unban
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteUserMutation.mutate(u.id)}
                          disabled={deleteUserMutation.isPending}
                          data-testid={`button-delete-user-${u.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tournaments Tab */}
          <TabsContent value="tournaments" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {tournaments?.map((t: any) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`tournament-row-${t.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{t.name}</p>
                        <p className="text-sm text-muted-foreground">{t.format}</p>
                        <Badge className="mt-2">{t.status}</Badge>
                        {t.isFrozen ? (
                          <Badge variant="destructive" className="ml-2">
                            Frozen
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        {!t.isFrozen ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => freezeTournamentMutation.mutate({ tournamentId: t.id, frozen: true })}
                            disabled={freezeTournamentMutation.isPending}
                            data-testid={`button-freeze-${t.id}`}
                          >
                            Freeze
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => freezeTournamentMutation.mutate({ tournamentId: t.id, frozen: false })}
                            disabled={freezeTournamentMutation.isPending}
                            data-testid={`button-unfreeze-${t.id}`}
                          >
                            Unfreeze
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteTournamentMutation.mutate(t.id)}
                          disabled={deleteTournamentMutation.isPending}
                          data-testid={`button-delete-tournament-${t.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {reports?.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 border rounded-lg space-y-2"
                      data-testid={`report-${r.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{r.reason}</p>
                          <p className="text-sm text-muted-foreground">
                            Reported by: {r.reportedBy}
                          </p>
                        </div>
                        <Badge
                          variant={
                            r.status === "pending"
                              ? "secondary"
                              : r.status === "resolved"
                                ? "default"
                                : "outline"
                          }
                        >
                          {r.status}
                        </Badge>
                      </div>
                      {r.description && (
                        <p className="text-sm">{r.description}</p>
                      )}
                      {r.status === "pending" && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              resolveReportMutation.mutate({
                                reportId: r.id,
                                status: "resolved",
                              })
                            }
                            disabled={resolveReportMutation.isPending}
                            data-testid={`button-resolve-${r.id}`}
                          >
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              resolveReportMutation.mutate({
                                reportId: r.id,
                                status: "dismissed",
                              })
                            }
                            disabled={resolveReportMutation.isPending}
                            data-testid={`button-dismiss-${r.id}`}
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Service Tab */}
          <TabsContent value="customer-service" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Service Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {customerServiceMessages?.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 border rounded-lg space-y-2"
                      data-testid={`cs-message-${msg.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{msg.category}</p>
                          <p className="text-sm text-muted-foreground">
                            From: {msg.userId}
                          </p>
                        </div>
                        <Badge
                          variant={
                            msg.status === "new"
                              ? "secondary"
                              : msg.status === "in_progress"
                                ? "outline"
                                : "default"
                          }
                        >
                          {msg.status}
                        </Badge>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                      {msg.status !== "resolved" && (
                        <div className="space-y-2 pt-2">
                          <Textarea
                            placeholder="Your response..."
                            value={reportResponse[msg.id] || ""}
                            onChange={(e) =>
                              setReportResponse((p) => ({
                                ...p,
                                [msg.id]: e.target.value,
                              }))
                            }
                            data-testid={`textarea-response-${msg.id}`}
                          />
                          <Button
                            size="sm"
                            onClick={() =>
                              respondToCSMutation.mutate({
                                messageId: msg.id,
                                response: reportResponse[msg.id],
                              })
                            }
                            disabled={
                              !reportResponse[msg.id] || respondToCSMutation.isPending
                            }
                            data-testid={`button-respond-${msg.id}`}
                          >
                            Send Response
                          </Button>
                        </div>
                      )}
                      {msg.response && (
                        <div className="p-2 bg-muted rounded text-sm">
                          <p className="font-semibold mb-1">Response:</p>
                          <p>{msg.response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
