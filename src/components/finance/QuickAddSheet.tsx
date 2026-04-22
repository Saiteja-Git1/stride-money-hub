import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Check, X, ArrowDownLeft, ArrowUpRight, Delete, Sparkles } from "lucide-react";
import { accounts, categories } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { recallCategory, rememberCategory } from "@/lib/category-memory";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: {
    type: "income" | "expense";
    amount: number;
    categoryId: string;
    accountId: string;
    note: string;
  }) => void;
}

export function QuickAddSheet({ open, onOpenChange, onSave }: Props) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("0");
  const [categoryId, setCategoryId] = useState<string>("c1");
  const [accountId, setAccountId] = useState<string>(accounts[0].id);
  const [note, setNote] = useState("");
  const [suggestion, setSuggestion] = useState<{ categoryId: string; reason: string } | null>(null);
  const [userPickedCategory, setUserPickedCategory] = useState(false);
  const debounceRef = useRef<number | null>(null);

  // Smart defaults: when type changes, pick a sensible category in that type.
  useEffect(() => {
    const fits = categories.find((c) => c.type === type);
    if (fits && categoryById(categoryId)?.type !== type) {
      setCategoryId(fits.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setAmount("0");
        setNote("");
        setType("expense");
        setCategoryId("c1");
        setSuggestion(null);
        setUserPickedCategory(false);
      }, 200);
    }
  }, [open]);

  // Auto-categorize from the note (memory → keyword/AI fallback).
  useEffect(() => {
    if (!open) return;
    const trimmed = note.trim();
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (trimmed.length < 3) {
      setSuggestion(null);
      return;
    }
    // Local memory first — instant.
    const remembered = recallCategory(trimmed);
    if (remembered) {
      const cat = categories.find((c) => c.id === remembered && c.type === type);
      if (cat) {
        setSuggestion({ categoryId: cat.id, reason: "memory" });
        if (!userPickedCategory) setCategoryId(cat.id);
        return;
      }
    }
    // Then debounce a server call.
    debounceRef.current = window.setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("lumen-categorize", {
          body: { note: trimmed, type, categories },
        });
        if (error || !data?.suggestion) return;
        const s = data.suggestion as { categoryId: string; reason: string };
        const cat = categories.find((c) => c.id === s.categoryId && c.type === type);
        if (!cat) return;
        setSuggestion({ categoryId: cat.id, reason: s.reason });
        if (!userPickedCategory) setCategoryId(cat.id);
      } catch {
        /* silently ignore — categorization is non-critical */
      }
    }, 450);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [note, type, open, userPickedCategory]);

  const visibleCats = useMemo(
    () => categories.filter((c) => c.type === type),
    [type],
  );

  const press = (k: string) => {
    setAmount((cur) => {
      if (k === "back") return cur.length <= 1 ? "0" : cur.slice(0, -1);
      if (k === ".") return cur.includes(".") ? cur : cur + ".";
      if (cur === "0") return k;
      // limit to 2 decimals
      const dot = cur.indexOf(".");
      if (dot >= 0 && cur.length - dot > 2) return cur;
      return cur + k;
    });
  };

  const numeric = parseFloat(amount) || 0;
  const canSave = numeric > 0;

  const handleSave = () => {
    if (!canSave) return;
    // Remember user's choice for this note keyword for next time.
    if (note.trim().length >= 3) rememberCategory(note.trim(), categoryId);
    onSave?.({
      type,
      amount: numeric,
      categoryId,
      accountId,
      note: note || categoryById(categoryId)?.name || "Transaction",
    });
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          {/* Sheet */}
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
            {/* Mesh */}
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{ background: "var(--gradient-mesh)" }}
            />

            <div className="relative">
              {/* Handle */}
              <div className="flex justify-center pt-2.5">
                <div className="h-1 w-10 rounded-full bg-white/15" />
              </div>

              {/* Header */}
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

              {/* Type toggle */}
              <div className="mt-3 px-5">
                <div
                  className="relative grid grid-cols-2 rounded-2xl p-1"
                  style={{ background: "color-mix(in oklab, var(--foreground) 6%, transparent)" }}
                >
                  {(["expense", "income"] as const).map((t) => {
                    const active = type === t;
                    const Icon = t === "income" ? ArrowDownLeft : ArrowUpRight;
                    return (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className="relative z-10 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-semibold capitalize transition-colors"
                        style={{
                          color: active
                            ? t === "income"
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
                                t === "income" ? "var(--primary)" : "var(--surface-elevated)",
                              boxShadow: t === "income" ? "var(--shadow-glow)" : "var(--shadow-sm)",
                            }}
                          />
                        )}
                        <Icon className="relative h-4 w-4" />
                        <span className="relative">{t}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount */}
              <div className="px-5 pt-5 text-center">
                <p
                  className={`text-[44px] font-bold leading-none tracking-tight tabular-nums ${
                    !canSave ? "text-muted-foreground" : ""
                  }`}
                  style={{
                    color: type === "income" && canSave ? "var(--primary)" : undefined,
                  }}
                >
                  {type === "expense" ? "−" : "+"}${amount}
                </p>
              </div>

              {/* Categories rail */}
              <div className="mt-4 px-5">
                <div className="no-scrollbar flex gap-2 overflow-x-auto scroll-snap-x">
                  {visibleCats.map((c) => {
                    const Icon =
                      (Icons[c.icon as keyof typeof Icons] as LucideIcon) ?? Icons.Circle;
                    const active = categoryId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setCategoryId(c.id); setUserPickedCategory(true); }}
                        className="snap-card flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-3 py-2 transition-all"
                        style={{
                          borderColor: active
                            ? `color-mix(in oklab, ${c.color} 60%, transparent)`
                            : "oklch(1 0 0 / 6%)",
                          background: active
                            ? `color-mix(in oklab, ${c.color} 14%, transparent)`
                            : "color-mix(in oklab, var(--foreground) 4%, transparent)",
                        }}
                      >
                        <div className="relative">
                          {suggestion && suggestion.categoryId === c.id && !userPickedCategory && (
                            <span
                              className="absolute -right-1 -top-1 z-10 flex h-3 w-3 items-center justify-center rounded-full"
                              style={{ background: "var(--primary)", boxShadow: "var(--shadow-glow)" }}
                              aria-label="AI suggestion"
                            >
                              <Sparkles className="h-2 w-2 text-foreground" />
                            </span>
                          )}
                          <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{
                            background: `color-mix(in oklab, ${c.color} 22%, transparent)`,
                          }}
                        >
                          <Icon className="h-4 w-4" style={{ color: c.color }} />
                        </div>
                        </div>
                        <span
                          className="text-[10.5px] font-medium"
                          style={{ color: active ? c.color : "var(--foreground)" }}
                        >
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account + note */}
              <div className="mt-3 grid grid-cols-2 gap-2 px-5">
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="glass-subtle h-10 rounded-xl px-3 text-[12.5px] font-medium outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} className="bg-card">
                      {a.name}
                    </option>
                  ))}
                </select>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="glass-subtle h-10 rounded-xl px-3 text-[12.5px] outline-none placeholder:text-muted-foreground"
                />
              </div>

              {/* Keypad */}
              <div className="mt-3 grid grid-cols-3 gap-1.5 px-5">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map((k) => (
                  <motion.button
                    key={k}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => press(k)}
                    className="flex h-12 items-center justify-center rounded-xl text-[18px] font-semibold"
                    style={{
                      background: "color-mix(in oklab, var(--foreground) 5%, transparent)",
                    }}
                  >
                    {k === "back" ? <Delete className="h-5 w-5" /> : k}
                  </motion.button>
                ))}
              </div>

              {/* Save */}
              <div className="mt-3 px-5 pb-5">
                <motion.button
                  whileTap={{ scale: canSave ? 0.97 : 1 }}
                  disabled={!canSave}
                  onClick={handleSave}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-semibold transition-opacity disabled:opacity-40"
                  style={{
                    background: "var(--gradient-primary)",
                    color: "var(--primary-foreground)",
                    boxShadow: canSave ? "var(--shadow-glow)" : "none",
                  }}
                >
                  <Check className="h-4 w-4" />
                  Save transaction
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function categoryById(id: string) {
  return categories.find((c) => c.id === id);
}