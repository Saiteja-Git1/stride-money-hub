import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeftRight, Home, PieChart, Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { QuickAddSheet } from "./QuickAddSheet";
import { useFinance } from "@/integrations/supabase/use-finance";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/transactions", label: "Activity", icon: ArrowLeftRight },
  { to: "/budgets", label: "Budgets", icon: PieChart },
  { to: "/goals", label: "Goals", icon: Target },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  const [quickOpen, setQuickOpen] = useState(false);
  const { accounts, addTransaction, categories } = useFinance();

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.04 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        aria-label="Add transaction"
        onClick={() => setQuickOpen(true)}
        className="fixed bottom-20 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground"
        style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
      >
        <Plus className="h-6 w-6" strokeWidth={2.6} />
      </motion.button>
      <QuickAddSheet
        accounts={accounts}
        categories={categories}
        open={quickOpen}
        onOpenChange={setQuickOpen}
        onSave={async (data) => {
          await addTransaction({
            accountId: data.accountId,
            amount: data.amount,
            categoryId: data.categoryId,
            currency: data.currency,
            note: data.note,
            type: data.type,
          });
          toast.success(
            `${data.type === "income" ? "Income" : "Expense"} of ${
              data.currency === "INR" ? "₹" : "$"
            }${data.amount.toFixed(2)} added`,
          );
        }}
      />
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 bg-background/70 backdrop-blur-2xl backdrop-saturate-150"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="relative mx-auto grid max-w-md grid-cols-4 gap-1 px-2 py-2">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className="relative flex flex-col items-center gap-0.5 rounded-2xl px-2 py-2"
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-3 inset-y-1 rounded-2xl"
                    style={{
                      background:
                        "color-mix(in oklab, var(--primary) 14%, transparent)",
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  className="relative h-[19px] w-[19px] transition-colors"
                  style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
                  strokeWidth={active ? 2.4 : 1.9}
                />
                <span
                  className="relative text-[10px] font-medium transition-colors"
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
