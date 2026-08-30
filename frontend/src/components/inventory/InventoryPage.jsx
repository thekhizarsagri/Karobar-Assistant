import { useEffect, useMemo, useState } from "react";
import StockModal from "../dashboard/StockModal";
import { getProductColor } from "../analytics/constants";
import { formatCompact } from "../../utils/formatNumber";
import InventoryTable from "./InventoryTable";
import InventoryMovements from "./InventoryMovements";
import { STATUS_META } from "./inventoryConstants";

function fmt(value, fractionDigits = 0) {
  const num = Number(value || 0);
  if (Math.abs(num) >= 1_000_000) {
    return formatCompact(num, fractionDigits > 0 ? 1 : 0);
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function InventoryPage({ products, onSubmit }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [initialProduct, setInitialProduct] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/inventory")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, products]);

  const summary = useMemo(() => data?.summary || {}, [data]);
  const items = useMemo(() => data?.items || [], [data]);
  const movements = useMemo(() => data?.movements || [], [data]);
  const categories = useMemo(() => data?.categories || [], [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q)
      );
    });
  }, [items, query, statusFilter, categoryFilter]);

  const attentionItems = items.filter((item) => item.status !== "ok");

  const categoryChart = useMemo(
    () =>
      categories.map((cat, index) => ({
        label: cat.category,
        value: cat.retail_value,
        color: getProductColor(index),
      })),
    [categories]
  );

  const openAdd = (productName = "") => {
    setInitialProduct(productName);
    setModalOpen(true);
  };

  const handleSubmit = (payload) => {
    setModalOpen(false);
    onSubmit(payload);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="inventory-page">
      <div className="analytics-header">
        <div className="analytics-title-block">
          <h1 className="analytics-title">Inventory</h1>
          <p className="analytics-subtitle">
            Detailed stock overview, valuation, and replenishment suggestions
          </p>
        </div>
        <button type="button" className="add-stock-btn" onClick={() => openAdd()}>
          <span className="add-stock-icon">+</span> Add stock
        </button>
      </div>

      {/* Summary stat cards */}
      <div className="inv-stats">
        <div className="inv-stat">
          <span className="inv-stat-value">{fmt(summary.total_units)}</span>
          <span className="inv-stat-label">Total units in stock</span>
        </div>
        <div className="inv-stat">
          <span className="inv-stat-value">{fmt(summary.total_cost_value, 2)}</span>
          <span className="inv-stat-label">Stock value (cost)</span>
        </div>
        <div className="inv-stat">
          <span className="inv-stat-value">{fmt(summary.total_retail_value, 2)}</span>
          <span className="inv-stat-label">Stock value (retail)</span>
        </div>
        <div className="inv-stat">
          <span className="inv-stat-value inv-stat-value--profit">
            {fmt(summary.potential_profit, 2)}
          </span>
          <span className="inv-stat-label">Potential profit</span>
        </div>
      </div>

      {/* Health strip */}
      <div className="inv-health-strip">
        <span className="inv-health-chip inv-health-chip--ok">
          {fmt(summary.healthy)} healthy
        </span>
        <span className="inv-health-chip inv-health-chip--reorder">
          {fmt(summary.needs_reorder)} need reorder
        </span>
        <span className="inv-health-chip inv-health-chip--out">
          {fmt(summary.out_of_stock)} out of stock
        </span>
      </div>

      {loading ? (
        <div className="inv-loading">Loading inventory…</div>
      ) : items.length === 0 ? (
        <div className="automation-empty">
          <p>No products yet.</p>
          <p>Add products in the setup form to start tracking your inventory.</p>
        </div>
      ) : (
        <>
          {/* Needs attention */}
          {attentionItems.length > 0 && (
            <section className="inv-section">
              <h2 className="inv-section-title">Needs attention</h2>
              <div className="inv-attention-grid">
                {attentionItems.map((item) => {
                  const meta = STATUS_META[item.status] || STATUS_META.ok;
                  return (
                    <div key={item.name} className="inv-attention-card">
                      <div className="inv-attention-head">
                        <span className="inv-attention-name">{item.name}</span>
                        <span className={`inv-status ${meta.className}`}>{meta.label}</span>
                      </div>
                      <div className="inv-attention-row">
                        <span>In stock</span>
                        <strong>{fmt(item.stock)} units</strong>
                      </div>
                      {item.suggested_reorder > 0 && (
                        <div className="inv-attention-row">
                          <span>Suggested order</span>
                          <strong>{fmt(item.suggested_reorder)} units</strong>
                        </div>
                      )}
                      <button
                        type="button"
                        className="inv-restock-btn"
                        onClick={() => openAdd(item.name)}
                      >
                        + Restock {item.name}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Detailed table */}
          <InventoryTable
            filtered={filtered}
            categories={categories}
            query={query}
            setQuery={setQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            onRestock={openAdd}
          />

          {/* Breakdown + movements */}
          <InventoryMovements
            categoryChart={categoryChart}
            summary={summary}
            movements={movements}
          />
        </>
      )}

      <StockModal
        products={products}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialProduct={initialProduct}
      />
    </div>
  );
}

export default InventoryPage;
