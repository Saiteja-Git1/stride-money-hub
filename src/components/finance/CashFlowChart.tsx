import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { motion } from "framer-motion";
import { monthlyFlow } from "@/lib/mock-data";

export function CashFlowChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl bg-card p-4"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cash flow</p>
          <p className="text-sm font-semibold">April 2026</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />In</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" />Out</span>
        </div>
      </div>
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyFlow} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="grIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.18 155)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="oklch(0.78 0.18 155)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.68 0.22 22)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="oklch(0.68 0.22 22)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "oklch(0.66 0.018 270)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "oklch(0.22 0.015 270)",
                border: "1px solid oklch(0.3 0.014 270 / 60%)",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "oklch(0.66 0.018 270)" }}
            />
            <Area type="monotone" dataKey="income" stroke="oklch(0.78 0.18 155)" strokeWidth={2} fill="url(#grIn)" />
            <Area type="monotone" dataKey="expense" stroke="oklch(0.68 0.22 22)" strokeWidth={2} fill="url(#grOut)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}