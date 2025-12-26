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
import { PasswordInput } from "@/components/PasswordInput";
import { useAuth } from "@/contexts/AuthContext";

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
    onSuccess: async () => {
      const user = await refetchUser();
      
      if (user) {
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
        setLocation("/");
      } else {
        const retryUser = await refetchUser();
        if (retryUser) {
          toast({
            title: "Welcome back!",
            description: "You've successfully logged in.",
          });
          setLocation("/");
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
      <div className="flex flex-col items-center gap-12 w-full max-w-sm">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[3px] border-white" />
          <span 
            className="text-white text-4xl tracking-wider font-light"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            10/10
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <span className="text-white text-sm font-medium tracking-wide uppercase whitespace-nowrap">
                      EMAIL:
                    </span>
                    <FormControl>
                      <Input 
                        type="email"
                        className="flex-1 bg-white text-black border-0 rounded-sm h-8 focus-visible:ring-0 focus-visible:ring-offset-0"
                        {...field} 
                        data-testid="input-email"
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-400 mt-1" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <span className="text-white text-sm font-medium tracking-wide uppercase whitespace-nowrap">
                      PASSWORD:
                    </span>
                    <FormControl>
                      <PasswordInput 
                        className="flex-1 bg-white text-black border-0 rounded-sm h-8 focus-visible:ring-0 focus-visible:ring-offset-0 [&>input]:bg-white [&>input]:text-black [&>button]:text-black [&>button]:hover:bg-gray-100"
                        {...field} 
                        testid="input-password"
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-400 mt-1" />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-b from-gray-300 to-gray-500 text-black font-medium uppercase tracking-wider rounded-sm h-10 border-0 hover:from-gray-200 hover:to-gray-400"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "ENTERING..." : "ENTER"}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-400 pt-2">
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
