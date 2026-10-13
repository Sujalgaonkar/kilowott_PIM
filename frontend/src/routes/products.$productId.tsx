import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, qk } from "@/services";
import { Badge, ErrorState, Loading, PageHeader, Progress, StatusBadge } from "@/components/ui-kit";
import { completeness, descriptionStatus, formatTime, missingAttributes } from "@/lib/product-metrics";
import {
  ArrowLeft,
  Bot,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Sliders,
  Sparkles,
  Layers,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/products/$productId")({
  head: () => ({
    meta: [
      { title: "Product Detail — Enterprise PIM Agents" },
      { name: "description", content: "Product attributes, description audits, and deterministic quality findings." },
    ],
  }),
  component: ProductDetail,
});

export function ProductDetail() {
  const { productId } = Route.useParams();
  const product = useQuery({ queryKey: qk.product(productId), queryFn: () => api.getProduct(productId) });
  const findings = useQuery({ queryKey: qk.findings(productId), queryFn: () => api.getFindings(productId) });

  const p = product.data;
  const missing = p ? missingAttributes(p) : [];
  const completeRate = p ? completeness(p) : 0;

  return (
    <>
      {/* ── Breadcrumb / Back Navigation ─────────────────────────────── */}
      <nav aria-label="breadcrumb" className="mb-6 flex items-center gap-1.5">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-400 transition-all duration-150 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Catalog
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
        <span className="text-xs text-slate-500">
          {p ? p.sku : productId}
        </span>
        {p && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className="text-xs font-medium text-slate-300 max-w-[240px] truncate">{p.name}</span>
          </>
        )}
      </nav>

      {/* ── Loading / Error guards ───────────────────────────────────── */}
      {product.isLoading && <Loading label="Loading product specifications…" />}
      {(product.error || (!product.isLoading && !p)) && <ErrorState error={product.error} />}

      {/* ── Main Detail View ─────────────────────────────────────────── */}
      {p && (
        <>
      <PageHeader
        title={p.name}
        subtitle={`${p.sku} · ${p.category} · $${p.price.toFixed(2)} · Updated ${formatTime(p.updatedAt)}`}
        badge={<StatusBadge status={p.syncStatus} />}
        actions={
          <Link to="/agents" className="btn btn-primary text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Enrich with Agents
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Specs Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description Panel */}
          <section className="panel p-6">
            <div className="mb-3 flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">E-Commerce Product Description</h2>
              </div>
              <StatusBadge status={descriptionStatus(p)} />
            </div>

            {p.description ? (
              <p className="text-sm text-slate-300 leading-relaxed">{p.description}</p>
            ) : (
              <div className="rounded-lg border border-rose-500/20 bg-rose-950/15 p-4 text-sm text-rose-300">
                <AlertTriangle className="mb-1 h-5 w-5 text-rose-400" />
                <strong>Description is missing.</strong> This product listing cannot be published to WooCommerce without a compelling product description.
              </div>
            )}
          </section>

          {/* Attributes Matrix Panel */}
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] p-6">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-sky-400" />
                <div>
                  <h2 className="text-sm font-semibold text-white">Attribute Specifications</h2>
                  <p className="text-xs text-slate-400">Category requirement conformance</p>
                </div>
              </div>
              <Progress value={completeRate} />
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Required Attribute</th>
                    <th>Configured Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {p.requiredAttributes.map((k) => {
                    const val = p.attributes[k];
                    const isMissing = val === null || val === undefined || strValue(val).trim() === "";
                    return (
                      <tr key={k}>
                        <td className="w-48 capitalize font-medium text-slate-300">{k}</td>
                        <td className="font-mono text-xs">
                          {isMissing ? (
                            <span className="text-slate-500 italic">[Not specified]</span>
                          ) : (
                            <span className="text-white">{String(val)}</span>
                          )}
                        </td>
                        <td>
                          {isMissing ? (
                            <Badge tone="destructive">Missing</Badge>
                          ) : (
                            <Badge tone="success">Verified</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Audit Findings & Readiness Column */}
        <div className="space-y-6">
          <section className="panel p-6">
            <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                <h2 className="text-sm font-semibold text-white">Catalog Audit Findings</h2>
              </div>
              <span className="font-mono text-xs text-slate-400">
                {findings.data?.length ?? 0} issues
              </span>
            </div>

            {missing.length > 0 && (
              <div className="mb-4 rounded-lg bg-amber-950/20 border border-amber-500/20 p-3 text-xs text-amber-300">
                <strong>Empty Fields:</strong> {missing.join(", ")}
              </div>
            )}

            {findings.isLoading ? (
              <p className="text-xs text-slate-400">Running audit…</p>
            ) : findings.data?.length ? (
              <ul className="space-y-3">
                {findings.data.map((f) => (
                  <li
                    key={f.id}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <StatusBadge status={f.severity} />
                      <span className="font-mono font-medium text-slate-200">{f.field}</span>
                    </div>
                    <p className="text-slate-400">{f.message}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-4 text-center text-xs text-emerald-300">
                <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-emerald-400" />
                Listing is 100% complete and conforms to all schema requirements.
              </div>
            )}

            <div className="mt-6 border-t border-white/[0.06] pt-4">
              <Link to="/agents" className="btn btn-primary w-full text-xs">
                <Bot className="h-3.5 w-3.5" />
                Dispatch Enrichment for this SKU
              </Link>
            </div>
          </section>
        </div>
      </div>
        </>
      )}
    </>
  );
}

function strValue(v: any): string {
  return v ? String(v) : "";
}
