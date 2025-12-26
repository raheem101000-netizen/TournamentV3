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

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refetchUser } = useAuth();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const res = await apiRequest('POST', '/api/auth/register', {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });
      return res.json();
    },
    onSuccess: async () => {
      const user = await refetchUser();
      
      if (user) {
        toast({
          title: "Account created!",
          description: "You're now logged in.",
        });
        setLocation("/");
      } else {
        const retryUser = await refetchUser();
        if (retryUser) {
          toast({
            title: "Account created!",
            description: "You're now logged in.",
          });
          setLocation("/");
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
      <div className="flex flex-col items-center gap-10 w-full max-w-sm">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[3px] border-white" />
          <span 
            className="text-white text-3xl tracking-wider font-light"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            10/10
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-5">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <span className="text-white text-sm font-medium tracking-wide uppercase whitespace-nowrap w-24 text-right">
                      NAME:
                    </span>
                    <FormControl>
                      <Input 
                        className="flex-1 bg-white text-black border-0 rounded-sm h-8 focus-visible:ring-0 focus-visible:ring-offset-0"
                        {...field} 
                        data-testid="input-fullname"
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-400 mt-1 pl-28" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <span className="text-white text-sm font-medium tracking-wide uppercase whitespace-nowrap w-24 text-right">
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
                  <FormMessage className="text-red-400 mt-1 pl-28" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <span className="text-white text-sm font-medium tracking-wide uppercase whitespace-nowrap w-24 text-right">
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
                  <FormMessage className="text-red-400 mt-1 pl-28" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <span className="text-white text-sm font-medium tracking-wide uppercase whitespace-nowrap w-24 text-right">
                      CONFIRM:
                    </span>
                    <FormControl>
                      <PasswordInput 
                        className="flex-1 bg-white text-black border-0 rounded-sm h-8 focus-visible:ring-0 focus-visible:ring-offset-0 [&>input]:bg-white [&>input]:text-black [&>button]:text-black [&>button]:hover:bg-gray-100"
                        {...field} 
                        testid="input-confirm-password"
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-400 mt-1 pl-28" />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-b from-gray-300 to-gray-500 text-black font-medium uppercase tracking-wider rounded-sm h-10 border-0 hover:from-gray-200 hover:to-gray-400"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? "CREATING..." : "CREATE ACCOUNT"}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-400 pt-2">
              Already have an account?{" "}
              <button
                type="button"
                className="text-white underline-offset-4 hover:underline"
                onClick={() => setLocation("/login")}
                data-testid="link-login"
              >
                Log in
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
