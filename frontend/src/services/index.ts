import { demoAdapter } from "./demo-adapter";
import { createHttpClient } from "./http-client";
import type { PimApi } from "./pim-api";

const baseUrl = import.meta.env['VITE_API_BASE_URL'] as string | undefined;

/** Uses the FastAPI backend when VITE_API_BASE_URL is set, otherwise the demo adapter. */
export const api: PimApi = baseUrl ? createHttpClient(baseUrl) : demoAdapter;

export const qk = {
  stats: ["stats"] as const,
  products: ["products"] as const,
  product: (id: string) => ["products", id] as const,
  findings: (id?: string) => ["findings", id ?? "all"] as const,
  proposals: ["proposals"] as const,
  runs: ["runs"] as const,
  sync: ["sync"] as const,
};
