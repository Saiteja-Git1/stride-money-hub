import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, Check } from "lucide-react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FinanceCategory } from "@/lib/finance";

export type TxType = "all" | "income" | "expense";
export type TxRange = "7d" | "30d" | "90d" | "all";

export interface FiltersState {
  q: string;
  type: TxType;
  range: TxRange;
  cats: string[];
}

interface Props {
  categories: FinanceCategory[];
  value: FiltersState;
  onChange: (next: Partial<FiltersState>) => void;
  onReset: () => void;
  resultCount: number;
}

const typePills: { value: TxType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

const ranges: { value: TxRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

export function TransactionFilters({
  categories,
  value,
  onChange,
  onReset,
  resultCount,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const activeCount =
    (value.type !== "all" ? 1 : 0) +
    (value.range !== "30d" ? 1 : 0) +
    value.cats.length +
    (value.q ? 1 : 0);

  const toggleCategory = (id: string) => {
    const next = value.cats.includes(id)
      ? value.cats.filter((categoryId) => categoryId !== id)
      : [...value.cats, id];
    onChange({ cats: next });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="glass-subtle relative flex h-11 flex-1 items-center rounded-2xl px-3.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={value.q}
            onChange={(event) => onChange({ q: event.target.value })}
            placeholder="Search transactions"
            className="ml-2.5 h-full w-full bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground"
          />
          {value.q && (
            <button
              onClick={() => onChange({ q: "" })}
              aria-label="Clear search"
              className="rounded-full p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => setShowAdvanced((current) => !current)}
          className="glass-subtle relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          aria-label="Toggle filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeCount > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9.5px] font-bold"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              {activeCount}
            </span>
          )}
        </motion.button>
      </div>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {typePills.map((pill) => {
          const active = value.type === pill.value;
          return (
            <button
              key={pill.value}
              onClick={() => onChange({ type: pill.value })}
              className="relative h-8 shrink-0 rounded-full px-3.5 text-[12px] font-semibold transition-colors"
              style={{
                color: active ? "var(--primary-foreground)" : "var(--muted-foreground)",
              }}
            >
              {active && (
                <motion.div
                  layoutId="type-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "var(--primary)",
                    boxShadow: "var(--shadow-glow)",
                  }}
                />
              )}
              <span className="relative">{pill.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              className="space-y-4 rounded-2xl border border-white/5 p-4"
              style={{ background: "var(--gradient-card)" }}
            >
              <div>
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Date range
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {ranges.map((range) => {
                    const active = value.range === range.value;
                    return (
                      <button
                        key={range.value}
                        onClick={() => onChange({ range: range.value })}
                        className="rounded-lg py-2 text-[11.5px] font-semibold transition-all"
                        style={{
                          background: active
                            ? "var(--primary)"
                            : "color-mix(in oklab, var(--foreground) 5%, transparent)",
                          color: active ? "var(--primary-foreground)" : "var(--foreground)",
                          boxShadow: active ? "var(--shadow-glow)" : "none",
                        }}
                      >
                        {range.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Categories {value.cats.length > 0 && `• ${value.cats.length} selected`}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((category) => {
                    const active = value.cats.includes(category.id);
                    const Icon =
                      (Icons[category.icon as keyof typeof Icons] as LucideIcon) ?? Icons.Circle;

                    return (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className="flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11.5px] font-medium transition-all"
                        style={{
                          borderColor: active
                            ? `color-mix(in oklab, ${category.color} 60%, transparent)`
                            : "oklch(1 0 0 / 8%)",
                          background: active
                            ? `color-mix(in oklab, ${category.color} 18%, transparent)`
                            : "transparent",
                          color: active ? category.color : "var(--foreground)",
                        }}
                      >
                        <Icon className="h-3 w-3" style={{ color: category.color }} />
                        {category.name}
                        {active && <Check className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11.5px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{resultCount}</span> result
                  {resultCount === 1 ? "" : "s"}
                </p>
                <button
                  onClick={onReset}
                  className="text-[11.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Reset all
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
