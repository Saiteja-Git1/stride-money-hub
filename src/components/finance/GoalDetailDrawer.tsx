import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Calendar, Target, TrendingUp, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProgressRing } from "./ProgressRing";
import { formatMoney } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";

export interface Goal {
  id: string;
  name: string;
  icon: LucideIcon;
  target: number;
  current: number;
  deadline: string;
  deadlineISO: string; // YYYY-MM-DD UTC
  color: string;
}

interface Props {
  goal: Goal | null;
  onClose: () => void;
  onContribute?: (goalId: string, amount: number) => void;
}

export function GoalDetailDrawer({ goal, onClose, onContribute }: Props) {
  return (
    <AnimatePresence>
      {goal && <Inner goal={goal} onClose={onClose} onContribute={onContribute} />}
    </AnimatePresence>
  );
}

function Inner({
  goal,
  onClose,
  onContribute,
}: {
  goal: Goal;
  onClose: () => void;
  onContribute?: (goalId: string, amount: number) => void;
}) {
  const Icon = goal.icon;
  const pct = Math.min(100, (goal.current / goal.target) * 100);
  const remaining = Math.max(0, goal.target - goal.current);

  // Days left, UTC-stable
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const due = new Date(goal.deadlineISO + "T00:00:00Z").getTime();
  const daysLeft = Math.max(0, Math.round((due - today) / 86400000));
  const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
  const monthlyNeeded = remaining / monthsLeft;

  const [contrib, setContrib] = useState("");
  const contribNum = parseFloat(contrib) || 0;

  const [aiHint, setAiHint] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setAiLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("lumen-ai", {
          body: {
            mode: "goal",
            context: {
              name: goal.name,
              target: goal.target,
              current: goal.current,
              remaining,
              monthsLeft,
              monthlyNeeded: Math.round(monthlyNeeded),
              deadline: goal.deadline,
              currency: "USD",
            },
          },
        });
        if (!cancelled) {
          if (error || data?.error) {
            setAiHint("");
          } else {
            setAiHint(data?.text || "");
          }
        }
      } catch {
        if (!cancelled) setAiHint("");
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [goal.id, goal.current, goal.target, monthlyNeeded, monthsLeft, remaining, goal.name, goal.deadline]);

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
                style={{ background: `color-mix(in oklab, ${goal.color} 22%, transparent)` }}
              >
                <Icon className="h-5 w-5" style={{ color: goal.color }} />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Goal
                </p>
                <h3 className="text-[17px] font-semibold tracking-tight">{goal.name}</h3>
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
            <ProgressRing value={pct} size={156} stroke={12} color={goal.color}>
              <div className="text-center">
                <p className="text-[26px] font-bold leading-none tabular-nums">
                  {Math.round(pct)}%
                </p>
                <p className="mt-1 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
                  saved
                </p>
              </div>
            </ProgressRing>
            <p className="mt-3 text-[12.5px] text-muted-foreground tabular-nums">
              <span className="font-semibold text-foreground">{formatMoney(goal.current)}</span> of{" "}
              {formatMoney(goal.target)}
            </p>
          </div>

          {/* Countdown stats */}
          <div className="mt-5 grid grid-cols-3 gap-2 px-5">
            <Stat icon={Target} label="Left" value={formatMoney(remaining)} color={goal.color} />
            <Stat icon={Calendar} label="Days" value={`${daysLeft}d`} />
            <Stat
              icon={TrendingUp}
              label="Per month"
              value={formatMoney(monthlyNeeded)}
              color={goal.color}
            />
          </div>

          {/* AI hint */}
          <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-2xl border border-white/5 p-3"
            style={{
              background: "linear-gradient(135deg, color-mix(in oklab, var(--accent) 14%, var(--card)), var(--card))",
            }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "var(--gradient-violet)", boxShadow: "var(--shadow-glow-violet)" }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={aiHint || (aiLoading ? "loading" : "fallback")}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[11.5px] leading-relaxed text-muted-foreground"
              >
                {aiHint
                  ? aiHint
                  : aiLoading
                    ? "Lumen AI is thinking…"
                    : (
                      <>
                        Save{" "}
                        <span className="font-semibold text-foreground">
                          {formatMoney(monthlyNeeded)}
                        </span>{" "}
                        every month for the next{" "}
                        <span className="font-semibold text-foreground">{monthsLeft}</span> month
                        {monthsLeft === 1 ? "" : "s"} to hit{" "}
                        <span className="font-semibold text-foreground">{goal.deadline}</span>.
                      </>
                    )}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Contribute */}
          <div className="px-5 pb-5 pt-4">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Contribute now
            </p>
            <div className="flex gap-2">
              <div className="glass-subtle flex h-12 flex-1 items-center rounded-2xl px-3.5">
                <span className="text-[14px] font-semibold text-muted-foreground">$</span>
                <input
                  inputMode="decimal"
                  value={contrib}
                  onChange={(e) => setContrib(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="0.00"
                  className="ml-1 h-full w-full bg-transparent text-[15px] font-semibold tabular-nums outline-none placeholder:text-muted-foreground"
                />
              </div>
              <motion.button
                whileTap={{ scale: contribNum > 0 ? 0.96 : 1 }}
                disabled={contribNum <= 0}
                onClick={() => {
                  onContribute?.(goal.id, contribNum);
                  setContrib("");
                }}
                className="flex h-12 items-center gap-1.5 rounded-2xl px-4 text-[13px] font-semibold disabled:opacity-40"
                style={{
                  background: "var(--gradient-primary)",
                  color: "var(--primary-foreground)",
                  boxShadow: contribNum > 0 ? "var(--shadow-glow)" : "none",
                }}
              >
                <Plus className="h-4 w-4" />
                Add
              </motion.button>
            </div>
            <div className="mt-2 flex gap-1.5">
              {[25, 50, 100, 250].map((v) => (
                <button
                  key={v}
                  onClick={() => setContrib(String(v))}
                  className="glass-subtle flex-1 rounded-lg py-1.5 text-[11px] font-semibold"
                >
                  ${v}
                </button>
              ))}
            </div>
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
  color = "var(--foreground)",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color?: string;
}) {
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