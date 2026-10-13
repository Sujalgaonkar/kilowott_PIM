import type {
  AgentRun, AuditFinding, DashboardStats, Product, ProposalStatus, ProposedChange, SyncResult,
} from "@/types/pim";

/** Contract shared by the HTTP client (FastAPI backend) and the demo adapter. */
export interface PimApi {
  mode: "backend" | "demo";
  getStats(): Promise<DashboardStats>;
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product>;
  getFindings(productId?: string): Promise<AuditFinding[]>;
  getProposals(): Promise<ProposedChange[]>;
  reviewProposal(id: string, status: ProposalStatus, editedValue?: string): Promise<ProposedChange>;
  submitTask(task: string): Promise<AgentRun>;
  getRuns(): Promise<AgentRun[]>;
  getSyncHistory(): Promise<SyncResult[]>;
  triggerSync(): Promise<SyncResult[]>;
}
