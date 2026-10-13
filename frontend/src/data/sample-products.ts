import type { Product, SyncResult } from "@/types/pim";

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

export const sampleProducts: Product[] = [
  {
    id: "p1", name: "Aurora Merino Crew Sweater", sku: "APP-MER-001", category: "Apparel", price: 89,
    description: "A lightweight crew-neck sweater knit from 100% extra-fine merino wool. Breathable, temperature-regulating and soft enough to wear directly against the skin.",
    attributes: { material: "Merino wool", color: "Charcoal", size: "S–XL", care: "Hand wash cold", weight: "280 g" },
    requiredAttributes: ["material", "color", "size", "care", "weight"], syncStatus: "synced", updatedAt: d(2),
  },
  {
    id: "p2", name: "Trailhead 28L Hiking Backpack", sku: "OUT-BAG-028", category: "Outdoor", price: 129,
    description: "Durable daypack.",
    attributes: { material: "Ripstop nylon", color: "Olive", capacity: "28 L", weight: null, waterproof: null },
    requiredAttributes: ["material", "color", "capacity", "weight", "waterproof"], syncStatus: "pending", updatedAt: d(1),
  },
  {
    id: "p3", name: "Lumen Smart LED Desk Lamp", sku: "HOM-LMP-104", category: "Home", price: 64,
    description: "",
    attributes: { color: "Matte white", wattage: "9 W", connectivity: null, dimensions: null, warranty: "2 years" },
    requiredAttributes: ["color", "wattage", "connectivity", "dimensions", "warranty"], syncStatus: "never", updatedAt: d(5),
  },
  {
    id: "p4", name: "Pulse ANC Wireless Earbuds", sku: "ELE-AUD-220", category: "Electronics", price: 149,
    description: "True wireless earbuds with hybrid active noise cancellation, 30-hour total battery life with case, and IPX4 sweat resistance for workouts.",
    attributes: { color: "Black", battery: "30 h", connectivity: "Bluetooth 5.3", waterproof: "IPX4", warranty: null },
    requiredAttributes: ["color", "battery", "connectivity", "waterproof", "warranty"], syncStatus: "failed", updatedAt: d(3),
  },
  {
    id: "p5", name: "Kyoto Ceramic Pour-Over Set", sku: "KIT-COF-012", category: "Kitchen", price: 48,
    description: "",
    attributes: { material: "Stoneware", color: null, capacity: "600 ml", dimensions: null, care: null },
    requiredAttributes: ["material", "color", "capacity", "dimensions", "care"], syncStatus: "never", updatedAt: d(9),
  },
  {
    id: "p6", name: "Stride Running Shoe v3", sku: "FTW-RUN-303", category: "Footwear", price: 119,
    description: "Responsive running shoe for daily miles.",
    attributes: { material: "Engineered mesh", color: "Coral", size: "36–46", weight: "245 g", drop: null },
    requiredAttributes: ["material", "color", "size", "weight", "drop"], syncStatus: "synced", updatedAt: d(4),
  },
  {
    id: "p7", name: "Nordic Oak Cutting Board", sku: "KIT-BRD-007", category: "Kitchen", price: 39,
    description: "Solid European oak cutting board, oiled with food-safe mineral oil. Reversible with a juice groove on one side and a flat serving surface on the other.",
    attributes: { material: "Oak", color: "Natural", dimensions: "40 × 28 × 2 cm", care: "Hand wash, oil monthly", weight: "1.4 kg" },
    requiredAttributes: ["material", "color", "dimensions", "care", "weight"], syncStatus: "synced", updatedAt: d(12),
  },
  {
    id: "p8", name: "Volt 65W GaN Charger", sku: "ELE-CHG-065", category: "Electronics", price: 45,
    description: "",
    attributes: { color: "White", wattage: "65 W", connectivity: "2× USB-C, 1× USB-A", dimensions: null, warranty: null },
    requiredAttributes: ["color", "wattage", "connectivity", "dimensions", "warranty"], syncStatus: "pending", updatedAt: d(0),
  },
];

export const sampleSyncHistory: SyncResult[] = [
  { id: "s1", productId: "p1", productName: "Aurora Merino Crew Sweater", operation: "update", status: "success", message: "Sample record", timestamp: d(2) },
  { id: "s2", productId: "p4", productName: "Pulse ANC Wireless Earbuds", operation: "update", status: "failed", message: "Sample record: 401 invalid consumer key", timestamp: d(3) },
  { id: "s3", productId: "p7", productName: "Nordic Oak Cutting Board", operation: "create", status: "success", message: "Sample record", timestamp: d(12) },
  { id: "s4", productId: "p2", productName: "Trailhead 28L Hiking Backpack", operation: "update", status: "pending", message: "Sample record: awaiting backend", timestamp: d(1) },
];
