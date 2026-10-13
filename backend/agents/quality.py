import logging
from typing import List, Tuple
from ..models.pim import ProposedChange, AgentEvent, utc_now_iso
from .state import PIMWorkflowState

logger = logging.getLogger("pim.quality")

FORBIDDEN_PHRASES = [
    "lorem ipsum",
    "[todo]",
    "asdf",
    "placeholder description",
    "test test",
    "replace this text",
]

def validate_proposal(proposal: ProposedChange) -> Tuple[bool, str]:
    """
    Deterministic Quality Validation:
    Enforces business rules and schema conformance without relying on non-deterministic LLM calls.
    """
    proposed_val = (proposal.proposed or "").strip()

    if not proposed_val:
        return False, f"Proposal for {proposal.productName}.{proposal.field} is empty."

    val_lower = proposed_val.lower()
    for bad_phrase in FORBIDDEN_PHRASES:
        if bad_phrase in val_lower:
            return False, f"Proposal for {proposal.productName}.{proposal.field} contains forbidden placeholder text: '{bad_phrase}'."

    if proposal.field == "description":
        if len(proposed_val) < 50:
            return False, f"Description for {proposal.productName} is too short ({len(proposed_val)} chars, min 50 required)."
        if len(proposed_val) > 2000:
            return False, f"Description for {proposal.productName} exceeds maximum character limit of 2000."

    if proposal.status != "pending":
        return False, "Quality Agent invariant violation: agents are never permitted to auto-approve or publish changes."

    return True, "Valid"

def run_quality_agent(state: PIMWorkflowState) -> dict:
    """
    Quality Agent:
    Validates all generated proposals deterministically.
    Controls bounded retries back to Enrichment Agent when business rules are violated.
    """
    logger.info(f"[Quality Agent] Validating {len(state.proposals)} proposals. Retry count: {state.retry_count}/{state.max_retries}")

    validation_errors: List[str] = []
    validated_proposals: List[ProposedChange] = []

    for prop in state.proposals:
        is_valid, msg = validate_proposal(prop)
        if not is_valid:
            validation_errors.append(msg)
            logger.warning(f"[Quality Agent] Validation failed for proposal {prop.id}: {msg}")
        else:
            validated_proposals.append(prop)

    # Determine if retry is needed
    if validation_errors and state.retry_count < state.max_retries:
        needs_retry = True
        new_retry_count = state.retry_count + 1
        summary_msg = f"Validation found {len(validation_errors)} issues. Triggering bounded retry ({new_retry_count}/{state.max_retries})."
        result_msg = f"Retry requested with {len(validation_errors)} feedback points"
        logger.info(f"[Quality Agent] {summary_msg}")
    else:
        needs_retry = False
        new_retry_count = state.retry_count
        if validation_errors:
            summary_msg = f"Validation completed with {len(validation_errors)} warnings (max retries reached). Proposals held for manual review."
            result_msg = f"{len(validated_proposals)} valid proposals, {len(validation_errors)} flagged for merchant inspection"
        else:
            summary_msg = f"All {len(validated_proposals)} proposals passed deterministic schema and business rule checks."
            result_msg = f"{len(validated_proposals)} proposals verified; awaiting merchant approval"
        logger.info(f"[Quality Agent] {summary_msg}")

    event = AgentEvent(
        id=f"ev-quality-{len(state.events) + 1}",
        agent="Quality Agent",
        status="completed",
        message=summary_msg,
        result=result_msg,
        timestamp=utc_now_iso(),
    )

    return {
        "needs_retry": needs_retry,
        "retry_count": new_retry_count,
        "feedback": validation_errors,
        "events": state.events + [event],
    }
