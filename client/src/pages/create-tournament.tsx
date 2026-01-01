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
  FormDescription,
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
import { Trophy, ChevronRight, ChevronLeft } from "lucide-react";

const createTournamentSchema = z.object({
  name: z.string().min(1, "Tournament name is required"),
  game: z.string().optional(),
  format: z.enum(["round_robin", "single_elimination", "swiss"]),
  totalTeams: z.number().min(2, "At least 2 teams required"),
  swissRounds: z.number().optional(),
  imageUrl: z.string().optional(),
  imageFit: z.enum(["stretch", "contain", "cover"]).optional(),
  prizeReward: z.string().optional(),
  entryFee: z.string().optional(),
  visibility: z.enum(["public", "private"], { required_error: "Visibility is required" }),
  organizerName: z.string().optional(),
  serverId: z.string().optional(),
});

type CreateTournamentForm = z.infer<typeof createTournamentSchema>;

export default function CreateTournament() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<CreateTournamentForm>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      name: "",
      game: "",
      format: "single_elimination",
      totalTeams: 8,
      imageFit: "cover",
      prizeReward: "",
      entryFee: "",
      visibility: "public",
      organizerName: "",
    },
  });

  const selectedFormat = form.watch("format");

  const createMutation = useMutation({
    mutationFn: async (data: CreateTournamentForm) => {
      const res = await apiRequest('POST', '/api/tournaments', data);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success!",
        description: "Tournament created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tournament",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTournamentForm) => {
    createMutation.mutate(data);
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="container max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Create Tournament</CardTitle>
              <CardDescription>
                Step {currentStep} of 3 - Set up a new tournament with teams and matches
              </CardDescription>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full ${
                  step <= currentStep ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* STEP 1 - Basic Information */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Tournament Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Spring Championship 2024"
                            data-testid="input-tournament-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="game"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Game/Sport</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Chess, Basketball"
                            data-testid="input-tournament-game"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organizerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organizer Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your name"
                            data-testid="input-organizer-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* STEP 2 - Format & Teams */}
              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Tournament Format</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-tournament-format">
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="single_elimination">Single Elimination</SelectItem>
                            <SelectItem value="round_robin">Round Robin</SelectItem>
                            <SelectItem value="swiss">Swiss System</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {field.value === "single_elimination" && "One loss and you're out"}
                          {field.value === "round_robin" && "Everyone plays everyone"}
                          {field.value === "swiss" && "Optimized pairing each round"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalTeams"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Teams</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="2"
                            data-testid="input-total-teams"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedFormat === "swiss" && (
                    <FormField
                      control={form.control}
                      name="swissRounds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Swiss Rounds</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="e.g., 5"
                              data-testid="input-swiss-rounds"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Typically 5-7 rounds for Swiss
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {/* STEP 3 - Visibility & Appearance */}
              {currentStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Tournament Visibility</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-tournament-visibility">
                              <SelectValue placeholder="Select visibility" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="public">Public (Posted on Homepage)</SelectItem>
                            <SelectItem value="private">Private (Only in Server)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Who can see and join this tournament
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="entryFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Fee (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="e.g. $10 or Free"
                            data-testid="input-entry-fee"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Amount per team</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prizeReward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prize/Reward (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="$500 or Trophy"
                            data-testid="input-prize-reward"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Image URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/image.jpg"
                            data-testid="input-image-url"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imageFit"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Image Fit</FormLabel>
                        <Select value={field.value || "cover"} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-image-fit">
                              <SelectValue placeholder="Select image fit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="stretch">Stretch (Fill entire poster)</SelectItem>
                            <SelectItem value="contain">Contain (Full image visible)</SelectItem>
                            <SelectItem value="cover">Cover (Crop to fill)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>How the image fits inside the poster</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Tournament Visibility</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-tournament-visibility">
                              <SelectValue placeholder="Select visibility" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="public">Public (Posted on Homepage)</SelectItem>
                            <SelectItem value="private">Private (Only in Server)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Who can see and join this tournament
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    data-testid="button-previous-step"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1"
                    data-testid="button-next-step"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1"
                    data-testid="button-create-tournament"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Tournament"}
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/")}
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
