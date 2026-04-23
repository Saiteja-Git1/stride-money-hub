import { motion } from "framer-motion";
import { Banknote, CreditCard, Landmark, Wallet } from "lucide-react";
import { accountGradient, formatMoney, type FinanceAccount } from "@/lib/finance";

const iconMap = { bank: Landmark, cash: Banknote, wallet: Wallet, credit: CreditCard };
const typeLabel: Record<FinanceAccount["type"], string> = {
  bank: "Bank",
  cash: "Cash",
  wallet: "Wallet",
  credit: "Credit",
};

export function AccountsRail({ accounts }: { accounts: FinanceAccount[] }) {
  return (
    <div className="scroll-snap-x no-scrollbar -mx-5 overflow-x-auto px-5 pb-2">
      <div className="flex gap-3">
        {accounts.map((a, i) => {
          const Icon = iconMap[a.type];
          const negative = a.balance < 0;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.05 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              whileTap={{ scale: 0.97 }}
              className="snap-card relative flex h-40 w-60 shrink-0 flex-col justify-between overflow-hidden rounded-3xl p-4"
              style={{
                background: accountGradient(a),
                boxShadow: "var(--shadow-card), var(--shadow-inset)",
              }}
            >
              {/* Glossy highlight */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
                style={{
                  background:
                    "linear-gradient(180deg, oklch(1 0 0 / 14%), transparent 100%)",
                }}
              />
              {/* Soft sphere */}
              <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/20 backdrop-blur-md">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <span className="rounded-full border border-white/15 bg-black/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground/85 backdrop-blur-md">
                    {typeLabel[a.type]}
                  </span>
                </div>
                {a.last4 && (
                  <span className="font-mono text-[11px] tracking-widest text-foreground/80">
                    •• {a.last4}
                  </span>
                )}
              </div>
              <div className="relative">
                <p className="text-[11px] font-medium uppercase tracking-wider text-foreground/75">
                  {a.name}
                </p>
                <p
                  className="mt-0.5 text-[22px] font-semibold leading-none tabular-nums text-foreground"
                  style={negative ? { color: "oklch(0.95 0.03 30)" } : undefined}
                >
                  {formatMoney(a.balance, a.currency)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
