import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  colorScheme: z.string().optional(),
});

type CreateTeamForm = z.infer<typeof createTeamSchema>;

interface TeamMember {
  playerName: string;
  role?: string;
}

export default function TeamBuilder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerRole, setNewPlayerRole] = useState("");

  const form = useForm<CreateTeamForm>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      description: "",
      logoUrl: "",
      colorScheme: "#3b82f6",
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: CreateTeamForm & { ownerId: string }) => {
      const res = await apiRequest('POST', '/api/team-profiles', data);
      return res.json();
    },
    onSuccess: async (teamProfile: any) => {
      // Create team members
      for (const member of members) {
        await apiRequest('POST', '/api/team-members', {
          teamProfileId: teamProfile.id,
          playerName: member.playerName,
          role: member.role || "Member",
        });
      }

      toast({
        title: "Success!",
        description: "Team created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team-profiles"] });
      setLocation("/account");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTeamForm) => {
    if (members.length === 0) {
      toast({
        title: "Error",
        description: "Add at least one team member",
        variant: "destructive",
      });
      return;
    }

    // In real app, get from auth context
    createTeamMutation.mutate({ ...data, ownerId: "current-user-id" });
  };

  const addMember = () => {
    if (!newPlayerName.trim()) {
      toast({
        title: "Error",
        description: "Player name is required",
        variant: "destructive",
      });
      return;
    }

    setMembers([
      ...members,
      {
        playerName: newPlayerName,
        role: newPlayerRole || "Member",
      },
    ]);
    setNewPlayerName("");
    setNewPlayerRole("");
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  return (
    <div className="container max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Create Team</CardTitle>
              <CardDescription>
                Build your competitive team roster
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Team Phoenix"
                        data-testid="input-team-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell everyone about your team..."
                        rows={3}
                        data-testid="input-team-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://..."
                          data-testid="input-team-logo"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="colorScheme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Color</FormLabel>
                      <FormControl>
                        <Input
                          type="color"
                          data-testid="input-team-color"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Team Members</h3>
                
                <div className="space-y-3 mb-4">
                  {members.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      data-testid={`team-member-${index}`}
                    >
                      <div>
                        <div className="font-medium">{member.playerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {member.role}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMember(index)}
                        data-testid={`button-remove-member-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Player name"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    data-testid="input-player-name"
                  />
                  <Input
                    placeholder="Role (optional)"
                    value={newPlayerRole}
                    onChange={(e) => setNewPlayerRole(e.target.value)}
                    data-testid="input-player-role"
                  />
                  <Button
                    type="button"
                    onClick={addMember}
                    variant="outline"
                    data-testid="button-add-member"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createTeamMutation.isPending}
                  className="flex-1"
                  data-testid="button-create-team"
                >
                  {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/account")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
