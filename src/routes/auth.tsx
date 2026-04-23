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
  head: () => ({
    meta: [
      { title: "Sign in - Lumen" },
      {
        name: "description",
        content: "Sign in or create your Lumen account to access your money hub.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "sign-in" | "sign-up";

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      void navigate({ to: "/", replace: true });
    }
  }, [loading, navigate, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !password.trim()) {
      toast.error("Enter your email and password.");
      return;
    }

    if (mode === "sign-up" && !trimmedName) {
      toast.error("Enter your full name to create your account.");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) throw error;

        toast.success("Welcome back.");
        void navigate({ to: "/", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              name: trimmedName,
            },
            emailRedirectTo:
              typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined,
          },
        });

        if (error) throw error;

        if (data.session) {
          toast.success("Your account is ready.");
          void navigate({ to: "/", replace: true });
        } else {
          toast.success("Check your email to confirm your account, then sign in.");
          setMode("sign-in");
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at top left, oklch(0.73 0.17 225 / 16%), transparent 28%), radial-gradient(circle at 85% 12%, oklch(0.78 0.18 155 / 12%), transparent 24%), radial-gradient(circle at bottom, oklch(0.76 0.16 302 / 12%), transparent 30%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-7">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-[20px]"
            style={{
              background: "var(--gradient-primary)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="mt-6 text-[32px] font-semibold tracking-tight text-foreground">
            Money feels calmer when everything lives in one place.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Sign in to your Stride Money Hub or create a fresh account to start tracking budgets,
            goals, and cash flow.
          </p>
        </div>

        <div className="glass rounded-[30px] p-3">
          <div className="grid grid-cols-2 gap-2 rounded-[20px] bg-black/20 p-1">
            <button
              onClick={() => setMode("sign-in")}
              className="relative rounded-[16px] px-4 py-2.5 text-sm font-semibold transition"
              style={{
                color: mode === "sign-in" ? "var(--primary-foreground)" : "var(--muted-foreground)",
              }}
              type="button"
            >
              {mode === "sign-in" && (
                <span
                  className="absolute inset-0 rounded-[16px]"
                  style={{ background: "var(--gradient-primary)" }}
                />
              )}
              <span className="relative">Sign in</span>
            </button>
            <button
              onClick={() => setMode("sign-up")}
              className="relative rounded-[16px] px-4 py-2.5 text-sm font-semibold transition"
              style={{
                color: mode === "sign-up" ? "var(--primary-foreground)" : "var(--muted-foreground)",
              }}
              type="button"
            >
              {mode === "sign-up" && (
                <span
                  className="absolute inset-0 rounded-[16px]"
                  style={{ background: "var(--gradient-primary)" }}
                />
              )}
              <span className="relative">Create account</span>
            </button>
          </div>

          <form className="space-y-4 px-2 pb-2 pt-5" onSubmit={handleSubmit}>
            {mode === "sign-up" && (
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-[12px] uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Full name
                </Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    autoComplete="name"
                    className="h-12 rounded-2xl border-white/8 bg-white/[0.03] pl-10"
                    placeholder="Saiteja Samala"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[12px] uppercase tracking-[0.14em] text-muted-foreground"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="h-12 rounded-2xl border-white/8 bg-white/[0.03] pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-[12px] uppercase tracking-[0.14em] text-muted-foreground"
              >
                Password
              </Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  className="h-12 rounded-2xl border-white/8 bg-white/[0.03] pl-10 pr-11"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/8 hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              className="mt-2 h-12 w-full rounded-2xl text-sm font-semibold"
              disabled={submitting}
              type="submit"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Working...
                </>
              ) : mode === "sign-in" ? (
                "Sign in to Stride"
              ) : (
                "Create your account"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
