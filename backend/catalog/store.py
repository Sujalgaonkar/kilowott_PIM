from typing import List, Optional, Dict
import copy
from datetime import datetime, timezone, timedelta
from ..models.pim import (
    Product,
    AuditFinding,
    ProposedChange,
    AgentRun,
    AgentEvent,
    SyncResult,
    DashboardStats,
    utc_now_iso,
)

def days_ago_iso(days: int) -> str:
    dt = datetime.now(timezone.utc) - timedelta(days=days)
    return dt.isoformat()

INITIAL_PRODUCTS: List[dict] = [
    {
        "id": "p1",
        "name": "Aurora Merino Crew Sweater",
        "sku": "APP-MER-001",
        "category": "Apparel",
        "price": 89.0,
        "description": "A lightweight crew-neck sweater knit from 100% extra-fine merino wool. Breathable, temperature-regulating and soft enough to wear directly against the skin.",
        "attributes": {
            "material": "Merino wool",
            "color": "Charcoal",
            "size": "S–XL",
            "care": "Hand wash cold",
            "weight": "280 g",
        },
        "requiredAttributes": ["material", "color", "size", "care", "weight"],
        "syncStatus": "synced",
        "updatedAt": days_ago_iso(2),
    },
    {
        "id": "p2",
        "name": "Trailhead 28L Hiking Backpack",
        "sku": "OUT-BAG-028",
        "category": "Outdoor",
        "price": 129.0,
        "description": "Durable daypack.",
        "attributes": {
            "material": "Ripstop nylon",
            "color": "Olive",
            "capacity": "28 L",
            "weight": None,
            "waterproof": None,
        },
        "requiredAttributes": ["material", "color", "capacity", "weight", "waterproof"],
        "syncStatus": "pending",
        "updatedAt": days_ago_iso(1),
    },
    {
        "id": "p3",
        "name": "Lumen Smart LED Desk Lamp",
        "sku": "HOM-LMP-104",
        "category": "Home",
        "price": 64.0,
        "description": "",
        "attributes": {
            "color": "Matte white",
            "wattage": "9 W",
            "connectivity": None,
            "dimensions": None,
            "warranty": "2 years",
        },
        "requiredAttributes": ["color", "wattage", "connectivity", "dimensions", "warranty"],
        "syncStatus": "never",
        "updatedAt": days_ago_iso(5),
    },
    {
        "id": "p4",
        "name": "Pulse ANC Wireless Earbuds",
        "sku": "ELE-AUD-220",
        "category": "Electronics",
        "price": 149.0,
        "description": "True wireless earbuds with hybrid active noise cancellation, 30-hour total battery life with case, and IPX4 sweat resistance for workouts.",
        "attributes": {
            "color": "Black",
            "battery": "30 h",
            "connectivity": "Bluetooth 5.3",
            "waterproof": "IPX4",
            "warranty": None,
        },
        "requiredAttributes": ["color", "battery", "connectivity", "waterproof", "warranty"],
        "syncStatus": "failed",
        "updatedAt": days_ago_iso(3),
    },
    {
        "id": "p5",
        "name": "Kyoto Ceramic Pour-Over Set",
        "sku": "KIT-COF-012",
        "category": "Kitchen",
        "price": 48.0,
        "description": "",
        "attributes": {
            "material": "Stoneware",
            "color": None,
            "capacity": "600 ml",
            "dimensions": None,
            "care": None,
        },
        "requiredAttributes": ["material", "color", "capacity", "dimensions", "care"],
        "syncStatus": "never",
        "updatedAt": days_ago_iso(9),
    },
    {
        "id": "p6",
        "name": "Stride Running Shoe v3",
        "sku": "FTW-RUN-303",
        "category": "Footwear",
        "price": 119.0,
        "description": "Responsive running shoe for daily miles.",
        "attributes": {
            "material": "Engineered mesh",
            "color": "Coral",
            "size": "36–46",
            "weight": "245 g",
            "drop": None,
        },
        "requiredAttributes": ["material", "color", "size", "weight", "drop"],
        "syncStatus": "synced",
        "updatedAt": days_ago_iso(4),
    },
    {
        "id": "p7",
        "name": "Nordic Oak Cutting Board",
        "sku": "KIT-BRD-007",
        "category": "Kitchen",
        "price": 39.0,
        "description": "Solid European oak cutting board, oiled with food-safe mineral oil. Reversible with a juice groove on one side and a flat serving surface on the other.",
        "attributes": {
            "material": "Oak",
            "color": "Natural",
            "dimensions": "40 × 28 × 2 cm",
            "care": "Hand wash, oil monthly",
            "weight": "1.4 kg",
        },
        "requiredAttributes": ["material", "color", "dimensions", "care", "weight"],
        "syncStatus": "synced",
        "updatedAt": days_ago_iso(12),
    },
    {
        "id": "p8",
        "name": "Volt 65W GaN Charger",
        "sku": "ELE-CHG-065",
        "category": "Electronics",
        "price": 45.0,
        "description": "",
        "attributes": {
            "color": "White",
            "wattage": "65 W",
            "connectivity": "2× USB-C, 1× USB-A",
            "dimensions": None,
            "warranty": None,
        },
        "requiredAttributes": ["color", "wattage", "connectivity", "dimensions", "warranty"],
        "syncStatus": "pending",
        "updatedAt": days_ago_iso(0),
    },
]

INITIAL_SYNC: List[dict] = [
    {"id": "s1", "productId": "p1", "productName": "Aurora Merino Crew Sweater", "operation": "update", "status": "success", "message": "Synced to WooCommerce successfully", "timestamp": days_ago_iso(2)},
    {"id": "s2", "productId": "p4", "productName": "Pulse ANC Wireless Earbuds", "operation": "update", "status": "failed", "message": "Mock record: 401 invalid consumer key", "timestamp": days_ago_iso(3)},
    {"id": "s3", "productId": "p7", "productName": "Nordic Oak Cutting Board", "operation": "create", "status": "success", "message": "Product created in WooCommerce", "timestamp": days_ago_iso(12)},
    {"id": "s4", "productId": "p2", "productName": "Trailhead 28L Hiking Backpack", "operation": "update", "status": "pending", "message": "Awaiting scheduled sync", "timestamp": days_ago_iso(1)},
]

class CatalogStore:
    def __init__(self):
        self.products: Dict[str, Product] = {
            item["id"]: Product.model_validate(item) for item in INITIAL_PRODUCTS
        }
        self.proposals: Dict[str, ProposedChange] = {}
        self.runs: Dict[str, AgentRun] = {}
        self.sync_history: List[SyncResult] = [
            SyncResult.model_validate(s) for s in INITIAL_SYNC
        ]
        self._seq = 100

    def next_id(self, prefix: str) -> str:
        self._seq += 1
        return f"{prefix}{self._seq}"

    # Product methods
    def get_products(self) -> List[Product]:
        return list(self.products.values())

    def get_product(self, product_id: str) -> Optional[Product]:
        return self.products.get(product_id)

    def update_product(self, product: Product) -> Product:
        product.updated_at = utc_now_iso()
        self.products[product.id] = product
        return product

    # Finding audit methods
    def compute_findings(self, product_id: Optional[str] = None) -> List[AuditFinding]:
        target_products = [self.products[product_id]] if product_id and product_id in self.products else self.products.values()
        findings: List[AuditFinding] = []

        for p in target_products:
            desc = (p.description or "").strip()
            if not desc:
                findings.append(AuditFinding(
                    id=f"f-{p.id}-desc",
                    productId=p.id,
                    field="description",
                    severity="high",
                    message="Description is missing"
                ))
            elif len(desc) < 80:
                findings.append(AuditFinding(
                    id=f"f-{p.id}-desc",
                    productId=p.id,
                    field="description",
                    severity="medium",
                    message=f"Description is under 80 characters ({len(desc)} chars)"
                ))

            # Missing required attributes
            for req in p.required_attributes:
                val = p.attributes.get(req)
                if val is None or str(val).strip() == "":
                    findings.append(AuditFinding(
                        id=f"f-{p.id}-{req}",
                        productId=p.id,
                        field=req,
                        severity="medium",
                        message=f'Required attribute "{req}" is empty'
                    ))

        return findings

    # Proposal methods
    def get_proposals(self) -> List[ProposedChange]:
        return list(self.proposals.values())

    def get_proposal(self, proposal_id: str) -> Optional[ProposedChange]:
        return self.proposals.get(proposal_id)

    def add_proposal(self, proposal: ProposedChange) -> ProposedChange:
        self.proposals[proposal.id] = proposal
        return proposal

    def review_proposal(self, proposal_id: str, status: str, edited_value: Optional[str] = None) -> ProposedChange:
        if proposal_id not in self.proposals:
            raise KeyError(f"Proposal {proposal_id} not found")

        prop = self.proposals[proposal_id]
        prop.status = status
        if edited_value is not None:
            prop.proposed = edited_value

        return prop

    # Run methods
    def get_runs(self) -> List[AgentRun]:
        # Return newest first
        return sorted(list(self.runs.values()), key=lambda r: r.created_at, reverse=True)

    def get_run(self, run_id: str) -> Optional[AgentRun]:
        return self.runs.get(run_id)

    def create_run(self, task: str, simulated: bool = False) -> AgentRun:
        run_id = self.next_id("r")
        run = AgentRun(
            id=run_id,
            task=task,
            status="queued",
            createdAt=utc_now_iso(),
            simulated=simulated,
            events=[]
        )
        self.runs[run_id] = run
        return run

    def add_event(self, run_id: str, event: AgentEvent) -> None:
        if run_id in self.runs:
            self.runs[run_id].events.append(event)

    def update_run_status(self, run_id: str, status: str) -> None:
        if run_id in self.runs:
            self.runs[run_id].status = status

    # Sync history methods
    def get_sync_history(self) -> List[SyncResult]:
        return sorted(self.sync_history, key=lambda s: s.timestamp, reverse=True)

    def add_sync_result(self, result: SyncResult) -> SyncResult:
        self.sync_history.insert(0, result)
        return result

    # Dashboard stats
    def get_stats(self) -> DashboardStats:
        total = len(self.products)
        incomplete = 0
        for p in self.products.values():
            desc_bad = not p.description or len(p.description.strip()) < 80
            missing_attrs = any(p.attributes.get(r) is None or str(p.attributes.get(r)).strip() == "" for r in p.required_attributes)
            if desc_bad or missing_attrs:
                incomplete += 1

        needs_review = sum(1 for prop in self.proposals.values() if prop.status == "pending")
        successful_syncs = sum(1 for s in self.sync_history if s.status == "success")

        return DashboardStats(
            totalProducts=total,
            incompleteListings=incomplete,
            needsReview=needs_review,
            successfulSyncs=successful_syncs
        )

store = CatalogStore()
