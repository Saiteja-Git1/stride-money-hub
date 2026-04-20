import { Link, useLocation } from "@tanstack/react-router";
import { Home, ArrowLeftRight, Target, PieChart, Plus } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/transactions", label: "Activity", icon: ArrowLeftRight },
  { to: "/budgets", label: "Budgets", icon: PieChart },
  { to: "/goals", label: "Goals", icon: Target },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <>
      <button
        aria-label="Add transaction"
        className="fixed bottom-20 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground transition-transform active:scale-95"
        style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/80 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1 px-2 py-2">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-colors"
              >
                <Icon
                  className="h-5 w-5 transition-colors"
                  style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                <span
                  className="text-[10px] font-medium transition-colors"
                  style={{ color: active ? "var(--foreground)" : "var(--muted-foreground)" }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}