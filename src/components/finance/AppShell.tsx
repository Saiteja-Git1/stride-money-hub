import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BottomNav } from "./BottomNav";
import { useAuth } from "@/integrations/supabase/use-auth";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      void navigate({ to: "/auth", replace: true });
    }
  }, [loading, navigate, session]);

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-background px-5">
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center">
          <div className="glass mx-auto w-full max-w-sm rounded-[28px] px-5 py-6 text-center">
            <div
              className="mx-auto h-12 w-12 rounded-2xl"
              style={{
                background: "var(--gradient-primary)",
                boxShadow: "var(--shadow-glow)",
              }}
            />
            <p className="mt-4 text-sm font-semibold text-foreground">Loading your workspace</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Checking your session and getting things ready.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto min-h-screen max-w-md pb-28">{children}</div>
      <BottomNav />
    </div>
  );
}
