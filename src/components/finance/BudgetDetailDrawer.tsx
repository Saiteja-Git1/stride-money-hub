import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingDown, TrendingUp, Calendar } from "lucide-react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Budget } from "@/lib/mock-data";
import { categoryById, formatMoney, transactions } from "@/lib/mock-data";
import { ProgressRing } from "./ProgressRing";

interface Props {
  budget: Budget | null;
  onClose: () => void;
}

export function BudgetDetailDrawer({ budget, onClose }: Props) {
  return (
    <AnimatePresence>
      {budget && <DrawerInner budget={budget} onClose={onClose} />}
    </AnimatePresence>
  );
}

function DrawerInner({ budget, onClose }: { budget: Budget; onClose: () => void }) {
  const cat = categoryById(budget.categoryId);
  const Icon = (Icons[cat.icon as keyof typeof Icons] as LucideIcon) ?? Icons.Circle;
  const pct = Math.min(100, (budget.spent / budget.limit) * 100);
  const remaining = Math.max(0, budget.limit - budget.spent);
  const danger = pct >= 90;
  const warn = pct >= 75 && !danger;
  const ringColor = danger ? "var(--destructive)" : warn ? "var(--warning)" : cat.color;

  // Days left in current month (UTC-stable)
  const now = new Date();
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const daysLeft = Math.max(0, Math.round((monthEnd.getTime() - today.getTime()) / 86400000));
  const dailyAllowance = daysLeft > 0 ? remaining / daysLeft : 0;

  const recent = transactions
    .filter((t) => t.categoryId === budget.categoryId)
    .slice(0, 4);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="fixed inset-x-0 bottom-0 z-[61] mx-auto max-w-md overflow-hidden rounded-t-3xl border border-white/5"
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
        <div className="relative">
          <div className="flex justify-center pt-2.5">
            <div className="h-1 w-10 rounded-full bg-white/15" />
          </div>
          <div className="flex items-center justify-between px-5 pt-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background: `color-mix(in oklab, ${cat.color} 20%, transparent)`,
                }}
              >
                <Icon className="h-5 w-5" style={{ color: cat.color }} />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Budget
                </p>
                <h3 className="text-[17px] font-semibold tracking-tight">{cat.name}</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="glass-subtle flex h-9 w-9 items-center justify-center rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Ring */}
          <div className="mt-5 flex flex-col items-center">
            <ProgressRing value={pct} size={148} stroke={12} color={ringColor}>
              <div className="text-center">
                <p className="text-[28px] font-bold leading-none tabular-nums">
                  {Math.round(pct)}%
                </p>
                <p className="mt-1 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
                  used
                </p>
              </div>
            </ProgressRing>
            <p className="mt-3 text-[12.5px] text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">
                {formatMoney(budget.spent)}
              </span>{" "}
              of {formatMoney(budget.limit)}
            </p>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-2 px-5">
            <Stat
              icon={TrendingDown}
              label="Remaining"
              value={formatMoney(remaining)}
              tone="primary"
            />
            <Stat
              icon={Calendar}
              label="Days left"
              value={`${daysLeft}d`}
              tone="default"
            />
            <Stat
              icon={TrendingUp}
              label="Daily safe"
              value={formatMoney(dailyAllowance)}
              tone={danger ? "danger" : "default"}
            />
          </div>

          {/* Recent */}
          <div className="mt-5 px-5 pb-5">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recent in {cat.name}
            </p>
            {recent.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 p-4 text-center text-[12px] text-muted-foreground">
                No transactions yet
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/5 bg-card">
                {recent.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between border-b border-border/30 p-3 last:border-0"
                  >
                    <p className="truncate text-[13px] font-medium">{t.note}</p>
                    <p className="shrink-0 text-[13px] font-semibold tabular-nums">
                      −{formatMoney(t.amount).replace("-", "")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "default" | "primary" | "danger";
}) {
  const color =
    tone === "primary"
      ? "var(--primary)"
      : tone === "danger"
      ? "var(--destructive)"
      : "var(--foreground)";
  return (
    <div
      className="rounded-2xl border border-white/5 p-3"
      style={{ background: "var(--gradient-card)" }}
    >
      <Icon className="h-3.5 w-3.5" style={{ color }} />
      <p className="mt-1.5 text-[15px] font-semibold tabular-nums" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}