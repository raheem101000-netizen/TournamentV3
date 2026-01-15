import { useLocation, useSearch } from "wouter";
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

const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
    const [, setLocation] = useLocation();
    const searchString = useSearch();
    const params = new URLSearchParams(searchString);
    const token = params.get("token");
    const { toast } = useToast();

    const form = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: "",
        },
    });

    const resetMutation = useMutation({
        mutationFn: async (data: ResetPasswordForm) => {
            const res = await apiRequest('POST', '/api/auth/reset-password', {
                token: token,
                newPassword: data.newPassword,
            });
            return res;
        },
        onSuccess: () => {
            toast({
                title: "Password reset!",
                description: "Your password has been reset. You can now log in.",
            });
            setLocation("/login");
        },
        onError: (error: any) => {
            toast({
                title: "Reset failed",
                description: error.message || "Invalid or expired reset link. Please request a new one.",
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: ResetPasswordForm) => {
        resetMutation.mutate(data);
    };

    if (!token) {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center py-8 px-4 bg-black">
                <div className="text-white text-center">
                    <h2 className="text-xl font-semibold mb-4">Invalid Reset Link</h2>
                    <p className="text-white/60 mb-4">This password reset link is invalid or has expired.</p>
                    <Button
                        onClick={() => setLocation("/forgot-password")}
                        className="bg-gradient-to-b from-gray-400 to-gray-600 text-white font-medium uppercase tracking-widest rounded-full h-9 text-xs border-2 border-white/30"
                    >
                        Request New Link
                    </Button>
                </div>
            </div>
        );
    }

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

                <h2 className="text-white text-xl font-semibold mt-4 mb-2">Reset Password</h2>
                <p className="text-white/60 text-sm text-center mb-6">
                    Enter your new password below.
                </p>

                <div className="w-full">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-5">
                            <FormField
                                control={form.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col items-center">
                                        <span className="text-white/70 text-[11px] font-medium tracking-widest uppercase mb-2">
                                            NEW PASSWORD:
                                        </span>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                className="w-[280px] bg-white/90 text-black border-0 rounded-full h-10 text-center text-sm px-4 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 transition-all duration-300 hover:bg-white focus:bg-white shadow-inner"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-400 mt-1 text-xs text-center" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col items-center">
                                        <span className="text-white/70 text-[11px] font-medium tracking-widest uppercase mb-2">
                                            CONFIRM PASSWORD:
                                        </span>
                                        <FormControl>
                                            <Input
                                                type="password"
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
                                    disabled={resetMutation.isPending}
                                >
                                    {resetMutation.isPending ? "RESETTING..." : "RESET PASSWORD"}
                                </Button>
                            </div>

                            <div className="text-center text-xs text-gray-400 pt-2">
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
