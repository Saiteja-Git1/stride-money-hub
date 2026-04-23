import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Landmark, Wallet, CreditCard, Banknote, X } from "lucide-react";
import { toast } from "sonner";
import type { FinanceAccountType, FinanceCurrency } from "@/lib/finance";
import { useFinance } from "@/integrations/supabase/use-finance";

const ACCOUNT_TYPES: Array<{
  icon: typeof Landmark;
  label: string;
  value: FinanceAccountType;
}> = [
  { icon: Landmark, label: "Bank", value: "bank" },
  { icon: Banknote, label: "Cash", value: "cash" },
  { icon: Wallet, label: "Wallet", value: "wallet" },
  { icon: CreditCard, label: "Credit", value: "credit" },
];

export function AddAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addAccount } = useFinance();
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState<FinanceCurrency>("INR");
  const [last4, setLast4] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<FinanceAccountType>("bank");

  useEffect(() => {
    if (!open) {
      setName("");
      setBalance("");
      setLast4("");
      setCurrency("INR");
      setType("bank");
      setSaving(false);
    }
  }, [open]);

  const parsedBalance = Number(balance || 0);
  const canSave = name.trim().length > 1 && Number.isFinite(parsedBalance) && !saving;

  async function handleSubmit() {
    if (!canSave) return;

    setSaving(true);
    try {
      await addAccount({
        balance: parsedBalance,
        currency,
        last4: last4.trim(),
        name,
        type,
      });
      toast.success("Account added.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-[71] mx-auto max-w-md overflow-hidden rounded-t-3xl border border-white/5"
            style={{
              background: "var(--background)",
              boxShadow: "0 -20px 60px -20px oklch(0 0 0 / 60%)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{ background: "var(--gradient-mesh)" }}
            />

            <div className="relative px-5 pb-5 pt-3">
              <div className="flex justify-center">
                <div className="h-1 w-10 rounded-full bg-white/15" />
              </div>

              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Setup
                  </p>
                  <h3 className="mt-0.5 text-[17px] font-semibold tracking-tight">
                    Add your first account
                  </h3>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Start with the wallet, bank, or credit account you use most.
                  </p>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  aria-label="Close"
                  className="glass-subtle flex h-9 w-9 items-center justify-center rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Account type
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOUNT_TYPES.map((accountType) => {
                    const active = type === accountType.value;
                    const Icon = accountType.icon;
                    return (
                      <button
                        key={accountType.value}
                        onClick={() => setType(accountType.value)}
                        className="rounded-2xl border px-3 py-3 text-left transition-all"
                        style={{
                          borderColor: active
                            ? "color-mix(in oklab, var(--primary) 70%, transparent)"
                            : "oklch(1 0 0 / 8%)",
                          background: active
                            ? "color-mix(in oklab, var(--primary) 12%, transparent)"
                            : "color-mix(in oklab, var(--foreground) 4%, transparent)",
                        }}
                      >
                        <Icon
                          className="h-4 w-4"
                          style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
                        />
                        <p className="mt-2 text-[12.5px] font-semibold">{accountType.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Account name"
                  className="glass-subtle h-12 w-full rounded-2xl px-4 text-[13px] outline-none placeholder:text-muted-foreground"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    inputMode="decimal"
                    value={balance}
                    onChange={(event) => setBalance(event.target.value.replace(/[^\d.-]/g, ""))}
                    placeholder="Opening balance"
                    className="glass-subtle h-12 rounded-2xl px-4 text-[13px] outline-none placeholder:text-muted-foreground"
                  />
                  <select
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value as FinanceCurrency)}
                    className="glass-subtle h-12 rounded-2xl px-4 text-[13px] outline-none"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <input
                  value={last4}
                  onChange={(event) => setLast4(event.target.value.replace(/\D/g, "").slice(-4))}
                  placeholder="Last 4 digits (optional)"
                  className="glass-subtle h-12 w-full rounded-2xl px-4 text-[13px] outline-none placeholder:text-muted-foreground"
                />
              </div>

              <motion.button
                whileTap={{ scale: canSave ? 0.97 : 1 }}
                disabled={!canSave}
                onClick={() => {
                  void handleSubmit();
                }}
                className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl text-[14px] font-semibold transition-opacity disabled:opacity-40"
                style={{
                  background: "var(--gradient-primary)",
                  color: "var(--primary-foreground)",
                  boxShadow: canSave ? "var(--shadow-glow)" : "none",
                }}
              >
                {saving ? "Saving..." : "Create account"}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
