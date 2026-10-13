import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, qk } from "@/services";
import { Badge, EmptyState, ErrorState, Loading, PageHeader, StatusBadge } from "@/components/ui-kit";
import type { ProposalStatus, ProposedChange } from "@/types/pim";
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Edit3,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Bot,
  ChevronRight,
  ArrowRight,
  Filter,
} from "lucide-react";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Review Proposals — Enterprise PIM Agents" },
      { name: "description", content: "Audit original vs. AI-generated product values with explicit human-in-the-loop approval." },
    ],
  }),
  component: Review,
});

export function Review() {
  const { data, isLoading, error } = useQuery({ queryKey: qk.proposals, queryFn: api.getProposals });
  const pending = data?.filter((c) => c.status === "pending") ?? [];
  const reviewed = data?.filter((c) => c.status !== "pending") ?? [];

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
          <CheckSquare className="h-3.5 w-3.5 text-sky-400" />
          Review Proposals
        </span>
      </nav>

      <PageHeader
        title="Proposal Review & Quality Hub"
        subtitle="Explicit human approval gate: changes remain pending until approved by a merchant."
        badge={
          <Badge tone={pending.length > 0 ? "warning" : "success"} showDot>
            {pending.length} Pending Approval
          </Badge>
        }
      />

      {isLoading ? (
        <Loading label="Fetching pending proposals…" />
      ) : error ? (
        <ErrorState error={error} />
      ) : !data?.length ? (
        <EmptyState
          title="Review queue is clear"
          body="No agent proposals currently pending. Dispatch a task from the Agent Control Center to generate enhancements."
          icon={CheckSquare}
          action={
            <Link to="/agents" className="btn btn-primary">
              <Bot className="h-4 w-4" />
              Open Agent Control
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Pending Proposals Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-xs font-mono text-amber-400">
                  {pending.length}
                </span>
                Proposals Awaiting Approval
              </h2>
              <span className="text-xs text-slate-400">Strict Human-in-the-Loop Enforced</span>
            </div>

            {pending.length === 0 ? (
              <div className="panel p-6 text-center text-sm text-slate-400">
                <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
                All generated proposals have been reviewed!
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map((c) => (
                  <ProposalCard key={c.id} change={c} />
                ))}
              </div>
            )}
          </div>

          {/* Reviewed Proposals Section */}
          {reviewed.length > 0 && (
            <div className="border-t border-white/[0.08] pt-8">
              <h2 className="mb-4 text-sm font-semibold tracking-wider uppercase text-slate-400">
                Reviewed History ({reviewed.length})
              </h2>
              <div className="space-y-4">
                {reviewed.map((c) => (
                  <ProposalCard key={c.id} change={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function ProposalCard({ change: c }: { change: ProposedChange }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(c.proposed);

  const m = useMutation({
    mutationFn: ({ status, v }: { status: ProposalStatus; v?: string }) =>
      api.reviewProposal(c.id, status, v),
    onSuccess: () => {
      for (const k of [qk.proposals, qk.products, qk.stats, qk.sync]) {
        qc.invalidateQueries({ queryKey: k });
      }
      setEditing(false);
    },
  });

  const isPending = c.status === "pending";

  return (
    <div className="panel p-6 transition-all duration-200 hover:border-white/20">
      {/* Proposal Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/products/$productId"
            params={{ productId: c.productId }}
            className="text-sm font-bold text-white hover:text-emerald-400 transition-colors"
          >
            {c.productName}
          </Link>
          <Badge tone="purple">{c.field}</Badge>
          <span className="text-xs text-slate-400">by {c.agent}</span>
        </div>
        <StatusBadge status={c.status} />
      </div>

      {/* Side-by-Side Comparison Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Original */}
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Original Catalog Value</span>
            <span className="font-mono text-[10px]">CURRENT</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {c.original || <em className="text-slate-500 font-style-italic">[Field is currently empty]</em>}
          </p>
        </div>

        {/* AI Proposed */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 shadow-inner">
          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI Proposed Enrichment
            </span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300">
              QUALITY VALIDATED
            </span>
          </div>

          {editing ? (
            <div className="space-y-2">
              <textarea
                className="field min-h-24 w-full"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              <span className="text-[11px] text-slate-400 font-mono">
                {value.length} characters
              </span>
            </div>
          ) : (
            <p className="text-sm text-emerald-100 leading-relaxed">{c.proposed}</p>
          )}
        </div>
      </div>

      {/* Rationale & Quality Callout */}
      <div className="mt-3.5 flex items-start gap-2 text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
        <span>
          <strong className="text-slate-300">Grounding Rationale:</strong> {c.rationale}
        </span>
      </div>

      {m.error && (
        <div className="mt-3">
          <ErrorState error={m.error} />
        </div>
      )}

      {/* Approval Actions */}
      {isPending && (
        <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-white/[0.06] pt-4">
          {editing ? (
            <>
              <button
                className="btn btn-primary"
                disabled={m.isPending}
                onClick={() => m.mutate({ status: "approved", v: value })}
              >
                <CheckCircle2 className="h-4 w-4" />
                Save & Approve Changes
              </button>
              <button
                className="btn"
                onClick={() => {
                  setEditing(false);
                  setValue(c.proposed);
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-primary"
                disabled={m.isPending}
                onClick={() => m.mutate({ status: "approved" })}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve & Sync
              </button>
              <button className="btn" onClick={() => setEditing(true)}>
                <Edit3 className="h-4 w-4" />
                Edit Value
              </button>
              <button
                className="btn btn-danger"
                disabled={m.isPending}
                onClick={() => m.mutate({ status: "rejected" })}
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
