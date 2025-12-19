import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  AlertCircle, 
  DollarSign, 
  ExternalLink, 
  Upload,
  X,
  Save
} from "lucide-react";
import type { RegistrationFormConfig, RegistrationFormData } from "./types";
import { usePlatform } from "./platform-adapter";

interface RegistrationFlowProps {
  config: RegistrationFormConfig;
  tournamentId: string;
  tournamentName: string;
  onSubmit: (data: RegistrationFormData) => void;
  onSaveDraft?: (data: Partial<RegistrationFormData>) => void;
}

export default function RegistrationFlow({
  config,
  tournamentId,
  tournamentName,
  onSubmit,
  onSaveDraft
}: RegistrationFlowProps) {
  const { toast } = useToast();
  const platform = usePlatform();
  const hasLoadedDraft = useRef(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [teamName, setTeamName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [paymentTransactionId, setPaymentTransactionId] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [paymentWindowOpened, setPaymentWindowOpened] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const storageKey = `registration-draft-${tournamentId}`;

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const saved = await platform.storage.getItem(storageKey);
        if (saved) {
          const data = JSON.parse(saved);
          setTeamName(data.teamName || "");
          setContactEmail(data.contactEmail || "");
          setResponses(data.responses || {});
          setPaymentTransactionId(data.paymentTransactionId || "");
          setCurrentStep(data.currentStep || 0);
        }
      } catch (e) {
        console.error("Failed to load draft:", e);
      } finally {
        hasLoadedDraft.current = true;
      }
    };
    loadDraft();
  }, [storageKey, platform.storage]);

  useEffect(() => {
    if (!hasLoadedDraft.current) {
      return;
    }

    const saveDraft = async () => {
      try {
        const draft = {
          teamName,
          contactEmail,
          responses,
          paymentTransactionId,
          currentStep
        };
        await platform.storage.setItem(storageKey, JSON.stringify(draft));

        if (onSaveDraft) {
          onSaveDraft({
            tournamentId,
            teamName,
            contactEmail,
            responses,
            paymentTransactionId
          });
        }
      } catch (e) {
        console.error("Failed to save draft:", e);
      }
    };
    saveDraft();
  }, [teamName, contactEmail, responses, paymentTransactionId, currentStep, storageKey, tournamentId, onSaveDraft, platform.storage]);

  const handleImageSelect = async () => {
    try {
      const result = await platform.fileUpload.selectImage();
      if (result) {
        setImagePreview(result.base64 || result.uri);
        setPaymentProofUrl(result.base64 || result.uri);
      }
    } catch (e) {
      console.error("Failed to select image:", e);
      toast({
        title: "Upload Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setPaymentProofUrl("");
  };

  const openPaymentLink = async () => {
    if (config.paymentUrl) {
      try {
        const opened = await platform.navigation.openUrl(config.paymentUrl);
        if (opened) {
          setPaymentWindowOpened(true);
        } else {
          toast({
            title: "Navigation Error",
            description: "Failed to open payment link. Please try again.",
            variant: "destructive"
          });
        }
      } catch (e) {
        console.error("Failed to open payment link:", e);
        toast({
          title: "Navigation Error",
          description: "Failed to open payment link. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepIndex === 0) {
      if (!teamName.trim()) {
        newErrors.teamName = "Team name is required";
      }
      if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
        newErrors.contactEmail = "Invalid email address";
      }
    }

    const step = config.steps[stepIndex];
    if (step) {
      step.fields.forEach(field => {
        if (field.isRequired === 1 && !responses[field.id]?.trim()) {
          newErrors[field.id] = `${field.fieldLabel} is required`;
        }
      });
    }

    if (stepIndex === config.steps.length && config.requiresPayment === 1) {
      if (!paymentTransactionId.trim() && !paymentProofUrl) {
        newErrors.payment = "Please provide transaction ID or upload payment proof";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    onSubmit({
      tournamentId,
      teamName,
      contactEmail,
      responses,
      paymentProofUrl: paymentProofUrl || undefined,
      paymentTransactionId: paymentTransactionId || undefined
    });

    try {
      await platform.storage.removeItem(storageKey);
    } catch (e) {
      console.error("Failed to remove draft:", e);
    }
  };

  const totalSteps = config.steps.length + (config.requiresPayment === 1 ? 1 : 0);
  const progress = ((currentStep + 1) / (totalSteps + 1)) * 100;

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="team-name">
          Team Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="team-name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Enter your team name"
          data-testid="input-team-name"
        />
        {errors.teamName && (
          <p className="text-sm text-destructive">{errors.teamName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-email">Contact Email (Optional)</Label>
        <Input
          id="contact-email"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="your.email@example.com"
          data-testid="input-contact-email"
        />
        {errors.contactEmail && (
          <p className="text-sm text-destructive">{errors.contactEmail}</p>
        )}
      </div>
    </div>
  );

  const renderField = (field: any) => {
    const value = responses[field.id] || "";

    switch (field.fieldType) {
      case "text":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.fieldLabel}
              {field.isRequired === 1 && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              value={value}
              onChange={(e) => setResponses({ ...responses, [field.id]: e.target.value })}
              placeholder={field.fieldPlaceholder || ""}
              data-testid={`input-field-${field.id}`}
            />
            {errors[field.id] && (
              <p className="text-sm text-destructive">{errors[field.id]}</p>
            )}
          </div>
        );

      case "dropdown":
        const options = field.dropdownOptions?.split(",").map((opt: string) => opt.trim()) || [];
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.fieldLabel}
              {field.isRequired === 1 && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => setResponses({ ...responses, [field.id]: val })}
            >
              <SelectTrigger data-testid={`select-field-${field.id}`}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt: string) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[field.id] && (
              <p className="text-sm text-destructive">{errors[field.id]}</p>
            )}
          </div>
        );

      case "yesno":
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.fieldLabel}
              {field.isRequired === 1 && <span className="text-destructive ml-1">*</span>}
            </Label>
            <RadioGroup
              value={value}
              onValueChange={(val) => setResponses({ ...responses, [field.id]: val })}
              data-testid={`radio-field-${field.id}`}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id={`${field.id}-yes`} />
                <Label htmlFor={`${field.id}-yes`} className="font-normal">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id={`${field.id}-no`} />
                <Label htmlFor={`${field.id}-no`} className="font-normal">No</Label>
              </div>
            </RadioGroup>
            {errors[field.id] && (
              <p className="text-sm text-destructive">{errors[field.id]}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <Alert>
        <DollarSign className="w-4 h-4" />
        <AlertDescription>
          Entry Fee: <strong>${config.entryFee}</strong>
        </AlertDescription>
      </Alert>

      {config.paymentInstructions && (
        <div className="p-4 bg-muted rounded-md">
          <p className="text-sm">{config.paymentInstructions}</p>
        </div>
      )}

      <div className="space-y-4">
        <Button
          onClick={openPaymentLink}
          className="w-full"
          size="lg"
          data-testid="button-pay-now"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Pay Now
        </Button>

        {paymentWindowOpened && (
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              After completing payment, return here to submit proof
            </AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Payment Proof
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction-id">Transaction ID (Optional)</Label>
          <Input
            id="transaction-id"
            value={paymentTransactionId}
            onChange={(e) => setPaymentTransactionId(e.target.value)}
            placeholder="Enter payment confirmation number"
            data-testid="input-transaction-id"
          />
        </div>

        <div className="space-y-2">
          <Label>Upload Screenshot (Optional)</Label>
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Payment proof"
                className="w-full h-48 object-cover rounded-md"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
                data-testid="button-remove-payment-proof"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-32 flex flex-col items-center justify-center hover-elevate"
              onClick={handleImageSelect}
              data-testid="button-select-payment-proof"
            >
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Click to upload</span>
            </Button>
          )}
        </div>

        {errors.payment && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{errors.payment}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );

  const renderStepContent = () => {
    if (currentStep === 0) {
      return renderBasicInfo();
    }

    const adjustedStep = currentStep - 1;
    if (adjustedStep < config.steps.length) {
      const step = config.steps[adjustedStep];
      return (
        <div className="space-y-4">
          {step.stepDescription && (
            <p className="text-sm text-muted-foreground">{step.stepDescription}</p>
          )}
          {step.fields.map(renderField)}
        </div>
      );
    }

    if (config.requiresPayment === 1 && adjustedStep === config.steps.length) {
      return renderPaymentStep();
    }

    return null;
  };

  const getStepTitle = () => {
    if (currentStep === 0) return "Basic Information";
    
    const adjustedStep = currentStep - 1;
    if (adjustedStep < config.steps.length) {
      return config.steps[adjustedStep].stepTitle;
    }
    
    if (config.requiresPayment === 1) {
      return "Payment";
    }
    
    return "Step";
  };

  const isLastStep = currentStep === totalSteps;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">{tournamentName}</h2>
          <Badge variant="outline">
            Step {currentStep + 1} of {totalSteps + 1}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">{getStepTitle()}</CardTitle>
          <CardDescription>
            Complete all required fields to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            data-testid="button-back"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Save className="w-3 h-3" />
              Auto-saved
            </Badge>

            {isLastStep ? (
              <Button onClick={handleSubmit} data-testid="button-submit-registration">
                <Check className="w-4 h-4 mr-2" />
                Submit Registration
              </Button>
            ) : (
              <Button onClick={handleNext} data-testid="button-next">
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
