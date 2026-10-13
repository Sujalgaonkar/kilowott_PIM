from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from ..models.pim import Product, AuditFinding, ProposedChange, AgentEvent

class PIMWorkflowState(BaseModel):
    task: str
    run_id: str
    products: List[Product] = Field(default_factory=list)
    findings: List[AuditFinding] = Field(default_factory=list)
    proposals: List[ProposedChange] = Field(default_factory=list)
    events: List[AgentEvent] = Field(default_factory=list)
    retry_count: int = 0
    max_retries: int = 2
    needs_retry: bool = False
    feedback: List[str] = Field(default_factory=list)
    status: str = "queued"
    error: Optional[str] = None
