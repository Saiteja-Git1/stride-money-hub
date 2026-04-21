import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Globe,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sparkles,
  User,
} from "lucide-react";

interface RowProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  hint?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  tone?: "default" | "danger";
}

function Row({ icon: Icon, label, hint, trailing, onClick, tone = "default" }: RowProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: tone === "danger"
            ? "color-mix(in oklab, var(--destructive) 16%, var(--card))"
            : "color-mix(in oklab, var(--primary) 12%, var(--card))",
        }}
      >
        <Icon
          className="h-4 w-4"
          style={{ color: tone === "danger" ? "var(--destructive)" : "var(--primary)" }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[13.5px] font-medium ${tone === "danger" ? "text-destructive" : ""}`}>
          {label}
        </p>
        {hint && <p className="truncate text-[11.5px] text-muted-foreground">{hint}</p>}
      </div>
      {trailing ?? <ChevronRight className="h-4 w-4 text-muted-foreground/60" />}
    </motion.button>
  );
}

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [notif, setNotif] = useState(true);
  const [dark, setDark] = useState(true);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <motion.button
          whileTap={{ scale: 0.92 }}
          aria-label="Open profile menu"
          className="relative flex h-10 w-10 items-center justify-center rounded-full"
          style={{
            background: "var(--gradient-primary)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <span className="text-[13px] font-semibold text-primary-foreground">AM</span>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-background" />
        </motion.button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[88%] border-l-0 p-0 sm:max-w-sm"
        style={{ background: "var(--background)" }}
      >
        {/* Mesh background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{ background: "var(--gradient-mesh)" }}
        />

        <div className="relative flex h-full flex-col overflow-y-auto">
          {/* Profile header */}
          <div className="px-5 pb-5 pt-7">
            <div className="flex items-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "var(--shadow-glow)",
                }}
              >
                <span className="text-[17px] font-bold text-primary-foreground">AM</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold tracking-tight">Alex Morgan</p>
                <p className="truncate text-[12px] text-muted-foreground">alex.morgan@lumen.app</p>
              </div>
            </div>

            {/* Plan card */}
            <div
              className="mt-4 flex items-center gap-3 rounded-2xl border border-white/5 p-3"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in oklab, var(--accent) 18%, var(--card)), var(--card))",
              }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  background: "var(--gradient-violet)",
                  boxShadow: "var(--shadow-glow-violet)",
                }}
              >
                <Sparkles className="h-4 w-4 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold">Lumen AI</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  Ask anything about your money
                </p>
              </div>
              <button
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                Try
              </button>
            </div>
          </div>

          <Separator className="bg-white/5" />

          {/* Sections */}
          <div className="flex-1 px-3 py-3">
            <p className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Account
            </p>
            <Row icon={User} label="Personal info" hint="Name, email, photo" />
            <Row icon={CreditCard} label="Linked accounts" hint="4 connected" />
            <Row icon={Globe} label="Currency" hint="USD — US Dollar" />

            <p className="mt-4 px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Preferences
            </p>
            <Row
              icon={Moon}
              label="Dark mode"
              hint="Easier on the eyes"
              trailing={<Switch checked={dark} onCheckedChange={setDark} />}
            />
            <Row
              icon={Bell}
              label="Notifications"
              hint="Bills, budgets, insights"
              trailing={<Switch checked={notif} onCheckedChange={setNotif} />}
            />
            <Row icon={Shield} label="Privacy & security" hint="Face ID, passcode" />

            <p className="mt-4 px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Support
            </p>
            <Row icon={CircleHelp} label="Help center" />
            <Row icon={Settings} label="App settings" />
          </div>

          <div className="px-3 pb-7 pt-2">
            <Row icon={LogOut} label="Sign out" tone="danger" trailing={<span />} />
            <p className="mt-3 text-center text-[10.5px] text-muted-foreground">Lumen v1.0.0</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}