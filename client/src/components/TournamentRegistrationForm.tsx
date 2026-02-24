import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import type { RegistrationStep, TeamProfile } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";

interface RegistrationConfig {
  id: string;
  tournamentId: string;
  requiresPayment: number;
  entryFee: string | null;
  paymentUrl: string | null;
  paymentInstructions: string | null;
  steps: RegistrationStep[];
}

interface TournamentRegistrationFormProps {
  tournamentId: string;
  tournamentName?: string;
  serverId?: string;
  onRegistrationSuccess?: () => void;
}

export default function TournamentRegistrationForm({
  tournamentId,
  tournamentName,
  serverId,
  onRegistrationSuccess,
}: TournamentRegistrationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showAlreadyRegistered, setShowAlreadyRegistered] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("new");

  // Fetch user's persistent teams
  const { data: userTeams = [] } = useQuery<TeamProfile[]>({
    queryKey: [`/api/users/${user?.id}/team-profiles`],
    enabled: !!user?.id,
  });

  // Fetch registration config with steps
  const { data: config, isLoading: configLoading } = useQuery<RegistrationConfig | null>({
    queryKey: [`/api/tournaments/${tournamentId}/registration/config`],
  });

  // Check if user is already registered for this tournament
  const { data: registrations = [] } = useQuery<any[]>({
    queryKey: [`/api/tournaments/${tournamentId}/registrations`],
    enabled: !!user?.id,
  });

  const userAlreadyRegistered = registrations.some(r => r.userId === user?.id);

  // Build dynamic schema - one text input per step
  const schemaObj: Record<string, any> = {};

  if (config?.steps) {
    config.steps.forEach((step) => {
      schemaObj[step.id] = z.string().min(1, `${step.stepTitle} is required`);
    });
  }

  const dynamicSchema = z.object(schemaObj);

  type FormData = Record<string, any>;

  const form = useForm<FormData>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: Object.fromEntries(
      config?.steps.map((s) => [s.id, ""]) || []
    ),
  });

  const registerMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", `/api/tournaments/${tournamentId}/registrations`, {
        userId: user?.id,
        teamProfileId: selectedTeamId !== "new" ? selectedTeamId : undefined,
        responses: data,
      });
      return res; // apiRequest already returns the parsed JSON data
    },
    onSuccess: async (registration: any) => {
      if (serverId) {
        try {
          await apiRequest('POST', `/api/servers/${serverId}/join`);
          await queryClient.invalidateQueries({ queryKey: ['/api/my-servers'] });
          await queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/members`] });
        } catch (error) {
          console.warn('Server join attempt:', error);
        }
      }

      queryClient.setQueryData([`/api/tournaments/${tournamentId}/registrations`], (current: any[] | undefined) => {
        if (!current) return registration ? [registration] : [];
        if (!registration?.id) return current;
        if (current.some((item) => item?.id === registration.id)) return current;
        return [...current, registration];
      });

      setShowAlreadyRegistered(true);

      toast({
        title: "Success!",
        description: "Registration submitted successfully",
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/registrations`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/teams`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}`] }),
        queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] }),
      ]);

      form.reset();
      onRegistrationSuccess?.();
    },
    onError: (error: any) => {
      // Check if error is "already registered" (409 conflict)
      const errorMessage = error.message || "";
      if (errorMessage.includes("already registered") || error.status === 409) {
        setShowAlreadyRegistered(true);
        toast({
          title: "Already Registered",
          description: "You're already in this tournament! Redirecting you to your registration.",
        });
      } else {
        toast({
          title: "Registration Failed",
          description: errorMessage || "Failed to register. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  if (configLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Loading registration form...</p>
        </CardContent>
      </Card>
    );
  }

  // If no registration config was set up, don't show a form at all
  if (!config) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground text-sm">Registration is not available for this tournament</p>
        </CardContent>
      </Card>
    );
  }

  // Show each step as a form section
  if (!config?.steps || config.steps.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground text-sm">Registration is not available for this tournament</p>
        </CardContent>
      </Card>
    );
  }

  // Check if user is already registered (either from query or from 409 error)
  if (userAlreadyRegistered || showAlreadyRegistered) {
    const userRegistration = registrations.find(r => r.userId === user?.id);

    return (
      <Card className="border-green-500/50 bg-green-50/10">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-green-700 dark:text-green-300">You're Already Registered!</p>
            <p className="text-sm text-muted-foreground mt-1">Good news - you're all set for this tournament.</p>
          </div>

          {userRegistration?.teamName && (
            <div className="p-3 bg-card border rounded-lg">
              <p className="text-xs text-muted-foreground">Registered Team</p>
              <p className="font-semibold">{userRegistration.teamName}</p>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => setLocation(serverId ? `/server/${serverId}` : `/tournament/${tournamentId}/view`)}
              className="w-full"
              data-testid="button-view-tournament"
            >
              View Tournament Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              className="w-full"
              data-testid="button-back-home"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = (data: FormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to register",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register for Tournament</CardTitle>
        <CardDescription>{tournamentName}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Show one text input per step */}
            <div className="space-y-4">
              {config.steps.map((step) => (
                <FormField
                  key={step.id}
                  control={form.control}
                  name={step.id}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{step.stepTitle}</FormLabel>
                      {step.stepDescription && (
                        <p className="text-xs text-muted-foreground">{step.stepDescription}</p>
                      )}
                      <FormControl>
                        <Input
                          placeholder={`Enter ${step.stepTitle.toLowerCase()}`}
                          {...field}
                          value={field.value || ""}
                          onChange={field.onChange}
                          data-testid={`input-${step.id}`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {/* Team Selection Dropdown */}
            {userTeams.length > 0 && (
              <div className="space-y-4 pt-2 border-t mt-4">
                <div className="space-y-2">
                  <FormLabel className="text-base">Join with an Existing Team</FormLabel>
                  <CardDescription className="pb-2">
                    Select one of your established teams to auto-fill the team name and link your team profile.
                  </CardDescription>
                  <Select
                    value={selectedTeamId}
                    onValueChange={(val) => {
                      setSelectedTeamId(val);
                      if (val !== "new") {
                        const team = userTeams.find(t => t.id === val);
                        if (team && config.steps) {
                          // Try to find a field that looks like "Team Name" and auto-fill it
                          // Check all steps for a "Team Name" field
                          config.steps.forEach(step => {
                            if (step.stepTitle.toLowerCase().includes("team")) { // very simple heuristic
                              form.setValue(step.id, team.name);
                            }
                          });

                          // Also try the dedicated header field if configured, or just ANY field named "Team Name" logic which might be simpler:
                          // Just iterate through fields and if one asks for team name...
                          // Actually, the previous heuristic of checking step title is decent since usually "Team Name" is a step title.
                          // But more accurately:
                          const teamNameStep = config.steps.find(s => s.stepTitle.toLowerCase().includes("team name") || s.stepTitle.toLowerCase() === "team");
                          if (teamNameStep) {
                            form.setValue(teamNameStep.id, team.name);
                          }
                        }
                      } else {
                        // Clear the field? Maybe not, just let them edit.
                        // form.reset(); // Don't reset everything
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team profile (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Create New / Enter Manually</SelectItem>
                      {userTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name} ({team.game})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {!userTeams.length && (
              <div className="text-sm text-muted-foreground mt-4 p-4 border rounded-md bg-muted/20">
                Want to track your team's history? <Link href="/teams/new" className="text-primary hover:underline">Create a Team Profile</Link> first!
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full"
              data-testid="button-register-submit"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register Team"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
