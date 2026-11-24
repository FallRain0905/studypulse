import { animate, motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import React, { useEffect, useState } from 'react';

export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-75" />
      {/* Light mode: airy porcelain mist; Dark mode: restrained warm studio spotlight */}
      <div className="aurora-blob-1 absolute -top-40 left-1/4 h-[460px] w-[560px] rounded-full bg-emerald-400/10 dark:bg-amber-200/[0.035] blur-[130px]" />
      <div className="aurora-blob-2 absolute top-1/3 -right-32 h-[420px] w-[420px] rounded-full bg-sky-400/10 dark:bg-zinc-200/[0.03] blur-[130px]" />
      <div className="aurora-blob-1 absolute -bottom-40 left-10 h-[360px] w-[420px] rounded-full bg-amber-300/10 dark:bg-amber-500/[0.025] blur-[130px]" />
    </div>
  );
}

export function SpotlightCard({
  children,
  className = '',
  glowColor = 'rgba(255, 255, 255, 0.055)',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}) {
  const mouseX = useMotionValue(-300);
  const mouseY = useMotionValue(-300);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  function handleMouseLeave() {
    mouseX.set(-300);
    mouseY.set(-300);
  }

  const background = useMotionTemplate`radial-gradient(260px circle at ${mouseX}px ${mouseY}px, ${glowColor}, transparent 75%)`;

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{ y: -2, transition: { type: 'spring', stiffness: 420, damping: 30 } }}
      className={`group relative overflow-hidden rounded-2xl glass-panel transition-colors duration-200 hover:border-zinc-400/40 dark:hover:border-white/[0.18] ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}

export function AnimatedNumber({
  value,
  suffix = '',
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const controls = animate(display, value, {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span>
      {decimals > 0 ? display.toFixed(decimals) : Math.round(display)}
      {suffix}
    </span>
  );
}

export function ProgressRing({
  percent,
  size = 64,
  strokeWidth = 6,
  color = '#d99b26',
  trackColor = 'rgba(161,161,170,0.18)',
  label,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ - (clamped / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-bold tracking-tight">{label ?? `${Math.round(clamped)}%`}</span>
      </div>
    </div>
  );
}

// Restrained, editorial studio color tokens (desaturated, no neon clash)
export const ACCENT_STYLES: Record<
  string,
  { badge: string; ring: string; glow: string; bar: string; text: string }
> = {
  emerald: {
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    ring: '#34a875',
    glow: 'rgba(255, 255, 255, 0.05)',
    bar: 'from-emerald-500 to-emerald-400',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  cyan: {
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
    ring: '#569cd6',
    glow: 'rgba(255, 255, 255, 0.05)',
    bar: 'from-sky-500 to-sky-400',
    text: 'text-sky-700 dark:text-sky-300',
  },
  amber: {
    badge: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25',
    ring: '#d99b26',
    glow: 'rgba(245, 185, 66, 0.06)',
    bar: 'from-amber-500 to-amber-400',
    text: 'text-amber-700 dark:text-amber-300',
  },
  rose: {
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
    ring: '#e06c75',
    glow: 'rgba(255, 255, 255, 0.05)',
    bar: 'from-rose-500 to-rose-400',
    text: 'text-rose-700 dark:text-rose-300',
  },
  violet: {
    badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
    ring: '#9d86e8',
    glow: 'rgba(255, 255, 255, 0.05)',
    bar: 'from-violet-500 to-violet-400',
    text: 'text-violet-700 dark:text-violet-300',
  },
  indigo: {
    badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    ring: '#818cf8',
    glow: 'rgba(255, 255, 255, 0.05)',
    bar: 'from-indigo-500 to-indigo-400',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
  teal: {
    badge: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
    ring: '#45b2a8',
    glow: 'rgba(255, 255, 255, 0.05)',
    bar: 'from-teal-500 to-teal-400',
    text: 'text-teal-700 dark:text-teal-300',
  },
  sky: {
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
    ring: '#60a5fa',
    glow: 'rgba(255, 255, 255, 0.05)',
    bar: 'from-sky-500 to-sky-400',
    text: 'text-sky-700 dark:text-sky-300',
  },
};
