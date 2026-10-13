import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, qk } from "@/services";
import { Badge, EmptyState, ErrorState, Loading, PageHeader, StatusBadge } from "@/components/ui-kit";
import { formatTime } from "@/lib/product-metrics";
import { cn } from "@/lib/utils";
import type { AgentRun } from "@/types/pim";
import {
  Bot,
  Sparkles,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Workflow,
  Cpu,
  Layers,
  ShieldCheck,
  Send,
} from "lucide-react";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "AI Agent Control Center — Enterprise PIM" },
      { name: "description", content: "Submit tasks to the LangGraph multi-agent orchestrator and monitor live agent telemetry." },
    ],
  }),
  component: Agents,
});

const presets = [
  { label: "Full Catalog Quality Pass", desc: "Audit incomplete products, generate grounded copy, and validate against schemas" },
  { label: "Improve all missing descriptions", desc: "Focus copy generation on products with missing or short descriptions" },
  { label: "Fill missing attributes", desc: "Extract grounded technical attributes without fabricating specifications" },
];

export function Agents() {
  const qc = useQueryClient();
  const [task, setTask] = useState(presets[0]!.label);

  const runs = useQuery({
    queryKey: qk.runs,
    queryFn: api.getRuns,
    refetchInterval: (q) =>
      q.state.data?.some((r) => r.status === "running" || r.status === "queued") ? 800 : false,
  });

  const submit = useMutation({
    mutationFn: api.submitTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.runs });
    },
  });

  const active = runs.data?.some((r) => r.status === "running");

  useEffect(() => {
    if (!active) {
      qc.invalidateQueries({ queryKey: qk.proposals });
      qc.invalidateQueries({ queryKey: qk.stats });
    }
  }, [active, qc]);

  return (
    <>
      {/* ── Breadcrumb / Back Navigation ─────────────────────────────── */}
      <nav aria-label="breadcrumb" className="mb-6 flex items-center gap-1.5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-400 transition-all duration-150 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
          <Bot className="h-3.5 w-3.5 text-purple-400" />
          Agent Control
        </span>
      </nav>

      <PageHeader
        title="AI Agent Control Center"
        subtitle="Orchestrates Catalog Analyst, Enrichment Agent, and Quality Agent using LangGraph."
        badge={
          <Badge tone="purple" showDot>
            LangGraph Orchestrator
          </Badge>
        }
      />

      {/* Interactive Agent Pipeline Overview */}
      <div className="panel mb-8 p-6">
        <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Autonomous Agent Topology</h2>
          </div>
          <span className="text-xs text-slate-400">Deterministic + LLM Hybrid Pipeline</span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Cpu className="h-4 w-4" />
            </div>
            <div className="text-xs font-semibold text-white">1. Orchestrator</div>
            <p className="mt-1 text-[11px] text-slate-400">State graph planning, routing, & lifecycle management</p>
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
              <Layers className="h-4 w-4" />
            </div>
            <div className="text-xs font-semibold text-white">2. Catalog Analyst</div>
            <p className="mt-1 text-[11px] text-slate-400">Deterministic catalog inspection & inconsistency audits</p>
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="text-xs font-semibold text-white">3. Enrichment Agent</div>
            <p className="mt-1 text-[11px] text-slate-400">Grounded description drafting & attribute inference</p>
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="text-xs font-semibold text-white">4. Quality Agent</div>
            <p className="mt-1 text-[11px] text-slate-400">Schema & rule validation with bounded retries</p>
          </div>
        </div>
      </div>

      {/* Task Submission Form */}
      <form
        className="panel space-y-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (task.trim()) submit.mutate(task.trim());
        }}
      >
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Select Preset or Compose Prompt
          </label>
          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {presets.map((p) => (
              <button
                type="button"
                key={p.label}
                onClick={() => setTask(p.label)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-all",
                  task === p.label
                    ? "border-emerald-500/60 bg-emerald-950/20 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-white"
                )}
              >
                <div className="text-xs font-semibold">{p.label}</div>
                <div className="mt-1 text-[11px] text-slate-400 leading-tight">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <input
            className="field"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Describe an automated catalog task…"
          />
          <button
            type="submit"
            className="btn btn-primary px-5 font-semibold shrink-0"
            disabled={submit.isPending || !task.trim()}
          >
            {submit.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Dispatching…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Dispatch Task
              </>
            )}
          </button>
        </div>

        {submit.error && <ErrorState error={submit.error} />}
      </form>

      {/* Execution Timeline */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Agent Execution History</h2>
          <span className="text-xs text-slate-400">Live Telemetry & LangGraph Logs</span>
        </div>

        {runs.isLoading ? (
          <Loading label="Fetching agent runs…" />
        ) : runs.error ? (
          <ErrorState error={runs.error} />
        ) : !runs.data?.length ? (
          <EmptyState
            title="No agent runs yet"
            body="Submit a task above to trigger the autonomous LangGraph workflow."
            icon={Bot}
          />
        ) : (
          <div className="space-y-4">
            {runs.data.map((r) => (
              <RunTimeline key={r.id} run={r} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const statusColorDot: Record<string, string> = {
  queued: "bg-slate-500",
  running: "bg-sky-400 animate-ping",
  completed: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
  failed: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]",
};

function RunTimeline({ run }: { run: AgentRun }) {
  return (
    <div className="panel p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">{run.task}</span>
          <StatusBadge status={run.status} />
          {run.simulated && <Badge tone="warning">Simulated</Badge>}
        </div>
        <span className="font-mono text-xs text-slate-400">{formatTime(run.createdAt)}</span>
      </div>

      <ol className="relative ml-2 space-y-5 border-l border-white/10 pl-6">
        {run.events.map((e) => (
          <li key={e.id} className="relative">
            <span
              className={cn(
                "absolute -left-[31px] top-1 h-3 w-3 rounded-full border border-black",
                statusColorDot[e.status] ?? "bg-slate-400"
              )}
            />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-slate-200">{e.agent}</span>
              <StatusBadge status={e.status} />
              <span className="text-xs text-slate-400">{e.message}</span>
            </div>
            {e.result && (
              <div className="mt-1.5 rounded bg-white/[0.02] border border-white/[0.05] px-3 py-1.5 font-mono text-xs text-emerald-300">
                → {e.result}
              </div>
            )}
          </li>
        ))}
      </ol>

      {run.status === "completed" && (
        <div className="mt-6 flex justify-end border-t border-white/[0.06] pt-4">
          <Link to="/review" className="btn btn-primary text-xs">
            Review Generated Proposals
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
