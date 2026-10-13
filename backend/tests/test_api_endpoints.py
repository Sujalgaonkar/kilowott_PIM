import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.catalog.store import store

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "woocommerce" in data

def test_api_stats():
    res = client.get("/api/stats")
    assert res.status_code == 200
    data = res.json()
    assert "totalProducts" in data
    assert "incompleteListings" in data
    assert "needsReview" in data
    assert "successfulSyncs" in data

def test_api_products():
    res = client.get("/api/products")
    assert res.status_code == 200
    products = res.json()
    assert isinstance(products, list)
    assert len(products) > 0
    first = products[0]
    assert "id" in first
    assert "name" in first
    assert "syncStatus" in first

def test_api_single_product():
    res = client.get("/api/products/p1")
    assert res.status_code == 200
    p = res.json()
    assert p["id"] == "p1"
    assert p["name"] == "Aurora Merino Crew Sweater"

def test_api_findings():
    res = client.get("/api/findings?product_id=p3")
    assert res.status_code == 200
    findings = res.json()
    assert isinstance(findings, list)
    # p3 has missing description
    assert any(f["field"] == "description" for f in findings)

def test_api_agent_run_submission():
    res = client.post("/api/agents/runs", json={"task": "Audit incomplete products"})
    assert res.status_code == 200
    run_data = res.json()
    assert "id" in run_data
    assert run_data["task"] == "Audit incomplete products"
    assert run_data["status"] in ("queued", "running", "completed")

def test_api_review_proposal_workflow():
    # 1. Add a test proposal directly to store
    from backend.models.pim import ProposedChange
    prop = ProposedChange(
        id="c-api-test-1",
        productId="p2",
        productName="Trailhead 28L Hiking Backpack",
        field="description",
        original="Durable daypack.",
        proposed="High performance ripstop backpack designed for long trails and all-weather conditions.",
        rationale="API review test",
        agent="Enrichment Agent",
        status="pending"
    )
    store.add_proposal(prop)

    # 2. Call review endpoint to approve
    res = client.post(
        f"/api/proposals/{prop.id}/review",
        json={"status": "approved", "edited_value": "User edited high performance backpack description."}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "approved"
    assert data["proposed"] == "User edited high performance backpack description."

    # 3. Product in store must now have the approved value
    p2 = store.get_product("p2")
    assert p2.description == "User edited high performance backpack description."
    assert p2.sync_status in ("synced", "pending")

def test_api_sync_history():
    res = client.get("/api/sync/history")
    assert res.status_code == 200
    history = res.json()
    assert isinstance(history, list)
    assert len(history) > 0
