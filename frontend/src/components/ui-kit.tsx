import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Activity,
  AlertTriangle,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react";

type Tone = "success" | "warning" | "destructive" | "info" | "muted" | "primary" | "purple";

const toneStyles: Record<Tone, { badge: string; dot: string }> = {
  success: {
    badge: "text-emerald-400 bg-emerald-950/40 border-emerald-500/30",
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
  },
  warning: {
    badge: "text-amber-400 bg-amber-950/40 border-amber-500/30",
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
  },
  destructive: {
    badge: "text-rose-400 bg-rose-950/40 border-rose-500/30",
    dot: "bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]",
  },
  info: {
    badge: "text-sky-400 bg-sky-950/40 border-sky-500/30",
    dot: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)] animate-pulse",
  },
  purple: {
    badge: "text-purple-400 bg-purple-950/40 border-purple-500/30",
    dot: "bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]",
  },
  primary: {
    badge: "text-emerald-300 bg-emerald-950/50 border-emerald-500/30",
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
  },
  muted: {
    badge: "text-slate-400 bg-slate-900/60 border-slate-700/50",
    dot: "bg-slate-400",
  },
};

const statusToneMap: Record<string, Tone> = {
  synced: "success",
  success: "success",
  completed: "success",
  complete: "success",
  approved: "success",
  pending: "warning",
  short: "warning",
  medium: "warning",
  running: "info",
  queued: "muted",
  failed: "destructive",
  missing: "destructive",
  rejected: "destructive",
  high: "destructive",
  never: "muted",
  low: "muted",
};

export function Badge({
  children,
  tone = "muted",
  showDot = false,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  showDot?: boolean;
  className?: string;
}) {
  const current = toneStyles[tone] || toneStyles.muted;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase transition-all duration-150",
        current.badge,
        className
      )}
    >
      {showDot && <span className={cn("h-1.5 w-1.5 rounded-full", current.dot)} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = statusToneMap[status] ?? "muted";
  return (
    <Badge tone={tone} showDot {...(className ? { className } : {})}>
      {status}
    </Badge>
  );
}

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/[0.06] pb-6 md:flex-row md:items-end">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "primary",
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
  icon?: any;
}) {
  const current = toneStyles[tone] || toneStyles.muted;
  return (
    <div className="panel group relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20">
      <div className="flex items-center justify-between text-xs font-medium tracking-wider uppercase text-slate-400">
        <span>{label}</span>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-slate-300 transition-colors group-hover:bg-white/[0.08] group-hover:text-white">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="mt-3 font-mono text-3xl font-bold tracking-tight text-white">{value}</div>
      {hint && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <span className={cn("h-1.5 w-1.5 rounded-full", current.dot)} />
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

export function Progress({ value }: { value: number }) {
  const isComplete = value === 100;
  const isMed = value >= 60;
  const barGradient = isComplete
    ? "from-emerald-500 to-teal-400"
    : isMed
    ? "from-amber-500 to-yellow-400"
    : "from-rose-500 to-red-400";

  return (
    <div className="flex items-center gap-2.5">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-800/80 p-0.5">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-300", barGradient)}
          style={{ width: `${Math.max(4, value)}%` }}
        />
      </div>
      <span className="font-mono text-xs font-semibold text-slate-300">{value}%</span>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon: Icon = Sparkles,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: any;
}) {
  return (
    <div className="panel flex flex-col items-center justify-center p-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-emerald-400 shadow-inner">
        <Icon className="h-7 w-7" />
      </div>
      <div className="text-base font-semibold text-white">{title}</div>
      {body && <p className="mt-1.5 max-w-md text-sm text-slate-400">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Loading({ label = "Loading data…" }: { label?: string }) {
  return (
    <div className="panel flex items-center justify-center gap-3 p-10 text-sm font-medium text-slate-300">
      <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
  return (
    <div className="panel flex items-center gap-3 border-rose-500/30 bg-rose-950/20 p-4 text-sm text-rose-300">
      <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
      <span className="flex-1">{msg}</span>
    </div>
  );
}
