export const productCategories = [
  "Packaging Materials",
  "Food & Beverages",
  "Clothing & Apparel",
  "Electronics & Gadgets",
  "Furniture & Home Décor",
  "Beauty & Personal Care",
  "Sports & Fitness",
  "Books & Stationery",
  "Toys & Games",
  "Hardware & Tools",
  "Health & Pharmacy",
  "Industrial Equipment",
  "Raw Materials",
  "Other",
];

export const productUnits = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "box", label: "Boxes (box)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "l", label: "Litres (L)" },
  { value: "ml", label: "Millilitres (ml)" },
  { value: "pack", label: "Packs (pk)" },
  { value: "dz", label: "Dozens (dz)" },
  { value: "meter", label: "Meters (m)" },
  { value: "set", label: "Sets (set)" },
  { value: "pair", label: "Pairs (pr)" },
];

export const currencies = [
  { code: "INR", symbol: "₹", name: "Indian Rupee (₹)" },
  { code: "USD", symbol: "$", name: "US Dollar ($)" },
  { code: "EUR", symbol: "€", name: "Euro (€)" },
  { code: "GBP", symbol: "£", name: "British Pound (£)" },
  { code: "AED", symbol: "AED ", name: "UAE Dirham (AED)" },
  { code: "PKR", symbol: "Rs ", name: "Pakistani Rupee (Rs)" },
  { code: "CAD", symbol: "CA$ ", name: "Canadian Dollar (CA$)" },
  { code: "SAR", symbol: "SAR ", name: "Saudi Riyal (SAR)" },
];

export const businessTypes = [
  "Manufacturing",
  "Retail Store",
  "Wholesale & Distribution",
  "E-Commerce & Online Store",
  "Services & Consulting",
  "Restaurant & Cafe",
  "Tech & Digital Agency",
  "Pharmacy & Healthcare",
  "Construction & Hardware",
  "Other",
];

export const sampleProductsList = [
  {
    name: "Glass Bottle 500ml",
    category: "Packaging Materials",
    sku: "KB-GLB-01",
    sellingPrice: "120",
    costPrice: "70",
    stockAvailable: "150",
    unit: "pcs",
    reorderPoint: "25",
    description: "Premium reusable amber glass bottles for retail packaging.",
  },
  {
    name: "Kraft Paper Box (M)",
    category: "Packaging Materials",
    sku: "KB-KPB-02",
    sellingPrice: "45",
    costPrice: "22",
    stockAvailable: "300",
    unit: "box",
    reorderPoint: "50",
    description: "Eco-friendly corrugated craft packaging boxes.",
  },
  {
    name: "Organic Green Tea 250g",
    category: "Food & Beverages",
    sku: "KB-TEA-03",
    sellingPrice: "280",
    costPrice: "150",
    stockAvailable: "80",
    unit: "pack",
    reorderPoint: "15",
    description: "Farm-sourced loose leaf green tea with antioxidant rich blend.",
  },
  {
    name: "Wireless Charging Pad",
    category: "Electronics & Gadgets",
    sku: "KB-WCP-04",
    sellingPrice: "899",
    costPrice: "420",
    stockAvailable: "45",
    unit: "pcs",
    reorderPoint: "10",
    description: "15W Fast Qi wireless charger with aluminum body.",
  },
];

export const defaultProduct = {
  name: "Glass Bottle 500ml",
  category: "Packaging Materials",
  sku: "KB-GLB-01",
  sellingPrice: "120",
  costPrice: "70",
  stockAvailable: "150",
  unit: "pcs",
  reorderPoint: "25",
  description: "Standard reusable 500ml glass bottle for beverage and cosmetic packaging.",
};

export const fixedExpenseItems = [
  { key: "rent", label: "Office / Factory Rent", amount: "18000" },
  { key: "electricity", label: "Electricity & Utilities", amount: "7200" },
  { key: "labour", label: "Staff & Labour Payroll", amount: "22000" },
  { key: "internet", label: "Internet & Cloud Software", amount: "2500" },
  { key: "transportation", label: "Logistics & Transport", amount: "8500" },
  { key: "marketing", label: "Marketing & Advertising", amount: "6500" },
  { key: "other", label: "Miscellaneous Expenses", amount: "3000" },
];