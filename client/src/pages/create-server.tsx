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
import { Server } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ImageUploadField from "@/components/ImageUploadField";
import TagInput from "@/components/TagInput";

const createServerSchema = z.object({
  name: z.string().min(1, "Server name is required"),
  description: z.string().optional(),
  welcomeMessage: z.string().optional(),
  category: z.string().optional(),
  gameTags: z.array(z.string()).optional(),
  isPublic: z.number().default(1),
  iconUrl: z.string().min(1, "Server icon is required"),
  backgroundUrl: z.string().min(1, "Server background image is required"),
});

type CreateServerForm = z.infer<typeof createServerSchema>;

export default function CreateServer() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

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

  const onSubmit = (data: CreateServerForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="container max-w-2xl mx-auto p-6 overflow-y-auto max-h-screen">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Server className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Create a Server</CardTitle>
              <CardDescription>
                Create a new server for your community
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
                        rows={4}
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
                name="gameTags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Tags</FormLabel>
                    <FormControl>
                      <TagInput
                        tags={field.value || []}
                        onChange={field.onChange}
                        placeholder="Type a game name and press Enter (e.g., FIFA, Valorant)"
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
                    <FormLabel>Welcome Page Message (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Welcome to our server! Here you'll find..."
                        rows={6}
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

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1"
                  data-testid="button-create-server"
                >
                  {createMutation.isPending ? "Creating..." : "Create Server"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
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
