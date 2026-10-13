import type { PimApi } from "./pim-api";

/**
 * HTTP adapter for the Python FastAPI + LangGraph backend.
 * Base URL comes from VITE_API_BASE_URL. No secrets live here — the backend
 * holds AI and WooCommerce credentials.
 */
export function createHttpClient(baseUrl: string): PimApi {
  const base = baseUrl.replace(/\/$/, "");
  async function req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Backend error ${res.status}${text ? `: ${text}` : ""}`);
    }
    return res.json() as Promise<T>;
  }
  return {
    mode: "backend",
    getStats: () => req("/api/stats"),
    getProducts: () => req("/api/products"),
    getProduct: (id) => req(`/api/products/${encodeURIComponent(id)}`),
    getFindings: (pid) => req(`/api/findings${pid ? `?product_id=${encodeURIComponent(pid)}` : ""}`),
    getProposals: () => req("/api/proposals"),
    reviewProposal: (id, status, editedValue) =>
      req(`/api/proposals/${id}/review`, { method: "POST", body: JSON.stringify({ status, edited_value: editedValue }) }),
    submitTask: (task) => req("/api/agents/runs", { method: "POST", body: JSON.stringify({ task }) }),
    getRuns: () => req("/api/agents/runs"),
    getSyncHistory: () => req("/api/sync/history"),
    triggerSync: () => req("/api/sync", { method: "POST" }),
  };
}
