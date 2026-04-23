import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";
import { formatMoney, type FinanceCurrency } from "@/lib/finance";
import { AnimatedNumber } from "./AnimatedNumber";

const sparklineY = [46, 31, 37, 26, 32, 12, 24, 5];

function formatBalance(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildSparklinePath(width: number, height: number, values: number[]) {
  if (values.length === 0) return "";

  const stepX = width / Math.max(values.length - 1, 1);
  const points = values.map((value, index) => ({
    x: index * stepX,
    y: Math.max(0, Math.min(height, value)),
  }));

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = (current.x + next.x) / 2;
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

const sparklinePath = buildSparklinePath(112, 52, sparklineY);

export function BalanceCard({
  total,
  income,
  expense,
  currency = "USD",
}: {
  total: number;
  income: number;
  expense: number;
  currency?: FinanceCurrency;
}) {
  const [hidden, setHidden] = useState(false);
  const net = income - expense;
  const previousBalance = Math.max(total - net, 1);
  const monthlyChange = (net / previousBalance) * 100;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-2.5"
    >
      <NeonShell
        accent="oklch(0.73 0.17 225)"
        surface="linear-gradient(135deg, oklch(0.24 0.03 217), oklch(0.17 0.018 195) 58%, oklch(0.15 0.014 180))"
        contentClassName="px-4 py-4 sm:px-5 sm:py-5"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(circle at 12% 0%, oklch(0.78 0.18 155 / 12%), transparent 34%), radial-gradient(circle at 88% 100%, oklch(0.72 0.16 210 / 10%), transparent 36%)",
          }}
        />

        <div className="relative flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-medium text-white/70">Total Balance</p>
              <button
                onClick={() => setHidden((value) => !value)}
                className="rounded-full p-1 text-white/55 transition hover:bg-white/8 hover:text-white active:scale-95"
                aria-label="Toggle balance visibility"
              >
                {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={hidden ? "hidden" : "visible"}
                initial={{ opacity: 0, y: 6, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -4, filter: "blur(8px)" }}
                transition={{ duration: 0.22 }}
                className="mt-2.5 text-[42px] font-semibold leading-none tracking-[-0.04em] text-white tabular-nums sm:text-[46px]"
              >
                {hidden ? "------" : <AnimatedNumber value={total} format={formatBalance} />}
              </motion.div>
            </AnimatePresence>

            <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px]">
              <span className="flex items-center gap-1 font-medium text-emerald-300">
                <TrendingUp className="h-3.5 w-3.5" />
                {net >= 0 ? "+" : "-"}
                {formatMoney(Math.abs(net), currency).replace("-", "")}
                <span className="text-emerald-300/90">({Math.abs(monthlyChange).toFixed(1)}%)</span>
              </span>
              <span className="text-white/50">this month</span>
            </div>
          </div>

          <div className="hidden shrink-0 self-center sm:block">
            <MiniTrend />
          </div>
        </div>
      </NeonShell>

      <div className="grid grid-cols-3 gap-2.5">
        <MetricTile
          label="Income"
          value={hidden ? "----" : formatMoney(income, currency)}
          caption="This month"
          icon={ArrowDownLeft}
          accent="oklch(0.78 0.18 155)"
          iconBackground="color-mix(in oklab, oklch(0.78 0.18 155) 24%, transparent)"
          iconColor="oklch(0.78 0.18 155)"
        />
        <MetricTile
          label="Expenses"
          value={hidden ? "----" : formatMoney(expense, currency)}
          caption="This month"
          icon={ArrowUpRight}
          accent="oklch(0.72 0.21 24)"
          iconBackground="color-mix(in oklab, oklch(0.68 0.22 22) 24%, transparent)"
          iconColor="oklch(0.78 0.18 22)"
        />
        <MetricTile
          label="Net Savings"
          value={hidden ? "----" : formatMoney(net, currency)}
          caption="This month"
          icon={Wallet}
          accent="oklch(0.76 0.16 302)"
          iconBackground="color-mix(in oklab, oklch(0.7 0.16 290) 24%, transparent)"
          iconColor="oklch(0.78 0.14 305)"
        />
      </div>
    </motion.section>
  );
}

function MiniTrend() {
  return (
    <div className="w-[92px]">
      <svg width="92" height="56" viewBox="0 0 112 52" fill="none" aria-hidden="true">
        <defs>
          <linearGradient
            id="balance-card-line"
            x1="0"
            y1="52"
            x2="112"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="oklch(0.72 0.16 175)" />
            <stop offset="100%" stopColor="oklch(0.78 0.18 155)" />
          </linearGradient>
          <filter id="balance-card-glow" x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.path
          d={sparklinePath}
          stroke="url(#balance-card-line)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#balance-card-glow)"
          initial={{ pathLength: 0, opacity: 0.5 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
        />
      </svg>
    </div>
  );
}

function MetricTile({
  label,
  value,
  caption,
  icon: Icon,
  accent,
  iconBackground,
  iconColor,
}: {
  label: string;
  value: string;
  caption: string;
  icon: typeof ArrowDownLeft;
  accent: string;
  iconBackground: string;
  iconColor: string;
}) {
  return (
    <NeonShell
      accent={accent}
      surface="linear-gradient(180deg, oklch(0.19 0.014 260), oklch(0.175 0.012 260))"
      contentClassName="px-3 py-3"
      radius={18}
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full"
        style={{ background: iconBackground, color: iconColor }}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <p className="mt-3 text-[11px] font-medium text-white/68">{label}</p>
      <p className="mt-1 text-[15px] font-semibold leading-none text-white tabular-nums sm:text-[17px]">
        {value}
      </p>
      <p className="mt-1.5 text-[11px] text-white/42">{caption}</p>
    </NeonShell>
  );
}

function NeonShell({
  children,
  accent,
  surface,
  contentClassName,
  radius = 24,
}: {
  children: React.ReactNode;
  accent: string;
  surface: string;
  contentClassName: string;
  radius?: number;
}) {
  const innerRadius = radius - 2;

  return (
    <div className="relative">
      <div
        className={`relative overflow-hidden border ${contentClassName}`}
        style={{
          borderRadius: innerRadius,
          borderColor: `color-mix(in oklab, ${accent} 70%, white 10%)`,
          background: surface,
          backdropFilter: "blur(18px) saturate(135%)",
          WebkitBackdropFilter: "blur(18px) saturate(135%)",
          boxShadow: `0 18px 34px -24px oklch(0 0 0 / 76%), inset 0 1px 0 oklch(1 0 0 / 10%), inset 0 0 0 1px color-mix(in oklab, ${accent} 20%, transparent)`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg, oklch(1 0 0 / 0.045), transparent 28%),
              radial-gradient(circle at 14% 0%, color-mix(in oklab, ${accent} 20%, transparent), transparent 38%),
              radial-gradient(circle at 100% 100%, color-mix(in oklab, ${accent} 14%, transparent), transparent 34%)
            `,
          }}
        />
        {children}
      </div>
    </div>
  );
}
