from typing import Literal, Optional, Dict, List, Any
import re
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel
from datetime import datetime, timezone

SyncStatus = Literal["synced", "pending", "failed", "never"]
DescriptionStatus = Literal["complete", "short", "missing"]
Severity = Literal["low", "medium", "high"]
ProposalStatus = Literal["pending", "approved", "rejected"]
AgentName = Literal["Orchestrator", "Catalog Analyst", "Enrichment Agent", "Quality Agent"]
AgentStatus = Literal["queued", "running", "completed", "failed"]
SyncResultStatus = Literal["pending", "success", "failed"]

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )

    def __getattr__(self, item: str) -> Any:
        snake_item = re.sub(r'(?<!^)(?=[A-Z])', '_', item).lower()
        if snake_item in self.__dict__:
            return self.__dict__[snake_item]
        raise AttributeError(f"{type(self).__name__!r} object has no attribute {item!r}")

class Product(CamelModel):
    id: str
    name: str
    sku: str
    category: str
    price: float
    description: str = ""
    attributes: Dict[str, Optional[str]] = Field(default_factory=dict)
    required_attributes: List[str] = Field(default_factory=list)
    sync_status: SyncStatus = "never"
    updated_at: str = Field(default_factory=utc_now_iso)

class AuditFinding(CamelModel):
    id: str
    product_id: str
    field: str
    severity: Severity
    message: str

class ProposedChange(CamelModel):
    id: str
    product_id: str
    product_name: str
    field: str
    original: Optional[str] = None
    proposed: str
    rationale: str
    agent: AgentName = "Enrichment Agent"
    status: ProposalStatus = "pending"

class ProposalReviewRequest(BaseModel):
    status: ProposalStatus
    edited_value: Optional[str] = None

class AgentEvent(CamelModel):
    id: str
    agent: AgentName
    status: AgentStatus
    message: str
    result: Optional[str] = None
    timestamp: str = Field(default_factory=utc_now_iso)

class AgentRun(CamelModel):
    id: str
    task: str
    status: AgentStatus
    created_at: str = Field(default_factory=utc_now_iso)
    simulated: bool = False
    events: List[AgentEvent] = Field(default_factory=list)

class SubmitTaskRequest(BaseModel):
    task: str

class SyncResult(CamelModel):
    id: str
    product_id: str
    product_name: str
    operation: str
    status: SyncResultStatus
    message: str
    timestamp: str = Field(default_factory=utc_now_iso)

class DashboardStats(CamelModel):
    total_products: int
    incomplete_listings: int
    needs_review: int
    successful_syncs: int
