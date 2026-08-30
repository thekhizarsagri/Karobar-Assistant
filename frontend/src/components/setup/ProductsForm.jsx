import { useState } from "react";
import { productCategories } from "./constants";
import ProductDraftForm from "./ProductDraftForm";
import ProductCatalogList from "./ProductCatalogList";

function ProductsForm({
  products,
  onChange,
  onAdd,
  onRemove,
  currency = "₹",
}) {
  const [draftProduct, setDraftProduct] = useState({
    name: "",
    category: productCategories[0],
    sku: "",
    sellingPrice: "",
    costPrice: "",
    stockAvailable: "",
    unit: "pcs",
    reorderPoint: "10",
  });

  const [filterQuery, setFilterQuery] = useState("");
  const [formError, setFormError] = useState("");

  const handleDraftChange = (field, value) => {
    if (field === "_error") {
      setFormError(value);
      return;
    }
    setDraftProduct((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError("");
  };

  const handleAdd = (newProd) => {
    onAdd(newProd);
    setDraftProduct({
      name: "",
      category: productCategories[0],
      sku: "",
      sellingPrice: "",
      costPrice: "",
      stockAvailable: "",
      unit: "pcs",
      reorderPoint: "10",
    });
    setFormError("");
  };

  const calculateMargin = (sell, cost) => {
    const s = Number(sell) || 0;
    const c = Number(cost) || 0;
    if (s <= 0) return { profit: 0, marginPercent: 0, status: "neutral" };
    const profit = s - c;
    const marginPercent = ((profit / s) * 100).toFixed(1);
    const status = profit > 0 ? (marginPercent >= 25 ? "good" : "fair") : "loss";
    return { profit, marginPercent, status };
  };

  const totalStockUnits = products.reduce(
    (acc, p) => acc + (Number(p.stockAvailable) || 0),
    0
  );

  const totalCatalogValue = products.reduce(
    (acc, p) => acc + (Number(p.sellingPrice) || 0) * (Number(p.stockAvailable) || 0),
    0
  );

  const filteredProducts = products.filter((p) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="setup-right-column">
      {/* Column Header */}
      <div className="column-header">
        <h2 className="column-title">Product Catalog & Stock Management</h2>
        <p className="column-subtitle">
          Add items, configure unit pricing, track profit margins, and manage initial inventory.
        </p>
      </div>

      {/* Live Metrics Row */}
      <div className="metrics-strip">
      </div>

      {/* Card 1: Add New Product Form */}
      <ProductDraftForm
        draftProduct={draftProduct}
        onDraftChange={handleDraftChange}
        onAdd={handleAdd}
        currency={currency}
        formError={formError}
      />

      {/* Card 2: Current Configured Product Catalog */}
      <ProductCatalogList
        products={products}
        filteredProducts={filteredProducts}
        filterQuery={filterQuery}
        onFilterChange={setFilterQuery}
        onRemove={onRemove}
        currency={currency}
        calculateMargin={calculateMargin}
      />
    </div>
  );
}

export default ProductsForm;
