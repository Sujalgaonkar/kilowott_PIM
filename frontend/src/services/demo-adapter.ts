import { sampleProducts, sampleSyncHistory } from "@/data/sample-products";
import { descriptionStatus, isIncomplete, missingAttributes } from "@/lib/product-metrics";
import type { AgentEvent, AgentName, AgentRun, AuditFinding, Product, ProposedChange, SyncResult } from "@/types/pim";
import type { PimApi } from "./pim-api";

/**
 * Replaceable demo adapter. Runs entirely in memory using sample data.
 * Agent runs are SIMULATED placeholders (flagged `simulated: true`) — no AI
 * is called and nothing is sent to WooCommerce.
 */
const products: Product[] = structuredClone(sampleProducts);
const sync: SyncResult[] = structuredClone(sampleSyncHistory);
const proposals: ProposedChange[] = [];
const runs: AgentRun[] = [];
let seq = 0;
const uid = (p: string) => `${p}${++seq}`;
const now = () => new Date().toISOString();
const delay = <T,>(v: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), ms));

function findingsFor(p: Product): AuditFinding[] {
  const out: AuditFinding[] = [];
  const ds = descriptionStatus(p);
  if (ds !== "complete")
    out.push({ id: `f-${p.id}-desc`, productId: p.id, field: "description", severity: ds === "missing" ? "high" : "medium", message: ds === "missing" ? "Description is missing" : "Description is under 80 characters" });
  for (const a of missingAttributes(p))
    out.push({ id: `f-${p.id}-${a}`, productId: p.id, field: a, severity: "medium", message: `Required attribute "${a}" is empty` });
  return out;
}

function placeholderProposals(task: string): ProposedChange[] {
  const descOnly = /description/i.test(task);
  const result: ProposedChange[] = [];
  for (const p of products.filter(isIncomplete)) {
    if (descriptionStatus(p) !== "complete" && !proposals.some((x) => x.productId === p.id && x.field === "description" && x.status === "pending"))
      result.push({
        id: uid("c"), productId: p.id, productName: p.name, field: "description", original: p.description || null,
        proposed: `[Demo placeholder] ${p.name} — a ${p.category.toLowerCase()} product. Connect the backend to generate real copy.`,
        rationale: "Simulated proposal from demo adapter", agent: "Enrichment Agent", status: "pending",
      });
    if (!descOnly)
      for (const a of missingAttributes(p))
        if (!proposals.some((x) => x.productId === p.id && x.field === a && x.status === "pending"))
          result.push({
            id: uid("c"), productId: p.id, productName: p.name, field: a, original: null, proposed: "[needs value]",
            rationale: "Simulated: attribute flagged empty; real value requires backend enrichment", agent: "Enrichment Agent", status: "pending",
          });
  }
  return result;
}

function simulate(run: AgentRun, task: string) {
  const steps: { agent: AgentName; msg: string; result: () => string }[] = [
    { agent: "Orchestrator", msg: "Planning task", result: () => "Delegated to Catalog Analyst → Enrichment → Quality" },
    { agent: "Catalog Analyst", msg: "Auditing catalog", result: () => `${products.filter(isIncomplete).length} incomplete products found` },
    { agent: "Enrichment Agent", msg: "Drafting proposals", result: () => { const n = placeholderProposals(task); proposals.push(...n); return `${n.length} placeholder proposals queued for review`; } },
    { agent: "Quality Agent", msg: "Validating proposals", result: () => "Proposals marked as placeholders — human review required" },
  ];
  run.events = steps.map((s) => ({ id: uid("e"), agent: s.agent, status: "queued", message: s.msg, timestamp: now() }));
  run.status = "running";
  steps.forEach((s, i) => {
    setTimeout(() => { const e = run.events[i]; if (e) { e.status = "running"; e.timestamp = now(); } }, 600 + i * 1200);
    setTimeout(() => {
      const e = run.events[i] as AgentEvent | undefined;
      if (e) { e.status = "completed"; e.result = s.result(); e.timestamp = now(); }
      if (i === steps.length - 1) run.status = "completed";
    }, 1400 + i * 1200);
  });
}

export const demoAdapter: PimApi = {
  mode: "demo",
  getStats: () => delay({
    totalProducts: products.length,
    incompleteListings: products.filter(isIncomplete).length,
    needsReview: proposals.filter((p) => p.status === "pending").length,
    successfulSyncs: sync.filter((s) => s.status === "success").length,
  }),
  getProducts: () => delay(products),
  getProduct: async (id) => {
    const p = products.find((x) => x.id === id);
    if (!p) throw new Error("Product not found");
    return delay(p);
  },
  getFindings: (pid) => delay(products.filter((p) => !pid || p.id === pid).flatMap(findingsFor)),
  getProposals: () => delay(proposals),
  reviewProposal: async (id, status, editedValue) => {
    const c = proposals.find((x) => x.id === id);
    if (!c) throw new Error("Proposal not found");
    c.status = status;
    if (editedValue !== undefined) c.proposed = editedValue;
    if (status === "approved") {
      const p = products.find((x) => x.id === c.productId);
      if (p) {
        if (c.field === "description") p.description = c.proposed; else p.attributes[c.field] = c.proposed;
        p.syncStatus = "pending"; p.updatedAt = now();
      }
      sync.unshift({ id: uid("s"), productId: c.productId, productName: c.productName, operation: `update ${c.field}`, status: "pending", message: "Queued locally — WooCommerce not connected in demo mode", timestamp: now() });
    }
    return delay(c);
  },
  submitTask: async (task) => {
    const run: AgentRun = { id: uid("r"), task, status: "queued", createdAt: now(), simulated: true, events: [] };
    runs.unshift(run);
    simulate(run, task);
    return delay(run);
  },
  getRuns: () => delay(runs, 100),
  getSyncHistory: () => delay(sync),
  triggerSync: async () => delay(sync),
};
