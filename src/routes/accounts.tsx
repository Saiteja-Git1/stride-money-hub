import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { Plus, Landmark, Banknote, Wallet, CreditCard } from "lucide-react";
import { AppShell } from "@/components/finance/AppShell";
import { AddAccountDialog } from "@/components/finance/AddAccountDialog";
import { useFinance } from "@/integrations/supabase/use-finance";
import { formatMoney, accountGradient } from "@/lib/finance";

const TYPE_ICON: Record<string, typeof Landmark> = {
  bank: Landmark,
  cash: Banknote,
  wallet: Wallet,
  credit: CreditCard,
};

export const Route = createFileRoute("/accounts")({
  head: () => ({ meta: [{ title: "Accounts — Lumen" }] }),
  component: AccountsPage,
});

function AccountsPage() {
  const { accounts } = useFinance();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <AppShell>
      <AddAccountDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <header className="sticky top-0 z-30 bg-background/60 px-5 pb-3 pt-6 backdrop-blur-xl backdrop-saturate-150">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
            aria-label="Add account"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          {accounts.length} account{accounts.length !== 1 ? "s" : ""}
        </p>
      </header>

      <section className="mt-3 space-y-3 px-5">
        {accounts.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No accounts yet.</p>
            <button
              onClick={() => setDialogOpen(true)}
              className="mt-4 h-11 rounded-2xl px-6 text-[13px] font-semibold"
              style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
            >
              Add your first account
            </button>
          </div>
        ) : (
          accounts.map((account, i) => {
            const Icon = TYPE_ICON[account.type] ?? Icons.Wallet;
            const gradient = accountGradient(account);
            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative overflow-hidden rounded-3xl p-5"
                style={{ background: gradient, boxShadow: "var(--shadow-card)" }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-30"
                  style={{ background: "linear-gradient(135deg, oklch(1 0 0 / 14%), transparent 55%)" }} />
                <div className="relative flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-white/80" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70 capitalize">
                        {account.type}
                      </span>
                    </div>
                    <p className="mt-2 text-[18px] font-semibold text-white">{account.name}</p>
                    {account.last4 && (
                      <p className="mt-0.5 text-[12px] text-white/60">•••• {account.last4}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-white/60">Balance</p>
                    <p className="mt-1 text-[22px] font-bold tabular-nums text-white">
                      {formatMoney(account.balance, account.currency)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/60">{account.currency}</p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </section>
    </AppShell>
  );
}