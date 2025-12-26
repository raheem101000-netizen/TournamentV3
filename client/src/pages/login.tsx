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
import { LogoTenOnTen } from "@/components/LogoTenOnTen";

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
      <div className="flex flex-col items-center gap-6 w-full max-w-[280px]">
        <div className="flex flex-col items-center gap-3">
          <LogoTenOnTen size={280} />
          <span className="text-white text-lg font-light tracking-[0.3em] font-mono">
            10 / 10
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-3">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-[10px] font-medium tracking-wider uppercase w-16 text-right">
                      EMAIL:
                    </span>
                    <FormControl>
                      <Input 
                        type="email"
                        className="flex-1 bg-white text-black border-0 rounded-sm h-6 text-xs px-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                        {...field} 
                        data-testid="input-email"
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-400 mt-1 text-xs pl-[72px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-[10px] font-medium tracking-wider uppercase w-16 text-right">
                      PASSWORD:
                    </span>
                    <FormControl>
                      <PasswordInput 
                        className="flex-1 bg-white text-black border-0 rounded-sm h-6 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 [&>input]:bg-white [&>input]:text-black [&>input]:h-6 [&>input]:text-xs [&>input]:px-2 [&>button]:text-black [&>button]:hover:bg-gray-100 [&>button]:h-6 [&>button]:w-6"
                        {...field} 
                        testid="input-password"
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-400 mt-1 text-xs pl-[72px]" />
                </FormItem>
              )}
            />

            <div className="pt-1">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-b from-gray-300 to-gray-500 text-black font-medium uppercase tracking-wider rounded-sm h-7 text-xs border-0 hover:from-gray-200 hover:to-gray-400"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "ENTERING..." : "ENTER"}
              </Button>
            </div>

            <div className="text-center text-xs text-gray-400 pt-1">
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
