import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setStatus("error");
        setMessage("No verification token provided");
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          setTimeout(() => {
            setLocation("/login");
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to verify email");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during verification");
      }
    };

    verifyEmail();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {status === "loading" && "Verifying your email..."}
            {status === "success" && "Your email has been verified"}
            {status === "error" && "Verification failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "loading" && (
            <Loader2 className="w-12 h-12 animate-spin text-primary" data-testid="loading-spinner" />
          )}
          {status === "success" && (
            <CheckCircle className="w-12 h-12 text-green-600" data-testid="success-icon" />
          )}
          {status === "error" && (
            <AlertCircle className="w-12 h-12 text-red-600" data-testid="error-icon" />
          )}

          <p className="text-center text-muted-foreground" data-testid="verification-message">
            {message}
          </p>

          {status === "success" && (
            <p className="text-sm text-muted-foreground text-center">
              Redirecting to login...
            </p>
          )}

          {status === "error" && (
            <div className="w-full flex gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/login")}
                className="flex-1"
                data-testid="button-back-to-login"
              >
                Back to Login
              </Button>
              <Button
                variant="default"
                onClick={() => setLocation("/check-email")}
                className="flex-1"
                data-testid="button-resend-email"
              >
                Resend Email
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
