import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Server, ChevronLeft, ChevronRight, Check, Image, ImageIcon, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ImageUploadField from "@/components/ImageUploadField";
import TagInput from "@/components/TagInput";

const createServerSchema = z.object({
  name: z.string().min(1, "Server name is required"),
  description: z.string().optional(),
  welcomeMessage: z.string().min(10, "Welcome message must be at least 10 characters"),
  category: z.string().optional(),
  gameTags: z.array(z.string()).optional(),
  isPublic: z.number().default(1),
  iconUrl: z.string().min(1, "Server icon is required"),
  backgroundUrl: z.string().min(1, "Server background image is required"),
});

type CreateServerForm = z.infer<typeof createServerSchema>;

const STEPS = [
  { id: 1, title: "Server Icon", description: "Upload your server icon", icon: ImageIcon },
  { id: 2, title: "Background", description: "Upload background image", icon: Image },
  { id: 3, title: "Welcome Page", description: "Set up your welcome message", icon: FileText },
];

export default function CreateServer() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<CreateServerForm>({
    resolver: zodResolver(createServerSchema),
    defaultValues: {
      name: "",
      description: "",
      welcomeMessage: "",
      category: "gaming",
      gameTags: [],
      isPublic: 1,
      iconUrl: "",
      backgroundUrl: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateServerForm) => {
      const res = await apiRequest('POST', '/api/servers', data);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success!",
        description: "Server created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mobile-preview/servers"] });
      setLocation(`/server/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create server",
        variant: "destructive",
      });
    },
  });

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof CreateServerForm)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ["iconUrl"];
        break;
      case 2:
        fieldsToValidate = ["backgroundUrl"];
        break;
      case 3:
        fieldsToValidate = ["name", "welcomeMessage"];
        break;
    }
    
    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: CreateServerForm) => {
    createMutation.mutate(data);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => {
        const StepIcon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCompleted
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-muted-foreground/30 bg-muted text-muted-foreground"
                }`}
                data-testid={`step-indicator-${step.id}`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <StepIcon className="w-5 h-5" />
                )}
              </div>
              <span className={`text-xs mt-2 font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {step.title}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-2 ${
                  currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Upload Your Server Icon</h2>
        <p className="text-muted-foreground">
          This icon will represent your server across the platform
        </p>
      </div>
      
      <FormField
        control={form.control}
        name="iconUrl"
        render={({ field }) => (
          <FormItem>
            <ImageUploadField
              label="Server Icon"
              value={field.value || ""}
              onChange={field.onChange}
              placeholder="Upload your server icon"
              required
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Upload Background Image</h2>
        <p className="text-muted-foreground">
          This image will be displayed as your server's background
        </p>
      </div>
      
      <FormField
        control={form.control}
        name="backgroundUrl"
        render={({ field }) => (
          <FormItem>
            <ImageUploadField
              label="Server Background"
              value={field.value || ""}
              onChange={field.onChange}
              placeholder="Upload your server background image"
              required
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Welcome Page & Details</h2>
        <p className="text-muted-foreground">
          Set up your server's welcome message and basic info
        </p>
      </div>

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Server Name <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input
                placeholder="My Awesome Server"
                data-testid="input-server-name"
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
                placeholder="What's your server about?"
                rows={3}
                data-testid="input-server-description"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="welcomeMessage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Welcome Page Message <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Textarea
                placeholder="Welcome to our server! Here you'll find..."
                rows={5}
                data-testid="input-welcome-message"
                {...field}
              />
            </FormControl>
            <p className="text-xs text-muted-foreground mt-1">
              This message will be displayed to everyone who previews or joins your server.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger data-testid="select-server-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="gaming">Gaming</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="esports">Esports</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="gameTags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Game Tags</FormLabel>
            <FormControl>
              <TagInput
                tags={field.value || []}
                onChange={field.onChange}
                placeholder="Type a game name and press Enter"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isPublic"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Visibility</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(parseInt(value))}
              defaultValue={field.value.toString()}
            >
              <FormControl>
                <SelectTrigger data-testid="select-server-visibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="1">Public</SelectItem>
                <SelectItem value="0">Private</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Server className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Create a Server</CardTitle>
              <CardDescription>
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              <div className="flex gap-3 pt-4">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    data-testid="button-back"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1"
                    data-testid="button-next"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1"
                    data-testid="button-create-server"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Server"}
                  </Button>
                )}
                
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setLocation("/myservers")}
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
