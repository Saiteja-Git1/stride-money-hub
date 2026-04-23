import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Check, X, ArrowDownLeft, ArrowUpRight, Delete, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { recallCategory, rememberCategory } from "@/lib/category-memory";
import type { FinanceAccount, FinanceCategory, FinanceCurrency } from "@/lib/finance";

interface Props {
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: {
    type: "income" | "expense";
    amount: number;
    categoryId: string;
    accountId: string;
    currency: FinanceCurrency;
    note: string;
  }) => Promise<void> | void;
}

function firstCategoryId(categories: FinanceCategory[], type: "income" | "expense") {
  return categories.find((category) => category.type === type)?.id ?? "";
}

export function QuickAddSheet({
  accounts,
  categories,
  open,
  onOpenChange,
  onSave,
}: Props) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("0");
  const [categoryId, setCategoryId] = useState<string>(firstCategoryId(categories, "expense"));
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [suggestion, setSuggestion] = useState<{ categoryId: string; reason: string } | null>(null);
  const [userPickedCategory, setUserPickedCategory] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  const selectedAccount = accounts.find((account) => account.id === accountId) ?? accounts[0] ?? null;

  useEffect(() => {
    if (!accountId && accounts[0]) {
      setAccountId(accounts[0].id);
    }
  }, [accountId, accounts]);

  useEffect(() => {
    const nextCategoryId = firstCategoryId(categories, type);
    const currentCategoryFits = categories.some(
      (category) => category.id === categoryId && category.type === type,
    );
    if (!currentCategoryFits) {
      setCategoryId(nextCategoryId);
    }
  }, [categories, categoryId, type]);

  useEffect(() => {
    if (!open) {
      window.setTimeout(() => {
        setAmount("0");
        setNote("");
        setType("expense");
        setCategoryId(firstCategoryId(categories, "expense"));
        setAccountId(accounts[0]?.id ?? "");
        setSuggestion(null);
        setUserPickedCategory(false);
        setSaving(false);
      }, 200);
    }
  }, [accounts, categories, open]);

  useEffect(() => {
    if (!open) return;

    const trimmed = note.trim();
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (trimmed.length < 3 || visibleCategories.length === 0) {
      setSuggestion(null);
      return;
    }

    const remembered = recallCategory(trimmed);
    if (remembered) {
      const category = visibleCategories.find((entry) => entry.id === remembered);
      if (category) {
        setSuggestion({ categoryId: category.id, reason: "memory" });
        if (!userPickedCategory) setCategoryId(category.id);
        return;
      }
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("lumen-categorize", {
          body: { note: trimmed, type, categories: visibleCategories },
        });

        if (error || !data?.suggestion) return;

        const nextSuggestion = data.suggestion as { categoryId: string; reason: string };
        const category = visibleCategories.find((entry) => entry.id === nextSuggestion.categoryId);
        if (!category) return;

        setSuggestion({ categoryId: category.id, reason: nextSuggestion.reason });
        if (!userPickedCategory) setCategoryId(category.id);
      } catch {
        setSuggestion(null);
      }
    }, 450);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [note, open, type, userPickedCategory, visibleCategories]);

  const numericAmount = parseFloat(amount) || 0;
  const canSave =
    numericAmount > 0 && Boolean(selectedAccount) && Boolean(categoryId) && !saving;

  const press = (key: string) => {
    setAmount((current) => {
      if (key === "back") return current.length <= 1 ? "0" : current.slice(0, -1);
      if (key === ".") return current.includes(".") ? current : `${current}.`;
      if (current === "0") return key;

      const decimalIndex = current.indexOf(".");
      if (decimalIndex >= 0 && current.length - decimalIndex > 2) return current;

      return current + key;
    });
  };

  async function handleSave() {
    if (!canSave || !selectedAccount) return;

    setSaving(true);
    try {
      if (note.trim().length >= 3) {
        rememberCategory(note.trim(), categoryId);
      }

      await onSave?.({
        type,
        amount: numericAmount,
        categoryId,
        accountId: selectedAccount.id,
        currency: selectedAccount.currency,
        note:
          note.trim() ||
          visibleCategories.find((category) => category.id === categoryId)?.name ||
          "Transaction",
      });

      onOpenChange(false);
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
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Quick add
                  </p>
                  <h3 className="mt-0.5 text-[17px] font-semibold tracking-tight">
                    New transaction
                  </h3>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  aria-label="Close"
                  className="glass-subtle flex h-9 w-9 items-center justify-center rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 px-5">
                <div
                  className="relative grid grid-cols-2 rounded-2xl p-1"
                  style={{ background: "color-mix(in oklab, var(--foreground) 6%, transparent)" }}
                >
                  {(["expense", "income"] as const).map((entry) => {
                    const active = type === entry;
                    const Icon = entry === "income" ? ArrowDownLeft : ArrowUpRight;

                    return (
                      <button
                        key={entry}
                        onClick={() => setType(entry)}
                        className="relative z-10 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-semibold capitalize transition-colors"
                        style={{
                          color: active
                            ? entry === "income"
                              ? "var(--primary-foreground)"
                              : "var(--foreground)"
                            : "var(--muted-foreground)",
                        }}
                      >
                        {active && (
                          <motion.span
                            layoutId="qa-toggle"
                            transition={{ type: "spring", stiffness: 400, damping: 32 }}
                            className="absolute inset-0 rounded-xl"
                            style={{
                              background:
                                entry === "income" ? "var(--primary)" : "var(--surface-elevated)",
                              boxShadow:
                                entry === "income" ? "var(--shadow-glow)" : "var(--shadow-sm)",
                            }}
                          />
                        )}
                        <Icon className="relative h-4 w-4" />
                        <span className="relative">{entry}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-5 pt-5 text-center">
                <p
                  className={`text-[44px] font-bold leading-none tracking-tight tabular-nums ${
                    !canSave ? "text-muted-foreground" : ""
                  }`}
                  style={{
                    color: type === "income" && canSave ? "var(--primary)" : undefined,
                  }}
                >
                  {type === "expense" ? "-" : "+"}
                  {selectedAccount?.currency === "INR" ? "₹" : "$"}
                  {amount}
                </p>
              </div>

              <div className="mt-4 px-5">
                <div className="no-scrollbar flex gap-2 overflow-x-auto scroll-snap-x">
                  {visibleCategories.map((category) => {
                    const Icon =
                      (Icons[category.icon as keyof typeof Icons] as LucideIcon) ?? Icons.Circle;
                    const active = categoryId === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setCategoryId(category.id);
                          setUserPickedCategory(true);
                        }}
                        className="snap-card flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-3 py-2 transition-all"
                        style={{
                          borderColor: active
                            ? `color-mix(in oklab, ${category.color} 60%, transparent)`
                            : "oklch(1 0 0 / 6%)",
                          background: active
                            ? `color-mix(in oklab, ${category.color} 14%, transparent)`
                            : "color-mix(in oklab, var(--foreground) 4%, transparent)",
                        }}
                      >
                        <div className="relative">
                          {suggestion &&
                            suggestion.categoryId === category.id &&
                            !userPickedCategory && (
                              <span
                                className="absolute -right-1 -top-1 z-10 flex h-3 w-3 items-center justify-center rounded-full"
                                style={{
                                  background: "var(--primary)",
                                  boxShadow: "var(--shadow-glow)",
                                }}
                                aria-label="AI suggestion"
                              >
                                <Sparkles className="h-2 w-2 text-foreground" />
                              </span>
                            )}
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg"
                            style={{
                              background: `color-mix(in oklab, ${category.color} 22%, transparent)`,
                            }}
                          >
                            <Icon className="h-4 w-4" style={{ color: category.color }} />
                          </div>
                        </div>
                        <span
                          className="text-[10.5px] font-medium"
                          style={{ color: active ? category.color : "var(--foreground)" }}
                        >
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 px-5">
                <select
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                  className="glass-subtle h-10 rounded-xl px-3 text-[12.5px] font-medium outline-none"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id} className="bg-card">
                      {account.name}
                    </option>
                  ))}
                </select>
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Note (optional)"
                  className="glass-subtle h-10 rounded-xl px-3 text-[12.5px] outline-none placeholder:text-muted-foreground"
                />
              </div>

              {!accounts.length && (
                <p className="mt-3 px-5 text-center text-[11.5px] text-muted-foreground">
                  Add an account first so transactions have somewhere to live.
                </p>
              )}

              <div className="mt-3 grid grid-cols-3 gap-1.5 px-5">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map((key) => (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => press(key)}
                    className="flex h-12 items-center justify-center rounded-xl text-[18px] font-semibold"
                    style={{
                      background: "color-mix(in oklab, var(--foreground) 5%, transparent)",
                    }}
                  >
                    {key === "back" ? <Delete className="h-5 w-5" /> : key}
                  </motion.button>
                ))}
              </div>

              <div className="mt-3 px-5 pb-5">
                <motion.button
                  whileTap={{ scale: canSave ? 0.97 : 1 }}
                  disabled={!canSave}
                  onClick={() => {
                    void handleSave();
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-semibold transition-opacity disabled:opacity-40"
                  style={{
                    background: "var(--gradient-primary)",
                    color: "var(--primary-foreground)",
                    boxShadow: canSave ? "var(--shadow-glow)" : "none",
                  }}
                >
                  <Check className="h-4 w-4" />
                  {saving ? "Saving..." : "Save transaction"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
