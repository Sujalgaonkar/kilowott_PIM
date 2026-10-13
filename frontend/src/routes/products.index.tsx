import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, qk } from "@/services";
import { EmptyState, ErrorState, Loading, PageHeader, Progress, StatusBadge, Badge } from "@/components/ui-kit";
import { completeness, descriptionStatus } from "@/lib/product-metrics";
import { ArrowLeft, LayoutDashboard, Layers, ChevronRight, Search, Filter, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Product Catalog — Enterprise PIM Agents" },
      { name: "description", content: "Browse and audit products with attribute completeness and WooCommerce sync state." },
    ],
  }),
  component: Catalog,
});

export function Catalog() {
  const [q, setQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const { data, isLoading, error } = useQuery({
    queryKey: qk.products,
    queryFn: api.getProducts,
  });

  const categories = ["All", ...Array.from(new Set(data?.map((p) => p.category) ?? []))];

  const filteredRows = (data ?? []).filter((p) => {
    const matchesQuery = `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(q.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

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
          <Layers className="h-3.5 w-3.5 text-emerald-400" />
          Product Catalog
        </span>
      </nav>

      <PageHeader
        title="Product Master Catalog"
        subtitle="Centralized catalog telemetry, attribute readiness, and synchronization statuses."
        badge={
          <Badge tone="primary" showDot>
            {data ? `${data.length} Products Loaded` : "Loading"}
          </Badge>
        }
      />

      {/* Filter and Search Bar */}
      <div className="panel mb-6 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="field pl-9"
              placeholder="Search by name, SKU, or category…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                  selectedCategory === cat
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loading label="Fetching catalog records…" />
      ) : error ? (
        <ErrorState error={error} />
      ) : filteredRows.length === 0 ? (
        <EmptyState
          title="No products match criteria"
          body="Try adjusting your search terms or clearing the selected category filter."
          icon={Layers}
        />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Title</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Description</th>
                  <th>Completeness</th>
                  <th>WooCommerce</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        to="/products/$productId"
                        params={{ productId: p.id }}
                        className="font-semibold text-white hover:text-emerald-400 transition-colors"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="font-mono text-xs text-slate-400">{p.sku}</td>
                    <td>
                      <span className="rounded bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-xs text-slate-300">
                        {p.category}
                      </span>
                    </td>
                    <td className="font-mono text-xs font-semibold text-white">
                      ${p.price.toFixed(2)}
                    </td>
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
                        className="btn text-xs py-1 px-2.5 inline-flex items-center gap-1"
                      >
                        Details
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
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
