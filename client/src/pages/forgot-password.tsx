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
import { LogoTenOnTen } from "@/components/LogoTenOnTen";

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const form = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    const forgotMutation = useMutation({
        mutationFn: async (data: ForgotPasswordForm) => {
            const res = await apiRequest('POST', '/api/auth/forgot-password', {
                email: data.email,
            });
            return res;
        },
        onSuccess: () => {
            toast({
                title: "Check your email",
                description: "If this email exists, you'll receive a password reset link.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: ForgotPasswordForm) => {
        forgotMutation.mutate(data);
    };

    return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center py-8 px-4 bg-black relative overflow-hidden">
            {/* Particles Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-radial from-violet-500/20 via-fuchsia-500/10 to-transparent blur-[80px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-radial from-blue-500/20 via-cyan-500/10 to-transparent blur-[80px] animate-pulse [animation-delay:1s]" />
            </div>

            <div className="flex flex-col items-center w-full max-w-[360px] relative z-10 animate-fade-in">
                <div className="md:scale-125 transition-transform duration-500">
                    <LogoTenOnTen size={200} />
                </div>

                <h2 className="text-white text-xl font-semibold mt-4 mb-2">Forgot Password</h2>
                <p className="text-white/60 text-sm text-center mb-6">
                    Enter your email and we'll send you a link to reset your password.
                </p>

                <div className="w-full">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-5">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col items-center">
                                        <span className="text-white/70 text-[11px] font-medium tracking-widest uppercase mb-2">
                                            EMAIL:
                                        </span>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                className="w-[280px] bg-white/90 text-black border-0 rounded-full h-10 text-center text-sm px-4 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 transition-all duration-300 hover:bg-white focus:bg-white shadow-inner"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-400 mt-1 text-xs text-center" />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-center pt-4">
                                <Button
                                    type="submit"
                                    className="w-[200px] bg-gradient-to-b from-gray-400 to-gray-600 text-white font-medium uppercase tracking-widest rounded-full h-9 text-xs border-2 border-white/30 hover:from-gray-300 hover:to-gray-500 hover:border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/10 active:scale-95"
                                    disabled={forgotMutation.isPending}
                                >
                                    {forgotMutation.isPending ? "SENDING..." : "SEND RESET LINK"}
                                </Button>
                            </div>

                            <div className="text-center text-xs text-gray-400 pt-2">
                                Remember your password?{" "}
                                <button
                                    type="button"
                                    className="text-white underline-offset-4 hover:underline hover:text-primary transition-colors"
                                    onClick={() => setLocation("/login")}
                                >
                                    Back to login
                                </button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
}
