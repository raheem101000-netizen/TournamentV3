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
    <div className="min-h-[100dvh] flex flex-col items-center justify-start py-8 px-4 sm:justify-center sm:py-16 bg-black">
      <div className="flex flex-col items-center w-full max-w-[360px]">
        <LogoTenOnTen size={420} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full mt-16 space-y-4">
            <div className="space-y-4 -ml-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <span className="text-white text-[11px] font-medium tracking-widest uppercase w-[80px] text-right shrink-0">
                        EMAIL:
                      </span>
                      <FormControl>
                        <Input 
                          type="email"
                          className="w-[220px] bg-white text-black border-0 rounded-full h-8 text-sm px-4 focus-visible:ring-0 focus-visible:ring-offset-0"
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
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <span className="text-white text-[11px] font-medium tracking-widest uppercase w-[80px] text-right shrink-0">
                        PASSWORD:
                      </span>
                      <FormControl>
                        <Input 
                          type="password"
                          className="w-[220px] bg-white text-black border-0 rounded-full h-8 text-sm px-4 focus-visible:ring-0 focus-visible:ring-offset-0"
                          {...field} 
                          data-testid="input-password"
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="text-red-400 mt-1 text-xs pl-[92px]" />
                  </FormItem>
                )}
              />

              <div className="pt-4 pl-[92px]">
                <Button 
                  type="submit" 
                  className="w-[220px] bg-gradient-to-b from-gray-500 to-gray-700 text-white font-medium uppercase tracking-widest rounded-full h-8 text-xs border-[3px] border-white hover:from-gray-400 hover:to-gray-600"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "ENTERING..." : "ENTER"}
                </Button>
              </div>
            </div>

            <div className="text-center text-xs text-gray-400 pt-3">
              Don't have an account?{" "}
              <button
                type="button"
                className="text-white underline-offset-4 hover:underline"
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
  );
}
