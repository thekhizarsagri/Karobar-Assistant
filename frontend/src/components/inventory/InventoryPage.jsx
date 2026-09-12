import { useEffect, useMemo, useState } from "react";
import StockModal from "../dashboard/StockModal";
import { formatFull, formatNumber as fmt } from "../../utils/formatNumber";
import InventoryTable from "./InventoryTable";
import { STATUS_META } from "./inventoryConstants";

function statFontSize(text) {
  const len = String(text).length;
  if (len <= 6) return 22;
  if (len <= 9) return 20;
  if (len <= 12) return 18;
  if (len <= 15) return 16;
  return 14;
}

function formatUpdated(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const datePart = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} • ${timePart}`;
}

function AttentionCard({ item, onRestock }) {
  const meta = STATUS_META[item.status] || STATUS_META.ok;

  return (
    <div className="inv-attention-card">
      <div className="inv-attention-top">
        <span className="inv-attention-meta">
          <span className="inv-attention-name">{item.name}</span>
          <span className="inv-attention-cat">{item.category || "Uncategorized"}</span>
        </span>
        <span className="inv-attention-badges">
          <span className={`inv-pill ${meta.className}`}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2 1 21h22L12 2zm0 6 7 12H5l7-12zm-1 4v4h2v-4h-2zm0 5v2h2v-2h-2z" />
            </svg>
            {meta.label}
          </span>
        </span>
      </div>

      <div className="inv-attention-stock">
        <span className="inv-attention-stock-label">In stock</span>
        <span className="inv-attention-stock-val">{fmt(item.stock)} units</span>
      </div>

      <div className="inv-attention-actions">
        <button
          type="button"
          className="inv-restock-btn"
          onClick={() => onRestock(item.name)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="21" r="1.6" />
            <circle cx="19" cy="21" r="1.6" />
            <path d="M2.5 3h2l2.6 12.5a1.5 1.5 0 0 0 1.5 1.2h8.9a1.5 1.5 0 0 0 1.5-1.2L21.5 7H6" />
          </svg>
          + Restock {item.name}
        </button>
      </div>
    </div>
  );
}

function InventoryPage({ products, onSubmit }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortDir, setSortDir] = useState("asc");
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
  const categories = useMemo(() => data?.categories || [], [data]);
  const generatedAt = data?.generated_at || "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q)
      );
    });
    out.sort((a, b) =>
      sortDir === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
    return out;
  }, [items, query, statusFilter, categoryFilter, sortDir]);

  const attentionItems = useMemo(
    () => items.filter((item) => item.status !== "ok"),
    [items]
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

  const healthy = Number(summary.healthy || 0);
  const needReorder = Number(summary.needs_reorder || 0);
  const outOfStock = Number(summary.out_of_stock || 0);

  const unitsText = formatFull(summary.total_units ?? 0);
  const costText = `₹${formatFull(summary.total_cost_value ?? 0, 2)}`;
  const retailText = `₹${formatFull(summary.total_retail_value ?? 0, 2)}`;
  const profitText = `₹${formatFull(summary.potential_profit ?? 0, 2)}`;

  return (
    <div className="inventory-page">
      {/* Header */}
      <div className="inv-page-head">
        <div className="inv-head-left">
          <span className="inv-head-icon" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0d9d7a" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
              <path d="M3 8l9 5 9-5" />
              <path d="M12 13v8" />
            </svg>
          </span>
          <span className="inv-head-text">
            <h1 className="inv-title">Inventory</h1>
            <p className="inv-subtitle">
              Detailed stock overview, valuation, and replenishment suggestions
            </p>
          </span>
        </div>
        <div className="inv-head-right">
          <span className="inv-updated">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="17" rx="2.5" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span>
              <span className="inv-updated-label">Last updated</span>
              <span className="inv-updated-value">{formatUpdated(generatedAt)}</span>
            </span>
          </span>
          <button type="button" className="inv-add-btn" onClick={() => openAdd()}>
            <span aria-hidden="true">+</span> Add Stock
          </button>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="inv-stats">
        <div className="inv-stat">
          <span className="inv-stat-icon inv-stat-icon--blue" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2f80ed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
              <path d="M3 8l9 5 9-5M12 13v8" />
            </svg>
          </span>
          <span className="inv-stat-body">
            <strong className="inv-stat-value" style={{ fontSize: statFontSize(unitsText) }}>{unitsText}</strong>
            <span className="inv-stat-label">Total units in stock</span>
            <span className="inv-stat-sub">Across all products</span>
          </span>
        </div>

        <div className="inv-stat">
          <span className="inv-stat-icon inv-stat-icon--green" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9d7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v10M15 9.5c0-1-1.3-1.8-3-1.8s-3 .8-3 1.8 1 1.5 3 1.8 3 .8 3 1.9-1.3 1.8-3 1.8-3-.8-3-1.8" />
            </svg>
          </span>
          <span className="inv-stat-body">
            <strong className="inv-stat-value" style={{ fontSize: statFontSize(costText) }}>{costText}</strong>
            <span className="inv-stat-label">Stock value (cost)</span>
            <span className="inv-stat-sub">Total cost of current stock</span>
          </span>
        </div>

        <div className="inv-stat">
          <span className="inv-stat-icon inv-stat-icon--tag" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2f80ed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.6 13.4 12 22 2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" />
              <circle cx="7.5" cy="7.5" r="1.4" fill="#2f80ed" stroke="none" />
            </svg>
          </span>
          <span className="inv-stat-body">
            <strong className="inv-stat-value" style={{ fontSize: statFontSize(retailText) }}>{retailText}</strong>
            <span className="inv-stat-label">Stock value (retail)</span>
            <span className="inv-stat-sub">Estimated retail value</span>
          </span>
        </div>

        <div className="inv-stat">
          <span className="inv-stat-icon inv-stat-icon--trend" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9d7a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l6-6 4 4 8-8" />
              <path d="M15 7h6v6" />
            </svg>
          </span>
          <span className="inv-stat-body">
            <strong className="inv-stat-value" style={{ fontSize: statFontSize(profitText) }}>{profitText}</strong>
            <span className="inv-stat-label">Potential profit</span>
            <span className="inv-stat-sub">From current stock</span>
          </span>
        </div>
      </div>

      {/* Health strip */}
      <div className="inv-health-strip">
        <span className="inv-health-chip inv-health-chip--ok">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 14.2-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z" />
          </svg>
          {fmt(healthy)} healthy
        </span>
        <span className="inv-health-chip inv-health-chip--reorder">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2 1 21h22L12 2zm0 6 7 12H5l7-12zm-1 4v4h2v-4h-2zm0 5v2h2v-2h-2z" />
          </svg>
          {fmt(needReorder)} need reorder
        </span>
        <span className="inv-health-chip inv-health-chip--out">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2 1 21h22L12 2zm0 6 7 12H5l7-12zm-1 4v4h2v-4h-2zm0 5v2h2v-2h-2z" />
          </svg>
          {fmt(outOfStock)} out of stock
        </span>
      </div>

      {loading ? (
        <div className="inv-loading">Loading inventory…</div>
      ) : items.length === 0 ? (
        <div className="inv-empty">
          <p className="inv-empty-title">No products yet.</p>
          <p className="inv-empty-sub">Add products in the setup form to start tracking your inventory.</p>
          <button type="button" className="inv-add-btn" onClick={() => openAdd()}>
            <span aria-hidden="true">+</span> Add Stock
          </button>
        </div>
      ) : (
        <>
          {attentionItems.length > 0 && (
            <section className="inv-section inv-attention-section">
              <div className="inv-section-head">
                <span className="inv-section-icon inv-section-icon--alert" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" fill="#fee2e2" stroke="#fca5a5" />
                    <path d="M12 7v6" stroke="#dc2626" />
                    <circle cx="12" cy="16" r="1.2" fill="#dc2626" stroke="none" />
                  </svg>
                </span>
                <span className="inv-section-titles">
                  <h2 className="inv-section-title">Needs attention</h2>
                  <p className="inv-section-sub">Products that are out of stock or need to be reordered.</p>
                </span>
              </div>
              <div className="inv-attention-grid">
                {attentionItems.map((item) => (
                  <AttentionCard key={item.name} item={item} onRestock={openAdd} />
                ))}
              </div>
            </section>
          )}

          <div>
            <InventoryTable
              filtered={filtered}
              categories={categories}
              query={query}
              setQuery={setQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              sortDir={sortDir}
              setSortDir={setSortDir}
              onRestock={openAdd}
            />
          </div>
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
