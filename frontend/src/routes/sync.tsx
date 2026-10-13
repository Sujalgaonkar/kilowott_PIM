import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, qk } from "@/services";
import { EmptyState, ErrorState, Loading, PageHeader, StatusBadge, Badge } from "@/components/ui-kit";
import { formatTime } from "@/lib/product-metrics";
import { cn } from "@/lib/utils";
import type { SyncResultStatus } from "@/types/pim";
import {
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  AlertTriangle,
  ArrowRight,
  Server,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/sync")({
  head: () => ({
    meta: [
      { title: "WooCommerce Sync Hub — Enterprise PIM Agents" },
      { name: "description", content: "Audit log of WooCommerce REST API and mock synchronization operations." },
    ],
  }),
  component: Sync,
});

const filters: ("all" | SyncResultStatus)[] = ["all", "pending", "success", "failed"];

export function Sync() {
  const qc = useQueryClient();
  const [f, setF] = useState<(typeof filters)[number]>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: qk.sync,
    queryFn: api.getSyncHistory,
  });

  const syncMutation = useMutation({
    mutationFn: api.triggerSync,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.sync });
      qc.invalidateQueries({ queryKey: qk.products });
      qc.invalidateQueries({ queryKey: qk.stats });
    },
  });

  const rows = (data ?? []).filter((r) => f === "all" || r.status === f);
  const successCount = data?.filter((r) => r.status === "success").length ?? 0;
  const pendingCount = data?.filter((r) => r.status === "pending").length ?? 0;
  const failedCount = data?.filter((r) => r.status === "failed").length ?? 0;

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
          <RefreshCw className="h-3.5 w-3.5 text-teal-400" />
          Sync Hub
        </span>
      </nav>

      <PageHeader
        title="WooCommerce Synchronization Hub"
        subtitle="Real-time audit log of REST API synchronization events, payloads, and operation status."
        badge={
          <Badge tone="primary" showDot>
            Adapter Active
          </Badge>
        }
        actions={
          <button
            className="btn btn-primary text-xs"
            disabled={syncMutation.isPending}
            onClick={() => syncMutation.mutate()}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", syncMutation.isPending && "animate-spin")} />
            {syncMutation.isPending ? "Syncing Catalog…" : "Sync All Pending Products"}
          </button>
        }
      />

      {/* Adapter Telemetry Card */}
      <div className="panel mb-8 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">WooCommerce REST Adapter</h2>
                <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-mono text-sky-300 border border-sky-500/20">
                  MOCK MODE ENABLED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full end-to-end demonstrations run safely without remote credentials. Configurable in backend .env.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-center">
              <span className="block text-emerald-400 font-bold text-sm">{successCount}</span>
              <span className="text-slate-400 text-[10px] uppercase">Success</span>
            </div>
            <div className="text-center">
              <span className="block text-amber-400 font-bold text-sm">{pendingCount}</span>
              <span className="text-slate-400 text-[10px] uppercase">Pending</span>
            </div>
            <div className="text-center">
              <span className="block text-rose-400 font-bold text-sm">{failedCount}</span>
              <span className="text-slate-400 text-[10px] uppercase">Failed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Synchronization Event History</h3>
        <div className="flex gap-1.5">
          {filters.map((x) => (
            <button
              key={x}
              onClick={() => setF(x)}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium capitalize transition-all cursor-pointer",
                f === x
                  ? "bg-white/[0.08] text-white border border-white/20"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
              )}
            >
              {x}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Loading label="Fetching sync history…" />
      ) : error ? (
        <ErrorState error={error} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No sync records found"
          body="Approved product changes will be dispatched through the WooCommerce adapter and logged here."
          icon={RefreshCw}
        />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Target Product</th>
                  <th>Operation</th>
                  <th>Status</th>
                  <th>Adapter Response Message</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap font-mono text-xs text-slate-400">
                      {formatTime(r.timestamp)}
                    </td>
                    <td className="font-semibold text-white">{r.productName}</td>
                    <td className="font-mono text-xs text-sky-400">{r.operation}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="text-xs text-slate-300">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
