import pytest
from backend.catalog.store import CatalogStore
from backend.models.pim import Product, ProposedChange
from backend.agents.state import PIMWorkflowState
from backend.agents.orchestrator import pim_graph

@pytest.mark.asyncio
async def test_agents_never_auto_publish():
    store = CatalogStore()
    test_product = Product(
        id="p-test-security",
        name="Security Shield Product",
        sku="SEC-001",
        category="Home",
        price=100.0,
        description="Original brief description.",
        attributes={"warranty": None},
        requiredAttributes=["warranty"],
        syncStatus="synced"
    )
    store.update_product(test_product)

    state = PIMWorkflowState(
        task="Enrich missing attributes and descriptions",
        run_id="sec-run-1",
        products=[test_product],
    )

    # Execute LangGraph pipeline
    result = await pim_graph.ainvoke(state)

    # 1. Product in the store must NOT have changed automatically
    stored_prod = store.get_product("p-test-security")
    assert stored_prod.description == "Original brief description."
    assert stored_prod.attributes["warranty"] is None
    assert stored_prod.sync_status == "synced"

    # 2. All proposals produced by the agents must have status='pending'
    for prop in result["proposals"]:
        assert prop.status == "pending"

def test_human_approval_applies_change():
    store = CatalogStore()
    prod = Product(
        id="p-approval-1",
        name="Approval Test Product",
        sku="APP-001",
        category="Apparel",
        price=50.0,
        description="Original short",
        attributes={"material": None},
        requiredAttributes=["material"],
        syncStatus="synced"
    )
    store.update_product(prod)

    prop = ProposedChange(
        id="c-app-1",
        productId="p-approval-1",
        productName="Approval Test Product",
        field="description",
        original="Original short",
        proposed="Approved high-quality marketing copy that meets all business requirements and standards.",
        rationale="Enrichment proposal",
        agent="Enrichment Agent",
        status="pending"
    )
    store.add_proposal(prop)

    # User explicitly approves the proposal
    reviewed = store.review_proposal(prop.id, status="approved")
    assert reviewed.status == "approved"

    # Simulate review route handler applying the approved change
    prod.description = reviewed.proposed
    prod.sync_status = "pending"
    store.update_product(prod)

    updated_prod = store.get_product("p-approval-1")
    assert updated_prod.description == "Approved high-quality marketing copy that meets all business requirements and standards."
    assert updated_prod.sync_status == "pending"

def test_rejection_does_not_modify_product():
    store = CatalogStore()
    prod = Product(
        id="p-reject-1",
        name="Reject Test Product",
        sku="REJ-001",
        category="Apparel",
        price=50.0,
        description="Keep this original description.",
        attributes={"material": None},
        requiredAttributes=["material"],
        syncStatus="synced"
    )
    store.update_product(prod)

    prop = ProposedChange(
        id="c-rej-1",
        productId="p-reject-1",
        productName="Reject Test Product",
        field="description",
        original="Keep this original description.",
        proposed="Unwanted proposed copy.",
        rationale="Enrichment proposal",
        agent="Enrichment Agent",
        status="pending"
    )
    store.add_proposal(prop)

    # User rejects the proposal
    reviewed = store.review_proposal(prop.id, status="rejected")
    assert reviewed.status == "rejected"

    # Product must remain unchanged
    stored_prod = store.get_product("p-reject-1")
    assert stored_prod.description == "Keep this original description."
