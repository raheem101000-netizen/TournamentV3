import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import ImageUploadField from "@/components/ImageUploadField";
import {
  Server as ServerIcon,
  Shield,
  Ban,
  Link as LinkIcon,
  Copy,
  Trash2,
  Plus,
  X,
  ArrowLeft,
  Users,
} from "lucide-react";
import type {
  Server,
  ServerRole,
  ServerBan,
  ServerInvite,
  ServerMember,
  User,
} from "@shared/schema";

const DEMO_USER_ID = "user-demo-123";

const serverProfileSchema = z.object({
  name: z.string().min(3, "Server name must be at least 3 characters"),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
  welcomeMessage: z.string().max(2000, "Welcome message must be 2000 characters or less").optional(),
  iconUrl: z.string().optional(),
  backgroundUrl: z.string().optional(),
});

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  color: z.string().default("#99AAB5"),
  permissions: z.array(z.string()).default([]),
});

const banSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  reason: z.string().optional(),
});

const inviteSchema = z.object({
  expiresAt: z.string().optional(),
  maxUses: z.coerce.number().int().positive().optional(),
});

const memberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  customTitle: z.string().optional(),
  explicitPermissions: z.array(z.string()).default([]),
});

const AVAILABLE_PERMISSIONS = [
  "manage_server",
  "manage_roles",
  "manage_channels",
  "kick_members",
  "ban_members",
  "manage_messages",
  "mention_everyone",
  "manage_tournaments",
  "tournament_dashboard_access",
];

export default function ServerSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, params] = useRoute("/server/:serverId/settings");
  const [, navigate] = useLocation();
  const serverId = params?.serverId;

  const [iconUrl, setIconUrl] = useState<string>("");
  const [backgroundUrl, setBackgroundUrl] = useState<string>("");

  const { data: server, isLoading: serverLoading } = useQuery<Server>({
    queryKey: [`/api/servers/${serverId}`],
    enabled: !!serverId,
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery<ServerRole[]>({
    queryKey: [`/api/servers/${serverId}/roles`],
    enabled: !!serverId,
  });

  const { data: bans = [], isLoading: bansLoading } = useQuery<ServerBan[]>({
    queryKey: [`/api/servers/${serverId}/bans`],
    enabled: !!serverId,
  });

  const { data: invites = [], isLoading: invitesLoading } = useQuery<ServerInvite[]>({
    queryKey: [`/api/servers/${serverId}/invites`],
    enabled: !!serverId,
  });

  const serverForm = useForm({
    resolver: zodResolver(serverProfileSchema),
    defaultValues: {
      name: "",
      description: "",
      welcomeMessage: "",
      iconUrl: "",
      backgroundUrl: "",
    },
  });

  useEffect(() => {
    if (server && !serverForm.formState.isDirty) {
      serverForm.reset({
        name: server.name || "",
        description: server.description || "",
        welcomeMessage: server.welcomeMessage || "",
        iconUrl: server.iconUrl || "",
        backgroundUrl: server.backgroundUrl || "",
      });
      setIconUrl(server.iconUrl || "");
      setBackgroundUrl(server.backgroundUrl || "");
    }
  }, [server, serverForm]);

  const roleForm = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      color: "#99AAB5",
      permissions: [],
    },
  });

  const banForm = useForm({
    resolver: zodResolver(banSchema),
    defaultValues: {
      userId: "",
      reason: "",
    },
  });

  const inviteForm = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      expiresAt: "",
      maxUses: undefined,
    },
  });

  const memberForm = useForm({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      userId: "",
      customTitle: "",
      explicitPermissions: [],
    },
  });

  const { data: members = [], isLoading: membersLoading } = useQuery<ServerMember[]>({
    queryKey: [`/api/servers/${serverId}/members`],
    enabled: !!serverId,
  });

  const updateServerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof serverProfileSchema>) => {
      return await apiRequest("PATCH", `/api/servers/${serverId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}`] });
      toast({
        title: "Server updated",
        description: "Server settings have been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof roleSchema>) => {
      return await apiRequest("POST", `/api/servers/${serverId}/roles`, {
        ...data,
        position: roles.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/roles`] });
      roleForm.reset();
      toast({
        title: "Role created",
        description: "New role has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return await apiRequest("DELETE", `/api/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/roles`] });
      toast({
        title: "Role deleted",
        description: "Role has been removed.",
      });
    },
  });

  const createBanMutation = useMutation({
    mutationFn: async (data: z.infer<typeof banSchema>) => {
      return await apiRequest("POST", `/api/servers/${serverId}/bans`, {
        ...data,
        bannedBy: DEMO_USER_ID,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/bans`] });
      banForm.reset();
      toast({
        title: "User banned",
        description: "User has been banned from the server.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to ban user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unbanMutation = useMutation({
    mutationFn: async (banId: string) => {
      return await apiRequest("DELETE", `/api/bans/${banId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/bans`] });
      toast({
        title: "User unbanned",
        description: "User has been unbanned from the server.",
      });
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof inviteSchema>) => {
      const payload: any = {
        createdBy: DEMO_USER_ID,
      };
      if (data.expiresAt) {
        payload.expiresAt = new Date(data.expiresAt).toISOString();
      }
      if (data.maxUses) {
        payload.maxUses = data.maxUses;
      }
      return await apiRequest("POST", `/api/servers/${serverId}/invites`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/invites`] });
      inviteForm.reset();
      toast({
        title: "Invite created",
        description: "New invite link has been generated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create invite",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      return await apiRequest("DELETE", `/api/invites/${inviteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/invites`] });
      toast({
        title: "Invite deleted",
        description: "Invite link has been removed.",
      });
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (data: z.infer<typeof memberSchema>) => {
      return await apiRequest("POST", `/api/servers/${serverId}/members`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/members`] });
      memberForm.reset();
      toast({
        title: "Member added",
        description: "Member has been added with custom permissions.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<z.infer<typeof memberSchema>> }) => {
      return await apiRequest("PATCH", `/api/servers/${serverId}/members/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/members`] });
      toast({
        title: "Member updated",
        description: "Member permissions have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/servers/${serverId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/members`] });
      toast({
        title: "Member removed",
        description: "Member has been removed from server.",
      });
    },
  });

  const onServerSubmit = (data: z.infer<typeof serverProfileSchema>) => {
    updateServerMutation.mutate({
      ...data,
      iconUrl: iconUrl || data.iconUrl,
      backgroundUrl: backgroundUrl || data.backgroundUrl,
    });
  };

  const onRoleSubmit = (data: z.infer<typeof roleSchema>) => {
    createRoleMutation.mutate(data);
  };

  const onBanSubmit = (data: z.infer<typeof banSchema>) => {
    createBanMutation.mutate(data);
  };

  const onMemberSubmit = (data: z.infer<typeof memberSchema>) => {
    createMemberMutation.mutate(data);
  };

  const onInviteSubmit = (data: z.infer<typeof inviteSchema>) => {
    createInviteMutation.mutate(data);
  };

  const copyInviteLink = (code: string) => {
    const inviteLink = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard.",
    });
  };

  if (serverLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading server settings...</p>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Server not found</p>
      </div>
    );
  }

  // Only server owner can access settings
  if (!user || server.ownerId !== user.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Shield className="w-10 h-10 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            Only the server owner can access settings.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/server/${serverId}`)}>
          Back to Server
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/server/${serverId}`)}
            data-testid="button-back-to-server"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Server
          </Button>
          <h1 className="text-3xl font-bold">Server Settings</h1>
          <p className="text-muted-foreground mt-1">{server.name}</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <ServerIcon className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="roles" data-testid="tab-roles">
              <Shield className="w-4 h-4 mr-2" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="members" data-testid="tab-members">
              <Users className="w-4 h-4 mr-2" />
              Members
            </TabsTrigger>
            <TabsTrigger value="bans" data-testid="tab-bans">
              <Ban className="w-4 h-4 mr-2" />
              Bans
            </TabsTrigger>
            <TabsTrigger value="invites" data-testid="tab-invites">
              <LinkIcon className="w-4 h-4 mr-2" />
              Invites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Server Profile</CardTitle>
                <CardDescription>
                  Update your server's name, description, and branding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...serverForm}>
                  <form onSubmit={serverForm.handleSubmit(onServerSubmit)} className="space-y-6">
                    <FormField
                      control={serverForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Server Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter server name"
                              data-testid="input-server-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={serverForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe your server"
                              rows={4}
                              data-testid="input-server-description"
                            />
                          </FormControl>
                          <FormDescription>
                            Tell people what your server is about
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={serverForm.control}
                      name="welcomeMessage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Welcome Page Message</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Welcome to our server! Here you'll find..."
                              rows={6}
                              data-testid="input-welcome-message"
                            />
                          </FormControl>
                          <FormDescription>
                            This message is shown on the Welcome Page when people visit or join your server
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div>
                        <Label>Server Icon</Label>
                        <ImageUploadField
                          value={iconUrl}
                          onChange={setIconUrl}
                          label="Upload server icon"
                        />
                      </div>

                      <div>
                        <Label>Server Background</Label>
                        <ImageUploadField
                          value={backgroundUrl}
                          onChange={setBackgroundUrl}
                          label="Upload server background"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={updateServerMutation.isPending}
                      data-testid="button-save-server-profile"
                    >
                      {updateServerMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Role</CardTitle>
                <CardDescription>Add a new role with custom permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...roleForm}>
                  <form onSubmit={roleForm.handleSubmit(onRoleSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={roleForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g., Moderator"
                                data-testid="input-role-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={roleForm.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role Color</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="color"
                                data-testid="input-role-color"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={roleForm.control}
                      name="permissions"
                      render={() => (
                        <FormItem>
                          <FormLabel>Permissions</FormLabel>
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            {AVAILABLE_PERMISSIONS.map((permission) => (
                              <FormField
                                key={permission}
                                control={roleForm.control}
                                name="permissions"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={(field.value as string[])?.includes(permission)}
                                        onCheckedChange={(checked) => {
                                          const current = (field.value as string[]) || [];
                                          field.onChange(
                                            checked
                                              ? [...current, permission]
                                              : current.filter((p: string) => p !== permission)
                                          );
                                        }}
                                        data-testid={`checkbox-permission-${permission}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                      {permission.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={createRoleMutation.isPending}
                      data-testid="button-create-role"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Server Roles</CardTitle>
                <CardDescription>Manage existing roles and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                {rolesLoading ? (
                  <p className="text-muted-foreground">Loading roles...</p>
                ) : roles.length === 0 ? (
                  <p className="text-muted-foreground">No roles created yet</p>
                ) : (
                  <div className="space-y-3">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center justify-between p-4 border rounded-md"
                        data-testid={`role-item-${role.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: role.color || "#99AAB5" }}
                          />
                          <div>
                            <p className="font-medium" data-testid={`text-role-name-${role.id}`}>
                              {role.name}
                            </p>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {role.permissions?.map((perm) => (
                                <Badge key={perm} variant="secondary" className="text-xs">
                                  {perm.replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRoleMutation.mutate(role.id)}
                          data-testid={`button-delete-role-${role.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Member Permissions</CardTitle>
                <CardDescription>Grant specific permissions to server members</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...memberForm}>
                  <form onSubmit={memberForm.handleSubmit(onMemberSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={memberForm.control}
                        name="userId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>User ID</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter user ID"
                                data-testid="input-member-user-id"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={memberForm.control}
                        name="customTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom Title (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g., Tournament Manager"
                                data-testid="input-member-custom-title"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={memberForm.control}
                      name="explicitPermissions"
                      render={() => (
                        <FormItem>
                          <FormLabel>Permissions</FormLabel>
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            {AVAILABLE_PERMISSIONS.map((permission) => (
                              <FormField
                                key={permission}
                                control={memberForm.control}
                                name="explicitPermissions"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={(field.value as string[])?.includes(permission)}
                                        onCheckedChange={(checked) => {
                                          const current = (field.value as string[]) || [];
                                          field.onChange(
                                            checked
                                              ? [...current, permission]
                                              : current.filter((p: string) => p !== permission)
                                          );
                                        }}
                                        data-testid={`checkbox-member-permission-${permission}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                      {permission.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={createMemberMutation.isPending}
                      data-testid="button-add-member"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {createMemberMutation.isPending ? "Adding..." : "Add Member"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Server Members</CardTitle>
                <CardDescription>Manage member permissions and access</CardDescription>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <p className="text-muted-foreground">Loading members...</p>
                ) : members.length === 0 ? (
                  <p className="text-muted-foreground">No members with custom permissions yet</p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border rounded-md"
                        data-testid={`member-item-${member.id}`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium" data-testid={`text-member-id-${member.id}`}>
                              User: {member.userId}
                            </p>
                            {member.customTitle && (
                              <Badge variant="secondary" className="text-xs">
                                {member.customTitle}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {member.explicitPermissions?.map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {perm.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMemberMutation.mutate(member.userId)}
                          data-testid={`button-delete-member-${member.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bans" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ban User</CardTitle>
                <CardDescription>Remove a user from the server</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...banForm}>
                  <form onSubmit={banForm.handleSubmit(onBanSubmit)} className="space-y-4">
                    <FormField
                      control={banForm.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User ID</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter user ID to ban"
                              data-testid="input-ban-user-id"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={banForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Why are you banning this user?"
                              rows={3}
                              data-testid="input-ban-reason"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={createBanMutation.isPending}
                      data-testid="button-ban-user"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      {createBanMutation.isPending ? "Banning..." : "Ban User"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Banned Users</CardTitle>
                <CardDescription>View and manage banned users</CardDescription>
              </CardHeader>
              <CardContent>
                {bansLoading ? (
                  <p className="text-muted-foreground">Loading bans...</p>
                ) : bans.length === 0 ? (
                  <p className="text-muted-foreground">No banned users</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Banned By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bans.map((ban) => (
                        <TableRow key={ban.id} data-testid={`ban-row-${ban.id}`}>
                          <TableCell className="font-mono text-sm" data-testid={`text-banned-user-${ban.id}`}>
                            {ban.userId}
                          </TableCell>
                          <TableCell>{ban.reason || "No reason provided"}</TableCell>
                          <TableCell className="font-mono text-sm">{ban.bannedBy}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => unbanMutation.mutate(ban.id)}
                              data-testid={`button-unban-${ban.id}`}
                            >
                              Unban
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invites" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Invite</CardTitle>
                <CardDescription>Generate a new invite link for your server</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...inviteForm}>
                  <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={inviteForm.control}
                        name="expiresAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expires At (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="datetime-local"
                                data-testid="input-invite-expires"
                              />
                            </FormControl>
                            <FormDescription>Leave empty for no expiration</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={inviteForm.control}
                        name="maxUses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Uses (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder="Unlimited"
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                                }
                                data-testid="input-invite-max-uses"
                              />
                            </FormControl>
                            <FormDescription>Leave empty for unlimited</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={createInviteMutation.isPending}
                      data-testid="button-create-invite"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {createInviteMutation.isPending ? "Creating..." : "Create Invite"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Invites</CardTitle>
                <CardDescription>Manage your server's invite links</CardDescription>
              </CardHeader>
              <CardContent>
                {invitesLoading ? (
                  <p className="text-muted-foreground">Loading invites...</p>
                ) : invites.length === 0 ? (
                  <p className="text-muted-foreground">No active invites</p>
                ) : (
                  <div className="space-y-3">
                    {invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-4 border rounded-md"
                        data-testid={`invite-item-${invite.id}`}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded" data-testid={`text-invite-code-${invite.id}`}>
                              {invite.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyInviteLink(invite.code)}
                              data-testid={`button-copy-invite-${invite.id}`}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            {invite.expiresAt && (
                              <span>Expires: {new Date(invite.expiresAt).toLocaleDateString()}</span>
                            )}
                            {invite.maxUses && (
                              <span>Max uses: {invite.maxUses}</span>
                            )}
                            <span>Used: {invite.currentUses || 0} times</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteInviteMutation.mutate(invite.id)}
                          data-testid={`button-delete-invite-${invite.id}`}
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
