import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, qk } from "@/services";
import { ErrorState, Loading, PageHeader, StatCard, StatusBadge, Progress, Badge } from "@/components/ui-kit";
import { isIncomplete, completeness, descriptionStatus } from "@/lib/product-metrics";
import {
  Layers,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bot,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Enterprise PIM Agents" },
      { name: "description", content: "Overview of product catalog health, review queue and WooCommerce sync." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const stats = useQuery({ queryKey: qk.stats, queryFn: api.getStats });
  const products = useQuery({ queryKey: qk.products, queryFn: api.getProducts });

  const incompleteProducts = products.data?.filter(isIncomplete) ?? [];
  const healthPercent = products.data?.length
    ? Math.round(((products.data.length - incompleteProducts.length) / products.data.length) * 100)
    : 0;

  return (
    <>
      <PageHeader
        title="Catalog Intelligence Dashboard"
        subtitle="Real-time catalog readiness, AI agent workflows, and WooCommerce synchronization."
        badge={
          <Badge tone="purple" showDot>
            Multi-Agent Active
          </Badge>
        }
        actions={
          <Link to="/agents" className="btn btn-primary">
            <Sparkles className="h-4 w-4" />
            Launch Agent Task
          </Link>
        }
      />

      {/* Primary Metrics Row */}
      {stats.isLoading ? (
        <Loading label="Loading catalog telemetry…" />
      ) : stats.error ? (
        <ErrorState error={stats.error} />
      ) : stats.data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Products"
            value={stats.data.totalProducts}
            hint="Catalog items active"
            tone="primary"
            icon={Layers}
          />
          <StatCard
            label="Incomplete Listings"
            value={stats.data.incompleteListings}
            hint="Need description or attributes"
            tone="warning"
            icon={AlertTriangle}
          />
          <StatCard
            label="Proposals In Review"
            value={stats.data.needsReview}
            hint="Awaiting human approval"
            tone="info"
            icon={Clock}
          />
          <StatCard
            label="Successful Syncs"
            value={stats.data.successfulSyncs}
            hint="WooCommerce synchronized"
            tone="success"
            icon={CheckCircle2}
          />
        </div>
      )}

      {/* Catalog Health & Multi-Agent Flow Banner */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Health Gauge Panel */}
        <div className="panel p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
              Catalog Readiness Score
            </h3>
            <span className="font-mono text-xl font-bold text-emerald-400">{healthPercent}%</span>
          </div>

          <div className="mt-4">
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500"
                style={{ width: `${healthPercent}%` }}
              />
            </div>
            <p className="mt-2.5 text-xs text-slate-400">
              {incompleteProducts.length === 0
                ? "All products meet 100% attribute completeness and description standards."
                : `${incompleteProducts.length} listings require enrichment before production publishing.`}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-white/[0.06] pt-4">
            <Link
              to="/agents"
              className="btn btn-primary w-full text-xs font-semibold"
            >
              <Bot className="h-3.5 w-3.5" />
              Run Auto-Enrichment Workflow
            </Link>
            <Link
              to="/review"
              className="btn w-full text-xs text-slate-300 hover:text-white"
            >
              Open Review Queue ({stats.data?.needsReview ?? 0})
            </Link>
          </div>
        </div>

        {/* Multi-Agent Architecture Card */}
        <div className="panel p-6 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">LangGraph Multi-Agent Architecture</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">4 Autonomous Roles</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-[10px]">1</span>
                Catalog Analyst
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Audits products, checks missing specifications, identifies schema inconsistencies without hallucinations.
              </p>
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/10 text-[10px]">2</span>
                Enrichment Agent
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Generates grounded marketing copy and structured attributes. Strictly queues proposals for review.
              </p>
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/10 text-[10px]">3</span>
                Quality Agent
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Deterministic validation against business rules. Triggers bounded retries for invalid proposals.
              </p>
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-[10px]">4</span>
                Human Approval Gate
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Enforces approval before updating products or syncing to WooCommerce REST API.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Needing Attention Section */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Products Requiring Attention</h2>
            <p className="text-xs text-slate-400">
              Listings flagged with incomplete attributes or missing product descriptions.
            </p>
          </div>
          <Link to="/products" className="text-xs font-medium text-emerald-400 hover:underline flex items-center gap-1">
            Browse full catalog <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {products.isLoading ? (
          <Loading />
        ) : incompleteProducts.length === 0 ? (
          <div className="panel p-8 text-center text-sm text-slate-400">
            <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
            All products are complete and ready for synchronization!
          </div>
        ) : (
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>SKU</th>
                    <th>Description</th>
                    <th>Attributes</th>
                    <th>WooCommerce</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {incompleteProducts.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium text-white">
                        <Link
                          to="/products/$productId"
                          params={{ productId: p.id }}
                          className="hover:text-emerald-400 transition-colors"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="text-slate-400">{p.category}</td>
                      <td className="font-mono text-xs text-slate-400">{p.sku}</td>
                      <td>
                        <StatusBadge status={descriptionStatus(p)} />
                      </td>
                      <td>
                        <Progress value={completeness(p)} />
                      </td>
                      <td>
                        <StatusBadge status={p.syncStatus} />
                      </td>
                      <td className="text-right">
                        <Link
                          to="/products/$productId"
                          params={{ productId: p.id }}
                          className="btn text-xs py-1 px-2.5 hover:border-emerald-500/40"
                        >
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
