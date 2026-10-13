import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { api } from "@/services";
import {
  LayoutDashboard,
  Layers,
  Bot,
  CheckSquare,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Server,
  Zap,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Catalog", icon: Layers },
  { to: "/agents", label: "Agent Control", icon: Bot },
  { to: "/review", label: "Review Proposals", icon: CheckSquare },
  { to: "/sync", label: "Sync Hub", icon: RefreshCw },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const isBackend = api.mode === "backend";

  return (
    <div className="flex min-h-screen flex-col bg-[#090b10] text-slate-100 md:flex-row">
      {/* Sidebar */}
      <aside className="flex flex-col border-b border-white/[0.08] bg-[#0c0f17]/90 backdrop-blur-xl md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.06]">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
            <Zap className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-white">PIM·AGENTS</span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Enterprise AI Catalog</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-x-auto p-3 md:space-y-1 md:overflow-visible">
          <div className="px-3 pb-2 pt-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Navigation
          </div>
          {navItems.map((n) => {
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-all duration-150 hover:bg-white/[0.04] hover:text-white"
                activeProps={{
                  className: "bg-white/[0.07] !text-emerald-400 font-semibold shadow-inner border border-white/[0.05]",
                }}
              >
                <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* System Diagnostics Card */}
        <div className="m-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
              <Server className="h-3.5 w-3.5 text-emerald-400" />
              API Service
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isBackend ? "Online (FastAPI)" : "In-Memory"}
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
              WooCommerce
            </span>
            <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-300 border border-sky-500/20">
              Mock Adapter
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0c0f17]/40 px-6 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Workspace:</span>
            <span className="font-mono text-slate-200">kilowott-catalog-v1</span>
            <span className="text-slate-600">/</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> LangGraph 4-Agent Pipeline
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/agents" className="btn btn-primary text-xs py-1.5 px-3">
              <Sparkles className="h-3.5 w-3.5" />
              Launch Agent Run
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="mx-auto w-full max-w-7xl flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
