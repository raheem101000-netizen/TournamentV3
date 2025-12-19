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
import { Loader2 } from "lucide-react";
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

  // Fetch registration config with steps
  const { data: config, isLoading: configLoading } = useQuery<RegistrationConfig | null>({
    queryKey: [`/api/tournaments/${tournamentId}/registration/config`],
  });

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
      return res.json();
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
      toast({
        title: "Error",
        description: error.message || "Failed to register",
        variant: "destructive",
      });
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
