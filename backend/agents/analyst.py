import logging
from typing import List
from ..models.pim import AuditFinding, AgentEvent, utc_now_iso
from .state import PIMWorkflowState

logger = logging.getLogger("pim.analyst")

def run_catalog_analyst(state: PIMWorkflowState) -> dict:
    """
    Catalog Analyst Agent:
    Inspects products and deterministically identifies missing or inconsistent fields.
    Never invents missing product specifications.
    """
    logger.info(f"[Catalog Analyst] Auditing {len(state.products)} products for task: '{state.task}'")

    findings: List[AuditFinding] = []
    incomplete_products_count = 0

    for p in state.products:
        is_product_incomplete = False
        desc = (p.description or "").strip()

        # Check description
        if not desc:
            is_product_incomplete = True
            findings.append(AuditFinding(
                id=f"f-{p.id}-desc",
                productId=p.id,
                field="description",
                severity="high",
                message="Description is completely missing"
            ))
        elif len(desc) < 80:
            is_product_incomplete = True
            findings.append(AuditFinding(
                id=f"f-{p.id}-desc",
                productId=p.id,
                field="description",
                severity="medium",
                message=f"Description is too short ({len(desc)} characters; recommended >= 80)"
            ))

        # Check required attributes
        for req_attr in p.required_attributes:
            val = p.attributes.get(req_attr)
            if val is None or str(val).strip() == "":
                is_product_incomplete = True
                findings.append(AuditFinding(
                    id=f"f-{p.id}-{req_attr}",
                    productId=p.id,
                    field=req_attr,
                    severity="medium",
                    message=f"Required attribute '{req_attr}' is missing or empty"
                ))

        # Check price integrity
        if p.price <= 0:
            is_product_incomplete = True
            findings.append(AuditFinding(
                id=f"f-{p.id}-price",
                productId=p.id,
                field="price",
                severity="high",
                message="Product price must be greater than zero"
            ))

        if is_product_incomplete:
            incomplete_products_count += 1

    event = AgentEvent(
        id=f"ev-analyst-{len(state.events) + 1}",
        agent="Catalog Analyst",
        status="completed",
        message=f"Catalog audit complete: identified {len(findings)} findings across {incomplete_products_count} products.",
        result=f"{incomplete_products_count} incomplete listings detected; {len(findings)} issues cataloged",
        timestamp=utc_now_iso(),
    )

    logger.info(f"[Catalog Analyst] Finished: {len(findings)} findings generated.")
    return {
        "findings": findings,
        "events": state.events + [event],
    }
