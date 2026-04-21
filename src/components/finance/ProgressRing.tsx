import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  duration?: number;
  children?: React.ReactNode;
  glow?: boolean;
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  color = "var(--primary)",
  trackColor = "color-mix(in oklab, var(--foreground) 8%, transparent)",
  duration = 1.1,
  children,
  glow = true,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const mv = useMotionValue(0);
  const dashoffset = useTransform(mv, (v) => circumference - (v / 100) * circumference);

  useEffect(() => {
    const controls = animate(mv, Math.max(0, Math.min(100, value)), {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [value, duration, mv]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        style={glow ? { filter: `drop-shadow(0 0 12px ${color})` } : undefined}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashoffset }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  );
}