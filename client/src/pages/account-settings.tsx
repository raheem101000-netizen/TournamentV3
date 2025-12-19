import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import ImageUploadField from "@/components/ImageUploadField";
import { User, Lock, Globe, HelpCircle, UserX, Trash2, Mail, Trophy, Medal, Award, Target, Shield, Zap } from "lucide-react";
import type { User as UserType } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address").optional(),
  displayName: z.string().optional(),
  bio: z.string().max(200, "Bio must be 200 characters or less").optional(),
  avatarUrl: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AccountSettings() {
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: [`/api/users/${authUser?.id}`],
    enabled: !!authUser?.id,
  });

  const { data: achievements = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${authUser?.id}/achievements`],
    enabled: !!authUser?.id,
  });

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      email: "",
      displayName: "",
      bio: "",
      avatarUrl: "",
    },
  });

  // Hydrate form when user data loads
  useEffect(() => {
    if (user && !profileForm.formState.isDirty) {
      profileForm.reset({
        username: user.username || "",
        email: user.email || "",
        displayName: user.displayName || "",
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user, profileForm]);

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      if (!authUser?.id) {
        throw new Error("Not authenticated");
      }
      console.log('[UpdateMutation] Sending PATCH with data:', JSON.stringify(data, null, 2));
      const response = await apiRequest("PATCH", `/api/users/${authUser.id}`, data);
      const json = await response.json();
      console.log('[UpdateMutation] Response:', json);
      return json;
    },
    onSuccess: (response: any) => {
      console.log('[UpdateMutation] onSuccess triggered, response:', response);
      
      // Reset form with the response data to ensure UI updates immediately
      profileForm.reset({
        username: response.username || "",
        email: response.email || "",
        displayName: response.displayName || "",
        bio: response.bio || "",
        avatarUrl: response.avatarUrl || "",
      });
      
      // Invalidate user profile queries immediately
      queryClient.invalidateQueries({ queryKey: [`/api/users/${authUser?.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Clear ALL cache related to messages and users to ensure fresh data
      queryClient.removeQueries({ queryKey: ['/api/matches'] });
      
      // Invalidate all message queries with proper matching
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && 
                 queryKey.some(key => typeof key === 'string' && key.includes('/messages'));
        },
      });
      
      // Invalidate tournament queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && 
                 typeof queryKey[0] === 'string' && 
                 (queryKey[0].includes('/api/tournaments') || 
                  queryKey[0].includes('/api/servers'));
        },
      });
      
      toast({
        title: "Profile updated successfully",
        description: "Your changes have been saved and synchronized across all views.",
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

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordSchema>) => {
      if (!authUser?.id) {
        throw new Error("Not authenticated");
      }
      return await apiRequest("POST", `/api/users/${authUser.id}/password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disableAccountMutation = useMutation({
    mutationFn: async () => {
      if (!authUser?.id) {
        throw new Error("Not authenticated");
      }
      return await apiRequest("PATCH", `/api/users/${authUser.id}`, { isDisabled: 1 });
    },
    onSuccess: () => {
      toast({
        title: "Account disabled",
        description: "Your account has been disabled.",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!authUser?.id) {
        throw new Error("Not authenticated");
      }
      return await apiRequest("DELETE", `/api/users/${authUser.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been logged out.",
      });
      window.location.href = "/login";
    },
  });

  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    console.log('[ProfileSubmit] Submitting form data:', JSON.stringify(data, null, 2));
    console.log('[ProfileSubmit] avatarUrl in data:', data.avatarUrl);
    if (!data.avatarUrl || data.avatarUrl.trim() === '') {
      console.warn('[ProfileSubmit] Warning: avatarUrl is empty');
    }
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
    updatePasswordMutation.mutate(data);
  };

  if (!authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Please log in to access account settings</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" data-testid="heading-settings">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" data-testid="tab-profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            <Lock className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="achievements" data-testid="tab-achievements">
            <Trophy className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="preferences" data-testid="tab-preferences">
            <Globe className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="danger" data-testid="tab-danger">
            <UserX className="w-4 h-4 mr-2" />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your public profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="flex items-start gap-6">
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={profileForm.watch('avatarUrl') || user?.avatarUrl || ""} />
                        <AvatarFallback>
                          {user?.username?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <ImageUploadField
                        value={profileForm.watch('avatarUrl')}
                        onChange={(url) => {
                          profileForm.setValue('avatarUrl', url, { shouldDirty: true });
                        }}
                        label="Change Avatar"
                        placeholder="Enter avatar URL"
                      />
                    </div>

                    <div className="flex-1 space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-username" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormDescription>Your email address for notifications</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-display-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-bio" placeholder="Tell us about yourself" />
                            </FormControl>
                            <FormDescription>Max 200 characters</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} data-testid="input-current-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} data-testid="input-new-password" />
                        </FormControl>
                        <FormDescription>At least 8 characters</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} data-testid="input-confirm-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={updatePasswordMutation.isPending}
                    data-testid="button-change-password"
                  >
                    {updatePasswordMutation.isPending ? "Updating..." : "Change Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Awards earned in tournaments</CardDescription>
            </CardHeader>
            <CardContent>
              {achievements && achievements.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {achievements.map((achievement: any) => {
                    const getIcon = () => {
                      const iconMap: { [key: string]: any } = {
                        "champion": Trophy,
                        "runner-up": Medal,
                        "third-place": Medal,
                        "mvp": Award,
                        "top-scorer": Target,
                        "best-defense": Shield,
                        "rising-star": Zap,
                      };
                      const IconComponent = iconMap[achievement.iconUrl] || Trophy;
                      return <IconComponent className="w-8 h-8" />;
                    };

                    const getColor = () => {
                      const colorMap: { [key: string]: string } = {
                        "champion": "text-amber-500",
                        "runner-up": "text-slate-300",
                        "third-place": "text-amber-700",
                        "mvp": "text-purple-500",
                        "top-scorer": "text-red-500",
                        "best-defense": "text-green-500",
                        "rising-star": "text-yellow-500",
                      };
                      return colorMap[achievement.iconUrl] || "text-muted-foreground";
                    };

                    return (
                      <div 
                        key={achievement.id} 
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border hover-elevate"
                        data-testid={`achievement-${achievement.id}`}
                      >
                        <div className={getColor()}>
                          {getIcon()}
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-sm">{achievement.title}</p>
                          {achievement.description && (
                            <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No achievements yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Earn achievements by competing in tournaments!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Language & Preferences</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select defaultValue={user?.language || "en"} data-testid="select-language">
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
              <CardDescription>Get help when you need it</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" data-testid="button-contact-support">
                <HelpCircle className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logout</CardTitle>
              <CardDescription>Sign out of your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending} data-testid="button-logout">
                Logout
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Disable Account</h3>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable your account. You can reactivate it anytime.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" data-testid="button-disable-account">
                      <UserX className="w-4 h-4 mr-2" />
                      Disable Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disable your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your account will be temporarily disabled. You can reactivate it by logging in again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => disableAccountMutation.mutate()}
                        data-testid="button-confirm-disable"
                      >
                        Disable
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-semibold text-destructive">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" data-testid="button-delete-account">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Permanently delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. All your data, including tournaments, teams, and achievements will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteAccountMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-testid="button-confirm-delete"
                      >
                        Delete Forever
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
