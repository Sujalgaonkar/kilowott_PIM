import pytest
from backend.models.pim import ProposedChange
from backend.agents.quality import validate_proposal, run_quality_agent
from backend.agents.state import PIMWorkflowState

def test_quality_agent_rejects_empty_proposal():
    prop = ProposedChange(
        id="c-invalid-1",
        productId="p1",
        productName="Test Product",
        field="description",
        original=None,
        proposed="",
        rationale="Empty",
        agent="Enrichment Agent",
        status="pending"
    )
    is_valid, msg = validate_proposal(prop)
    assert is_valid is False
    assert "empty" in msg.lower()

def test_quality_agent_rejects_short_description():
    prop = ProposedChange(
        id="c-invalid-2",
        productId="p1",
        productName="Test Product",
        field="description",
        original=None,
        proposed="Too short.",  # Only 10 chars, minimum is 50
        rationale="Short copy",
        agent="Enrichment Agent",
        status="pending"
    )
    is_valid, msg = validate_proposal(prop)
    assert is_valid is False
    assert "too short" in msg.lower()

def test_quality_agent_rejects_forbidden_placeholder_text():
    for phrase in ["Lorem ipsum dolor sit amet", "Here is [TODO] description", "This is a placeholder description"]:
        prop = ProposedChange(
            id="c-invalid-3",
            productId="p1",
            productName="Test Product",
            field="description",
            original=None,
            proposed=f"A great product with {phrase} and wonderful capabilities that are completely verified.",
            rationale="Placeholder text test",
            agent="Enrichment Agent",
            status="pending"
        )
        is_valid, msg = validate_proposal(prop)
        assert is_valid is False
        assert "forbidden" in msg.lower()

def test_quality_agent_rejects_unapproved_status():
    # Invariant: agents may NEVER output status="approved"
    prop = ProposedChange(
        id="c-invalid-4",
        productId="p1",
        productName="Test Product",
        field="description",
        original=None,
        proposed="A properly written product description that meets all quality standards and specifications.",
        rationale="Bypass attempt",
        agent="Enrichment Agent",
        status="approved"  # Not allowed from agent!
    )
    is_valid, msg = validate_proposal(prop)
    assert is_valid is False
    assert "auto-approve" in msg.lower()

def test_quality_agent_bounded_retry_behavior():
    bad_prop = ProposedChange(
        id="c-bad",
        productId="p1",
        productName="Test Product",
        field="description",
        original=None,
        proposed="Short.",
        rationale="Invalid",
        agent="Enrichment Agent",
        status="pending"
    )

    # Attempt 0: retry_count=0, max_retries=2 -> should trigger retry
    state_attempt_0 = PIMWorkflowState(
        task="Test",
        run_id="run-1",
        proposals=[bad_prop],
        retry_count=0,
        max_retries=2
    )
    res_0 = run_quality_agent(state_attempt_0)
    assert res_0["needs_retry"] is True
    assert res_0["retry_count"] == 1

    # Attempt 2: retry_count=2, max_retries=2 -> bounded limit reached, no infinite loop
    state_attempt_max = PIMWorkflowState(
        task="Test",
        run_id="run-2",
        proposals=[bad_prop],
        retry_count=2,
        max_retries=2
    )
    res_max = run_quality_agent(state_attempt_max)
    assert res_max["needs_retry"] is False
