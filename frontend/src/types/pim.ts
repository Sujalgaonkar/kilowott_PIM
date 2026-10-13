export type SyncStatus = "synced" | "pending" | "failed" | "never";
export type DescriptionStatus = "complete" | "short" | "missing";

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  description: string;
  attributes: Record<string, string | null>;
  requiredAttributes: string[];
  syncStatus: SyncStatus;
  updatedAt: string;
}

export type Severity = "low" | "medium" | "high";
export interface AuditFinding {
  id: string;
  productId: string;
  field: string;
  severity: Severity;
  message: string;
}

export type ProposalStatus = "pending" | "approved" | "rejected";
export interface ProposedChange {
  id: string;
  productId: string;
  productName: string;
  field: string;
  original: string | null;
  proposed: string;
  rationale: string;
  agent: AgentName;
  status: ProposalStatus;
}

export type AgentName = "Orchestrator" | "Catalog Analyst" | "Enrichment Agent" | "Quality Agent";
export type AgentStatus = "queued" | "running" | "completed" | "failed";
export interface AgentEvent {
  id: string;
  agent: AgentName;
  status: AgentStatus;
  message: string;
  result?: string;
  timestamp: string;
}
export interface AgentRun {
  id: string;
  task: string;
  status: AgentStatus;
  createdAt: string;
  simulated: boolean;
  events: AgentEvent[];
}

export type SyncResultStatus = "pending" | "success" | "failed";
export interface SyncResult {
  id: string;
  productId: string;
  productName: string;
  operation: string;
  status: SyncResultStatus;
  message: string;
  timestamp: string;
}

export interface DashboardStats {
  totalProducts: number;
  incompleteListings: number;
  needsReview: number;
  successfulSyncs: number;
}
