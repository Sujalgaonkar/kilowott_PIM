from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import logging
import httpx
from datetime import datetime, timezone
from ..models.pim import Product, SyncResult, utc_now_iso
from ..config import settings

logger = logging.getLogger("pim.woocommerce")

class WooCommerceAdapter(ABC):
    @abstractmethod
    async def sync_product(self, product: Product, operation: str = "update") -> SyncResult:
        """Synchronize an approved product update to WooCommerce."""
        pass

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """Verify WooCommerce API connectivity."""
        pass

class MockWooCommerceAdapter(WooCommerceAdapter):
    """
    Default mock adapter that simulates WooCommerce REST API synchronization.
    Allows complete end-to-end demonstrations without WooCommerce credentials.
    """
    def __init__(self):
        self._seq = 100

    def _next_id(self) -> str:
        self._seq += 1
        return f"s-{self._seq}"

    async def sync_product(self, product: Product, operation: str = "update") -> SyncResult:
        logger.info(f"[MOCK WOOCOMMERCE] Syncing product ID={product.id} (SKU={product.sku}, Name={product.name}) - Op: {operation}")
        # In mock mode, we simulate a successful sync
        return SyncResult(
            id=self._next_id(),
            productId=product.id,
            productName=product.name,
            operation=f"{operation} (Mock)",
            status="success",
            message=f"Product '{product.name}' (SKU: {product.sku}) synced successfully in mock mode. Attributes: {len(product.attributes)} updated.",
            timestamp=utc_now_iso(),
        )

    async def test_connection(self) -> Dict[str, Any]:
        return {
            "status": "connected",
            "mode": "mock",
            "message": "Running in mock WooCommerce adapter mode. No credentials required.",
        }

class RealWooCommerceAdapter(WooCommerceAdapter):
    """
    Production adapter calling WooCommerce REST API v3 via HTTPS.
    Credentials are never exposed to the client or returned in API responses.
    """
    def __init__(self, base_url: str, consumer_key: str, consumer_secret: str):
        self.base_url = base_url.rstrip("/")
        self.consumer_key = consumer_key
        self.consumer_secret = consumer_secret
        self._seq = 500

    def _next_id(self) -> str:
        self._seq += 1
        return f"s-real-{self._seq}"

    async def sync_product(self, product: Product, operation: str = "update") -> SyncResult:
        url = f"{self.base_url}/wp-json/wc/v3/products"
        auth = (self.consumer_key, self.consumer_secret)

        # Build payload according to WooCommerce REST API format
        payload = {
            "name": product.name,
            "sku": product.sku,
            "regular_price": str(product.price),
            "description": product.description,
            "attributes": [
                {
                    "name": k,
                    "visible": True,
                    "options": [str(v)] if v else [],
                }
                for k, v in product.attributes.items()
                if v is not None
            ],
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Find product by SKU first if operation is update
                search_res = await client.get(url, params={"sku": product.sku}, auth=auth)
                search_res.raise_for_status()
                existing = search_res.json()

                if existing and len(existing) > 0:
                    wc_id = existing[0]["id"]
                    put_res = await client.put(f"{url}/{wc_id}", json=payload, auth=auth)
                    put_res.raise_for_status()
                    logger.info(f"[REAL WOOCOMMERCE] Successfully updated product {wc_id} (SKU: {product.sku})")
                    return SyncResult(
                        id=self._next_id(),
                        productId=product.id,
                        productName=product.name,
                        operation=f"update (WooCommerce #{wc_id})",
                        status="success",
                        message=f"Updated remote product #{wc_id} in WooCommerce store.",
                        timestamp=utc_now_iso(),
                    )
                else:
                    post_res = await client.post(url, json=payload, auth=auth)
                    post_res.raise_for_status()
                    new_item = post_res.json()
                    wc_id = new_item.get("id", "new")
                    logger.info(f"[REAL WOOCOMMERCE] Successfully created product {wc_id} (SKU: {product.sku})")
                    return SyncResult(
                        id=self._next_id(),
                        productId=product.id,
                        productName=product.name,
                        operation=f"create (WooCommerce #{wc_id})",
                        status="success",
                        message=f"Created product #{wc_id} in WooCommerce store.",
                        timestamp=utc_now_iso(),
                    )
        except Exception as e:
            logger.error(f"[REAL WOOCOMMERCE] Sync failed for product {product.id}: {str(e)}")
            # Redact secrets from error message
            safe_msg = str(e).replace(self.consumer_key, "***").replace(self.consumer_secret, "***")
            return SyncResult(
                id=self._next_id(),
                productId=product.id,
                productName=product.name,
                operation=f"{operation} (WooCommerce)",
                status="failed",
                message=f"WooCommerce API error: {safe_msg}",
                timestamp=utc_now_iso(),
            )

    async def test_connection(self) -> Dict[str, Any]:
        url = f"{self.base_url}/wp-json/wc/v3/system_status"
        auth = (self.consumer_key, self.consumer_secret)
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url, auth=auth)
                res.raise_for_status()
                return {
                    "status": "connected",
                    "mode": "real",
                    "message": "Connected to WooCommerce REST API.",
                }
        except Exception as e:
            return {
                "status": "error",
                "mode": "real",
                "message": f"Connection failed: {str(e)}",
            }

def get_woocommerce_adapter() -> WooCommerceAdapter:
    if settings.is_real_wc_configured:
        return RealWooCommerceAdapter(
            base_url=settings.wc_url,
            consumer_key=settings.wc_consumer_key,
            consumer_secret=settings.wc_consumer_secret,
        )
    return MockWooCommerceAdapter()
