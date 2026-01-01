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
    <div className="min-h-[100dvh] flex flex-col items-center justify-start py-8 px-4 sm:justify-center sm:py-16 bg-black">
      <div className="flex flex-col items-center w-full max-w-[360px]">
        <LogoTenOnTen size={200} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full mt-10 space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <span className="text-white text-[11px] font-medium tracking-widest uppercase w-[90px] text-right shrink-0">
                      NAME:
                    </span>
                    <FormControl>
                      <Input 
                        className="flex-1 bg-white text-black border-0 rounded-full h-8 text-sm px-4 focus-visible:ring-0 focus-visible:ring-offset-0"
                        {...field} 
                        data-testid="input-fullname"
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-400 mt-1 text-xs pl-[102px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <span className="text-white text-[11px] font-medium tracking-widest uppercase w-[90px] text-right shrink-0">
                      EMAIL:
                    </span>
                    <FormControl>
                      <Input 
                        type="email"
                        className="flex-1 bg-white text-black border-0 rounded-full h-8 text-sm px-4 focus-visible:ring-0 focus-visible:ring-offset-0"
                        {...field} 
                        data-testid="input-email"
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-400 mt-1 text-xs pl-[102px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <span className="text-white text-[11px] font-medium tracking-widest uppercase w-[90px] text-right shrink-0">
                      PASSWORD:
                    </span>
                    <FormControl>
                      <PasswordInput 
                        className="flex-1 bg-white text-black border-0 rounded-full h-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 [&>input]:bg-white [&>input]:text-black [&>input]:h-8 [&>input]:text-sm [&>input]:px-4 [&>button]:text-black [&>button]:hover:bg-gray-100 [&>button]:h-8 [&>button]:w-8"
                        {...field} 
                        testid="input-password"
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-400 mt-1 text-xs pl-[102px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <span className="text-white text-[11px] font-medium tracking-widest uppercase w-[90px] text-right shrink-0">
                      CONFIRM:
                    </span>
                    <FormControl>
                      <PasswordInput 
                        className="flex-1 bg-white text-black border-0 rounded-full h-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 [&>input]:bg-white [&>input]:text-black [&>input]:h-8 [&>input]:text-sm [&>input]:px-4 [&>button]:text-black [&>button]:hover:bg-gray-100 [&>button]:h-8 [&>button]:w-8"
                        {...field} 
                        testid="input-confirm-password"
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-400 mt-1 text-xs pl-[102px]" />
                </FormItem>
              )}
            />

            <div className="pt-3 pl-[102px]">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-b from-gray-300 to-gray-500 text-black font-semibold uppercase tracking-widest rounded-md h-9 text-sm border-0 hover:from-gray-200 hover:to-gray-400 shadow-sm"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? "CREATING..." : "CREATE ACCOUNT"}
              </Button>
            </div>

            <div className="text-center text-xs text-gray-400 pt-3">
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
