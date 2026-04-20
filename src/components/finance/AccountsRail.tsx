import { motion } from "framer-motion";
import { CreditCard, Wallet, Landmark, Banknote } from "lucide-react";
import type { Account } from "@/lib/mock-data";
import { formatMoney } from "@/lib/mock-data";

const iconMap = { bank: Landmark, cash: Banknote, wallet: Wallet, credit: CreditCard };

export function AccountsRail({ accounts }: { accounts: Account[] }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-3">
        {accounts.map((a, i) => {
          const Icon = iconMap[a.type];
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              className="relative flex h-36 w-56 shrink-0 flex-col justify-between overflow-hidden rounded-2xl p-4"
              style={{ background: a.gradient, boxShadow: "var(--shadow-md)" }}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/20 backdrop-blur">
                  <Icon className="h-4 w-4 text-foreground" />
                </div>
                {a.last4 && (
                  <span className="font-mono text-[11px] tracking-widest text-foreground/80">•• {a.last4}</span>
                )}
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-foreground/70">{a.name}</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">{formatMoney(a.balance)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}