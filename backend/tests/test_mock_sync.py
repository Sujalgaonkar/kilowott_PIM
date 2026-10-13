import pytest
from backend.models.pim import Product
from backend.adapters.woocommerce import MockWooCommerceAdapter, RealWooCommerceAdapter

@pytest.mark.asyncio
async def test_mock_woocommerce_adapter_sync_success():
    adapter = MockWooCommerceAdapter()

    product = Product(
        id="p-mock-1",
        name="Mock Test Running Shoe",
        sku="MOCK-SHOE-001",
        category="Footwear",
        price=120.0,
        description="A great lightweight performance running shoe with premium cushioning.",
        attributes={"size": "42", "color": "Navy"},
        requiredAttributes=["size", "color"],
        syncStatus="pending"
    )

    result = await adapter.sync_product(product, operation="update description")

    assert result.status == "success"
    assert result.product_id == "p-mock-1"
    assert "Mock" in result.operation
    assert "synced successfully in mock mode" in result.message

@pytest.mark.asyncio
async def test_mock_adapter_connectivity():
    adapter = MockWooCommerceAdapter()
    info = await adapter.test_connection()

    assert info["status"] == "connected"
    assert info["mode"] == "mock"
    assert "No credentials required" in info["message"]

@pytest.mark.asyncio
async def test_real_adapter_does_not_leak_secrets_on_failure():
    # Test that even if WooCommerce API fails, secret keys are never exposed in the message
    fake_key = "ck_topsecret12345"
    fake_secret = "cs_supersecret67890"

    adapter = RealWooCommerceAdapter(
        base_url="https://invalid-wc-store-test.local",
        consumer_key=fake_key,
        consumer_secret=fake_secret
    )

    product = Product(
        id="p-secret-1",
        name="Secret Product",
        sku="SEC-002",
        category="Electronics",
        price=99.0,
        description="Test",
        attributes={},
        requiredAttributes=[],
        syncStatus="pending"
    )

    result = await adapter.sync_product(product, operation="update")
    assert result.status == "failed"
    # Ensure neither key nor secret appears in the sync result message
    assert fake_key not in result.message
    assert fake_secret not in result.message
