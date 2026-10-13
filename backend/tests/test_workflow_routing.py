import pytest
from backend.models.pim import Product
from backend.agents.state import PIMWorkflowState
from backend.agents.orchestrator import pim_graph

@pytest.mark.asyncio
async def test_workflow_routing_end_to_end():
    sample_product = Product(
        id="test-p1",
        name="Test Wireless Keyboard",
        sku="TEST-KEY-001",
        category="Electronics",
        price=49.99,
        description="",  # Missing description
        attributes={"connectivity": None, "color": "Black"},
        requiredAttributes=["connectivity", "color"],
        syncStatus="never"
    )

    state = PIMWorkflowState(
        task="Audit incomplete products and draft proposals",
        run_id="test-run-1",
        products=[sample_product],
        events=[],
        retry_count=0,
        max_retries=2,
    )

    result = await pim_graph.ainvoke(state)

    # 1. Verify status reached completed
    assert result["status"] == "completed"

    # 2. Verify all agents participated in event timeline
    event_agents = [e.agent for e in result["events"]]
    assert "Orchestrator" in event_agents
    assert "Catalog Analyst" in event_agents
    assert "Enrichment Agent" in event_agents
    assert "Quality Agent" in event_agents

    # 3. Verify proposals were generated
    assert len(result["proposals"]) > 0

    # 4. Verify proposals are in 'pending' status
    for prop in result["proposals"]:
        assert prop.status == "pending"
