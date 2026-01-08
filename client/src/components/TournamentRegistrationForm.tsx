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
import type { RegistrationStep } from "@shared/schema";

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
  tournamentName: string;
  onRegistrationSuccess?: () => void;
}

export default function TournamentRegistrationForm({
  tournamentId,
  tournamentName,
  onRegistrationSuccess,
}: TournamentRegistrationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showAlreadyRegistered, setShowAlreadyRegistered] = useState(false);

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
        responses: data,
      });
      return res; // apiRequest already returns the parsed JSON data
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Registration submitted successfully",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/tournaments/${tournamentId}/registrations`],
      });
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
          title: "Error",
          description: errorMessage || "Failed to register",
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
              onClick={() => setLocation(`/tournament/${tournamentId}`)}
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
