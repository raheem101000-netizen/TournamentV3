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
import { Trophy } from "lucide-react";

const createTournamentSchema = z.object({
  name: z.string().min(1, "Tournament name is required"),
  game: z.string().optional(),
  format: z.enum(["round_robin", "single_elimination", "swiss"]),
  totalTeams: z.number().min(2, "At least 2 teams required"),
  swissRounds: z.number().optional(),
  imageUrl: z.string().optional(),
  imageFit: z.enum(["stretch", "contain", "cover"]).optional(),
  prizeReward: z.string().optional(),
  entryFee: z.number().optional(),
  organizerName: z.string().optional(),
  serverId: z.string().optional(),
});

type CreateTournamentForm = z.infer<typeof createTournamentSchema>;

export default function CreateTournament() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<CreateTournamentForm>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      name: "",
      game: "",
      format: "single_elimination",
      totalTeams: 8,
      imageFit: "cover",
      prizeReward: "",
      entryFee: 0,
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
                Set up a new tournament with teams and matches
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem>
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
                  name="entryFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Fee (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          data-testid="input-entry-fee"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                    <FormItem>
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
                    <FormItem>
                      <FormLabel>Image Fit</FormLabel>
                      <Select value={field.value || "cover"} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-image-fit">
                          <SelectValue placeholder="Select image fit" />
                        </SelectTrigger>
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
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1"
                  data-testid="button-create-tournament"
                >
                  {createMutation.isPending ? "Creating..." : "Create Tournament"}
                </Button>
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
