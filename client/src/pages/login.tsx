import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LogoTenOnTen } from "@/components/LogoTenOnTen";
import { queryClient } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refetchUser } = useAuth();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await apiRequest('POST', '/api/auth/login', {
        email: data.email,
        password: data.password,
      });
      return res.json();
    },
    onSuccess: async (data) => {
      // Clear the user query cache to ensure the next fetch gets the fresh session
      queryClient.setQueryData(['/api/auth/me'], data.user);

      // Invalidate admin check so it refetches with new auth
      queryClient.invalidateQueries({ queryKey: ['/api/admin/check'] });

      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });

      // Navigate immediately using wouter's setLocation for a smoother transition
      setLocation("/");
    },
    onError: (error: any) => {
      // Handle unverified email response
      if (error.status === 403 && error.unverified) {
        toast({
          title: "Email not verified",
          description: "Please verify your email before logging in.",
          variant: "destructive",
        });
        // Navigate to check-email page with email pre-filled
        const email = form.getValues("email");
        setLocation(`/check-email?email=${encodeURIComponent(email)}`);
      } else {
        toast({
          title: "Login failed",
          description: error.message || "Invalid email or password.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center py-8 px-4 bg-black relative overflow-hidden">
      {/* Enhanced Gradient Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-radial from-violet-500/20 via-fuchsia-500/10 to-transparent blur-[80px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-radial from-blue-500/20 via-cyan-500/10 to-transparent blur-[80px] animate-pulse [animation-delay:1s]" />
      </div>

      <div className="flex flex-col items-center w-full max-w-[360px] relative z-10 animate-fade-in">
        {/* Responsive Logo Container - Scales up on desktop */}
        <div className="md:scale-125 transition-transform duration-500">
          <LogoTenOnTen size={300} />
        </div>

        {/* Glass Form Container */}
        <div className="w-full mt-8 p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-5">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="animate-slide-up [animation-delay:100ms]">
                      <div className="flex items-center gap-3">
                        <span className="text-white/70 text-[11px] font-medium tracking-widest uppercase w-[80px] text-right shrink-0">
                          EMAIL:
                        </span>
                        <FormControl>
                          <Input
                            type="email"
                            className="w-[200px] bg-white/90 text-black border-0 rounded-full h-9 text-sm px-4 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 transition-all duration-300 hover:bg-white focus:bg-white shadow-inner"
                            {...field}
                            data-testid="input-email"
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="text-red-400 mt-1 text-xs pl-[92px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="animate-slide-up [animation-delay:200ms]">
                      <div className="flex items-center gap-3">
                        <span className="text-white/70 text-[11px] font-medium tracking-widest uppercase w-[80px] text-right shrink-0">
                          PASSWORD:
                        </span>
                        <FormControl>
                          <Input
                            type="password"
                            className="w-[200px] bg-white/90 text-black border-0 rounded-full h-9 text-sm px-4 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 transition-all duration-300 hover:bg-white focus:bg-white shadow-inner"
                            {...field}
                            data-testid="input-password"
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="text-red-400 mt-1 text-xs pl-[92px]" />
                    </FormItem>
                  )}
                />

                <div className="pt-4 pl-[92px] animate-slide-up [animation-delay:300ms]">
                  <Button
                    type="submit"
                    className="w-[200px] bg-gradient-to-b from-gray-400 to-gray-600 text-white font-medium uppercase tracking-widest rounded-full h-9 text-xs border-2 border-white/30 hover:from-gray-300 hover:to-gray-500 hover:border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/10 active:scale-95"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? "ENTERING..." : "ENTER"}
                  </Button>
                </div>
              </div>

              <div className="text-center text-xs text-gray-400 pt-2 animate-slide-up [animation-delay:400ms]">
                Don't have an account?{" "}
                <button
                  type="button"
                  className="text-white underline-offset-4 hover:underline hover:text-primary transition-colors"
                  onClick={() => setLocation("/register")}
                  data-testid="link-register"
                >
                  Create account
                </button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
