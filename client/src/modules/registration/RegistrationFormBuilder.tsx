import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import type { RegistrationFormConfig, RegistrationStepConfig } from "./types";

interface RegistrationFormBuilderProps {
  tournamentId: string;
  initialConfig?: RegistrationFormConfig;
  onSave: (config: RegistrationFormConfig) => void;
}

export default function RegistrationFormBuilder({
  tournamentId,
  initialConfig,
  onSave
}: RegistrationFormBuilderProps) {
  const [steps, setSteps] = useState<RegistrationStepConfig[]>(
    initialConfig?.steps || []
  );

  useEffect(() => {
    console.log("[REG-BUILDER] Config updated:", { steps });
  }, [steps]);

  const addStep = () => {
    // First step defaults to "Team Name" for easy identification
    const isFirstStep = steps.length === 0;
    const newStep: RegistrationStepConfig = {
      id: `step-${Date.now()}`,
      stepNumber: steps.length + 1,
      stepTitle: isFirstStep ? "Team Name" : `Step ${steps.length + 1}`,
      stepDescription: "",
      fields: []
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId: string) => {
    const filtered = steps.filter(s => s.id !== stepId);
    const renumbered = filtered.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }));
    setSteps(renumbered);
  };

  const updateStep = (stepId: string, updates: Partial<RegistrationStepConfig>) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const handleSave = () => {
    console.log("[REG-BUILDER] Save button clicked");
    const config: RegistrationFormConfig = {
      id: initialConfig?.id || `config-${Date.now()}`,
      tournamentId: "new",
      requiresPayment: 0,
      entryFee: null,
      paymentUrl: null,
      paymentInstructions: null,
      steps
    };
    console.log("[REG-BUILDER] Config:", config);
    onSave(config);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Registration Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No registration steps yet. Add a step to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {steps.map((step) => (
                <Card key={step.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1">
                          Step {step.stepNumber}
                        </Label>
                        <Input
                          placeholder="Enter step name (e.g., Team Name, Number of Players, Platform ID)"
                          value={step.stepTitle}
                          onChange={(e) =>
                            updateStep(step.id, { stepTitle: e.target.value })
                          }
                          data-testid="input-step-name"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(step.id)}
                      data-testid="button-delete-step"
                      className="mt-6"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={addStep}
              variant="outline"
              data-testid="button-add-step"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
            <Button
              onClick={handleSave}
              data-testid="button-save-registration"
              disabled={steps.length === 0}
            >
              Save Registration Form
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
