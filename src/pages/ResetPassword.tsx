import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, Loader2 } from "lucide-react";

type Status = "verifying" | "ready" | "invalid";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<Status>("verifying");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let active = true;

    const init = async () => {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const queryParams = url.searchParams;

      // 1. Surface errors from the email link
      const errDesc =
        hashParams.get("error_description") || queryParams.get("error_description");
      if (errDesc) {
        if (!active) return;
        setErrorMsg(decodeURIComponent(errDesc.replace(/\+/g, " ")));
        setStatus("invalid");
        return;
      }

      // 2. New-style PKCE link: ?code=...
      const code = queryParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (error) {
          setErrorMsg(error.message);
          setStatus("invalid");
        } else {
          window.history.replaceState({}, "", "/reset-password");
          setStatus("ready");
        }
        return;
      }

      // 3. token_hash style: ?token_hash=...&type=recovery
      const tokenHash = queryParams.get("token_hash");
      const type = queryParams.get("type") || hashParams.get("type");
      if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        });
        if (!active) return;
        if (error) {
          setErrorMsg(error.message);
          setStatus("invalid");
        } else {
          window.history.replaceState({}, "", "/reset-password");
          setStatus("ready");
        }
        return;
      }

      // 4. Implicit flow: #access_token=...&type=recovery (Supabase parses automatically)
      if (hashParams.get("access_token") && hashParams.get("type") === "recovery") {
        // Give Supabase a tick to set the session from the hash
        await new Promise((r) => setTimeout(r, 150));
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        if (data.session) {
          window.history.replaceState({}, "", "/reset-password");
          setStatus("ready");
        } else {
          setStatus("invalid");
        }
        return;
      }

      // 5. Already in a recovery session?
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        setStatus("ready");
      } else {
        setStatus("invalid");
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
      return;
    }
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters." });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ variant: "destructive", title: "Couldn't update password", description: error.message });
      setIsLoading(false);
      return;
    }
    await supabase.auth.signOut();
    toast({ title: "Password updated!", description: "Sign in with your new password." });
    navigate("/auth", { replace: true });
  };

  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-background bg-textile flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-background bg-textile flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-xl font-semibold text-foreground">Invalid or expired link</h1>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            {errorMsg || "This password reset link is no longer valid. Request a new one to continue."}
          </p>
          <a href="/auth" className="text-primary font-medium hover:underline">Back to Sign In</a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-textile flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <a href="/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Sign In
        </a>
        <div className="bg-card rounded-xl p-8 shadow-card border border-border">
          <div className="text-center mb-8">
            <span className="font-display text-2xl font-bold text-primary">
              LOOM<span className="text-secondary">LIVE</span>
            </span>
            <h1 className="font-display text-xl font-semibold text-foreground mt-4">Set New Password</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="mt-1" />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px]">
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
