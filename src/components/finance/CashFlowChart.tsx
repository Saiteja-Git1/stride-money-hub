import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { motion } from "framer-motion";
import { formatMoney, type FinanceCurrency } from "@/lib/finance";

interface CashFlowPoint {
  day: string;
  income: number;
  expense: number;
}

export function CashFlowChart({
  currency = "USD",
  data,
  label,
}: {
  currency?: FinanceCurrency;
  data: CashFlowPoint[];
  label: string;
}) {
  const totalIn = data.reduce((sum, entry) => sum + entry.income, 0);
  const totalOut = data.reduce((sum, entry) => sum + entry.expense, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl p-5"
      style={{
        background: "var(--gradient-card)",
        boxShadow: "var(--shadow-card), var(--shadow-inset)",
      }}
    >
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Cash flow
          </p>
          <p className="mt-0.5 text-[15px] font-semibold tracking-tight">{label}</p>
        </div>
        <div className="flex items-center gap-3">
          <Legend dotClass="bg-success" label="In" amount={formatMoney(totalIn, currency)} />
          <Legend dotClass="bg-destructive" label="Out" amount={formatMoney(totalOut, currency)} />
        </div>
      </div>
      <div className="-mx-1 h-36 w-[calc(100%+8px)]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="grIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.18 155)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="oklch(0.78 0.18 155)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.68 0.22 22)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="oklch(0.68 0.22 22)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "oklch(0.66 0.018 270)" }}
              axisLine={false}
              tickLine={false}
              dy={4}
            />
            <Tooltip
              cursor={{ stroke: "oklch(1 0 0 / 12%)", strokeWidth: 1 }}
              contentStyle={{
                background: "oklch(0.22 0.015 270 / 95%)",
                border: "1px solid oklch(1 0 0 / 8%)",
                borderRadius: 14,
                fontSize: 12,
                padding: "8px 12px",
                backdropFilter: "blur(12px)",
                boxShadow: "0 12px 40px -12px oklch(0 0 0 / 60%)",
              }}
              labelStyle={{ color: "oklch(0.66 0.018 270)", fontSize: 10, marginBottom: 4 }}
              formatter={(value, name) => [
                formatMoney(Number(value), currency),
                name === "income" ? "In" : "Out",
              ]}
              labelFormatter={(value) => `Day ${value}`}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="oklch(0.78 0.18 155)"
              strokeWidth={2.2}
              fill="url(#grIn)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "oklch(0.16 0.012 270)" }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="oklch(0.68 0.22 22)"
              strokeWidth={2.2}
              fill="url(#grOut)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "oklch(0.16 0.012 270)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function Legend({ dotClass, label, amount }: { dotClass: string; label: string; amount: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-[11px] font-semibold tabular-nums">{amount}</span>
    </div>
  );
}
