import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/integrations/supabase/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in - Lumen" }] }),
  component: AuthPage,
});

type Mode = "sign-in" | "sign-up" | "forgot" | "reset";

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Detect recovery token in URL hash — Supabase puts #access_token=...&type=recovery
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setMode("reset");
    }
  }, []);

  // Redirect if already logged in (but not in reset mode)
  useEffect(() => {
    if (!loading && session && mode !== "reset") {
      void navigate({ to: "/", replace: true });
    }
  }, [loading, navigate, session, mode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const trimmedEmail = email.trim();
    setSubmitting(true);

    try {
      if (mode === "reset") {
        if (!password || password.length < 6) {
          toast.error("Password must be at least 6 characters.");
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("Password updated! Signing you in...");
        void navigate({ to: "/", replace: true });
        return;
      }

      if (mode === "forgot") {
        if (!trimmedEmail) { toast.error("Enter your email."); return; }
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: `${window.location.origin}/auth/reset`,
        });
        if (error) throw error;
        toast.success("Reset link sent. Check your email.");
        setMode("sign-in");
        return;
      }

      if (!trimmedEmail || !password) { toast.error("Enter email and password."); return; }

      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
        if (error) throw error;
        toast.success("Welcome back.");
        void navigate({ to: "/", replace: true });
      } else {
        if (!name.trim()) { toast.error("Enter your full name."); return; }
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { name: name.trim() },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account ready.");
          void navigate({ to: "/", replace: true });
        } else {
          toast.success("Check your email to confirm, then sign in.");
          setMode("sign-in");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-80" style={{
        background: "radial-gradient(circle at top left, oklch(0.73 0.17 225 / 16%), transparent 28%), radial-gradient(circle at 85% 12%, oklch(0.78 0.18 155 / 12%), transparent 24%), radial-gradient(circle at bottom, oklch(0.76 0.16 302 / 12%), transparent 30%)",
      }} />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-7">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px]"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="mt-6 text-[32px] font-semibold tracking-tight text-foreground">
            {mode === "forgot" ? "Reset your password"
              : mode === "reset" ? "Set a new password"
              : "Money feels calmer when everything lives in one place."}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {mode === "forgot" ? "Enter your email and we'll send a reset link."
              : mode === "reset" ? "Choose a strong password for your account."
              : "Sign in or create an account to track budgets, goals, and cash flow."}
          </p>
        </div>

        <div className="glass rounded-[30px] p-3">
          {/* Tab toggle — only for sign-in / sign-up */}
          {mode !== "forgot" && mode !== "reset" && (
            <div className="grid grid-cols-2 gap-2 rounded-[20px] bg-black/20 p-1">
              {(["sign-in", "sign-up"] as Mode[]).map((m) => (
                <button key={m} onClick={() => setMode(m)} type="button"
                  className="relative rounded-[16px] px-4 py-2.5 text-sm font-semibold transition"
                  style={{ color: mode === m ? "var(--primary-foreground)" : "var(--muted-foreground)" }}>
                  {mode === m && <span className="absolute inset-0 rounded-[16px]" style={{ background: "var(--gradient-primary)" }} />}
                  <span className="relative">{m === "sign-in" ? "Sign in" : "Create account"}</span>
                </button>
              ))}
            </div>
          )}

          <form className="space-y-4 px-2 pb-2 pt-5" onSubmit={handleSubmit}>
            {mode === "sign-up" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[12px] uppercase tracking-[0.14em] text-muted-foreground">Full name</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" autoComplete="name" className="h-12 rounded-2xl border-white/8 bg-white/[0.03] pl-10"
                    placeholder="Saiteja Samala" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
            )}

            {mode !== "reset" && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[12px] uppercase tracking-[0.14em] text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" autoComplete="email"
                    className="h-12 rounded-2xl border-white/8 bg-white/[0.03] pl-10"
                    placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
            )}

            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
                  {mode === "reset" ? "New password" : "Password"}
                </Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"}
                    autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                    className="h-12 rounded-2xl border-white/8 bg-white/[0.03] pl-10 pr-11"
                    placeholder="At least 6 characters"
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground"
                    aria-label={showPassword ? "Hide" : "Show"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "sign-in" && (
              <div className="text-right">
                <button type="button" onClick={() => setMode("forgot")}
                  className="text-[12px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <Button className="mt-2 h-12 w-full rounded-2xl text-sm font-semibold" disabled={submitting} type="submit">
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Working...</>
                : mode === "sign-in" ? "Sign in"
                : mode === "sign-up" ? "Create account"
                : mode === "forgot" ? "Send reset link"
                : "Set new password"}
            </Button>

            {(mode === "forgot") && (
              <button type="button" onClick={() => setMode("sign-in")}
                className="w-full text-center text-[12px] text-muted-foreground hover:text-foreground">
                ← Back to sign in
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}