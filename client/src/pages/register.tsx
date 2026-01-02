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
    <div className="min-h-[100dvh] flex flex-col items-center justify-center py-8 px-4 bg-black relative overflow-hidden">
      {/* Enhanced Gradient Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-radial from-violet-500/20 via-fuchsia-500/10 to-transparent blur-[80px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-radial from-blue-500/20 via-cyan-500/10 to-transparent blur-[80px] animate-pulse [animation-delay:1s]" />
      </div>

      <div className="flex flex-col items-center w-full max-w-[400px] relative z-10 animate-fade-in">
        <div className="md:scale-110 transition-transform duration-500">
          <LogoTenOnTen size={240} />
        </div>

        {/* Glass Form Container */}
        <div className="w-full mt-6 p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="animate-slide-up [animation-delay:100ms]">
                    <div className="flex items-center gap-3">
                      <span className="text-white/70 text-[11px] font-medium tracking-widest uppercase w-[90px] text-right shrink-0">
                        NAME:
                      </span>
                      <FormControl>
                        <Input
                          className="flex-1 bg-white/90 text-black border-0 rounded-full h-9 text-sm px-4 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 transition-all duration-300 hover:bg-white focus:bg-white shadow-inner"
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
                  <FormItem className="animate-slide-up [animation-delay:150ms]">
                    <div className="flex items-center gap-3">
                      <span className="text-white/70 text-[11px] font-medium tracking-widest uppercase w-[90px] text-right shrink-0">
                        EMAIL:
                      </span>
                      <FormControl>
                        <Input
                          type="email"
                          className="flex-1 bg-white/90 text-black border-0 rounded-full h-9 text-sm px-4 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 transition-all duration-300 hover:bg-white focus:bg-white shadow-inner"
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
                  <FormItem className="animate-slide-up [animation-delay:200ms]">
                    <div className="flex items-center gap-3">
                      <span className="text-white/70 text-[11px] font-medium tracking-widest uppercase w-[90px] text-right shrink-0">
                        PASSWORD:
                      </span>
                      <FormControl>
                        <PasswordInput
                          className="flex-1 bg-white/90 text-black border-0 rounded-full h-9 text-sm focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 transition-all duration-300 [&>input]:bg-transparent [&>input]:text-black [&>input]:h-9 [&>input]:text-sm [&>input]:px-4 [&>button]:text-black [&>button]:hover:bg-gray-100 [&>button]:h-9 [&>button]:w-9"
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
                  <FormItem className="animate-slide-up [animation-delay:250ms]">
                    <div className="flex items-center gap-3">
                      <span className="text-white/70 text-[11px] font-medium tracking-widest uppercase w-[90px] text-right shrink-0">
                        CONFIRM:
                      </span>
                      <FormControl>
                        <PasswordInput
                          className="flex-1 bg-white/90 text-black border-0 rounded-full h-9 text-sm focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 transition-all duration-300 [&>input]:bg-transparent [&>input]:text-black [&>input]:h-9 [&>input]:text-sm [&>input]:px-4 [&>button]:text-black [&>button]:hover:bg-gray-100 [&>button]:h-9 [&>button]:w-9"
                          {...field}
                          testid="input-confirm-password"
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="text-red-400 mt-1 text-xs pl-[102px]" />
                  </FormItem>
                )}
              />

              <div className="pt-3 pl-[102px] animate-slide-up [animation-delay:300ms]">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-b from-gray-200 to-gray-400 text-black font-semibold uppercase tracking-widest rounded-full h-10 text-sm border-2 border-white/50 hover:from-white hover:to-gray-300 hover:border-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/20 active:scale-95"
                  disabled={registerMutation.isPending}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? "CREATING..." : "CREATE ACCOUNT"}
                </Button>
              </div>

              <div className="text-center text-xs text-gray-400 pt-2 animate-slide-up [animation-delay:350ms]">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-white underline-offset-4 hover:underline hover:text-primary transition-colors"
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
    </div>
  );
}
