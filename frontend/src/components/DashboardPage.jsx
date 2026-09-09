import { useEffect, useState, useMemo, useRef } from "react";
import HistoryTab from "./dashboard/HistoryTab";
import AutomationPage from "./dashboard/AutomationPage";
import EditProfilePage from "./dashboard/EditProfilePage";
import SettingsPage from "./dashboard/SettingsPage";
import ProductHistoryDetail from "./dashboard/ProductHistoryDetail";
import RecordSalesTab from "./dashboard/RecordSalesTab";
import AdjustSalesTab from "./dashboard/AdjustSalesTab";
import Sidebar from "./dashboard/Sidebar";
import StatCards from "./dashboard/StatCards";
import StockModal from "./dashboard/StockModal";
import StockOverviewModal from "./dashboard/StockOverviewModal";
import MonthlyExpensesPage from "./dashboard/MonthlyExpensesPage";
import useStockAutomation from "./dashboard/useStockAutomation";
import useDashboardState from "./dashboard/useDashboardState";
import AnalyticsPage from "./analytics/AnalyticsPage";
import AiInsightsPage from "./analytics/AiInsightsPage";
import ForecastingPage from "./analytics/ForecastingPage";
import InventoryPage from "./inventory/InventoryPage";
import ReportsPage from "./reports/ReportsPage";
import NotificationBell from "./dashboard/NotificationBell";
import ModalPortal from "./dashboard/ModalPortal";
import { useTheme } from "../ThemeContext";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 18) return "Good Afternoon";
  if (hour >= 18 && hour < 22) return "Good Evening";
  return "Hello";
}

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function DateTimeChip() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const date = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return (
    <div className="dash-datetime" title={`${date} • ${time}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
      <span>{date}</span>
      <span className="dash-datetime-sep" />
      <strong>{time}</strong>
    </div>
  );
}

function TopBar({ onEditForm, onEditProfile, onLogout, ownerName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const menuAnchorRef = useRef(null);

  const initials = (ownerName || "AH").trim().split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase() || "AH";

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => {
      if (menuAnchorRef.current && !menuAnchorRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  return (
    <div className="topbar">
      <div className="topbar-right">
        <NotificationBell />
        <div className="profile-menu" ref={menuAnchorRef} style={{ position: 'relative' }}>
          <div className="topbar-user topbar-user--avatar-only" onClick={()=>setMenuOpen(v=>!v)} style={{ cursor: 'pointer' }}>
            <div className="topbar-avatar">{initials}</div>
          </div>
          {menuOpen && (
            <div className="profile-dropdown" style={{ right: 0, top: 'calc(100% + 10px)', position: 'absolute' }}>
              <button type="button" className="profile-menu-item" onClick={()=>{setMenuOpen(false); onEditProfile?.();}}>Edit profile</button>
              <button type="button" className="profile-menu-item" onClick={()=>{setMenuOpen(false); setShowEditConfirm(true);}}>Edit form</button>
              <button type="button" className="profile-menu-item" onClick={()=>{setMenuOpen(false); onLogout?.();}}>Logout</button>
            </div>
          )}
        </div>
      </div>
      {showEditConfirm && (
        <ModalPortal>
          <div className="stock-modal-backdrop">
            <div className="stock-modal confirm-modal">
              <div className="stock-modal-header">
                <div><h2>Edit Form</h2><p className="stock-modal-subtitle">This action cannot be undone.</p></div>
                <button type="button" className="stock-modal-close" onClick={()=>setShowEditConfirm(false)}>×</button>
              </div>
              <div className="confirm-modal-body">
                <p>Editing the form will <strong>reset all your data</strong> including sales history, stock, analytics, and expenses. You will start fresh with a new setup form.</p>
                <p>Are you sure you want to continue?</p>
              </div>
              <div className="stock-modal-actions">
                <button type="button" className="confirm-cancel-btn" onClick={()=>setShowEditConfirm(false)}>Cancel</button>
                <button type="button" className="confirm-delete-btn" onClick={()=>{setShowEditConfirm(false); onEditForm?.();}}>Yes, Edit Form</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}



function SalesOverviewCard({ analytics }) {
  // Jan - Dec only, like sales analytics graphs
  const chartData = useMemo(() => {
    const monthly = analytics?.monthly || {};
    const now = new Date();
    const currentYear = now.getFullYear();
    // Try to detect year with data; fallback to current year
    const years = Object.keys(monthly).map(k => parseInt(k.split('-')[0], 10)).filter(Boolean);
    const targetYear = years.length ? Math.max(...years) : currentYear;
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return monthNames.map((label, idx) => {
      const key = `${targetYear}-${String(idx+1).padStart(2,'0')}`;
      const total = monthly[key] ? Object.values(monthly[key]).reduce((a,b)=>a+b,0) : 0;
      return { label, value: total };
    });
  }, [analytics]);

  const maxVal = Math.max(10, ...chartData.map(d=>d.value));
  const { dark } = useTheme();
  const axisLine = dark ? "#1e2d45" : "#f1f5f9";
  const emptyBar = dark ? "#1e2d45" : "#d1fae5";

  return (
    <div className="dash-card" style={{ flex: 1 }}>
      <div className="dash-card-header">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="dash-card-title-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <div>
            <div className="dash-card-title">Sales Overview</div>
            <div className="dash-card-subtitle">Monthly sales — Jan to Dec</div>
          </div>
        </div>
      </div>
      <div className="sales-overview-body">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
          {/* Chart area */}
          <div style={{ display: 'flex', flex: 1, gap: 0 }}>
            {/* Y axis */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '8px 8px 28px 0', fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
              <span>₹100k</span><span>₹75k</span><span>₹50k</span><span>₹25k</span><span>₹0</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ flex: 1, borderLeft: `1px solid ${axisLine}`, borderBottom: `1px solid ${axisLine}`, display: 'flex', alignItems: 'end', gap: 10, padding: '10px 8px 0 8px', position: 'relative' }}>
                {/* grid lines */}
                <div style={{ position: 'absolute', inset: '10px 8px 0 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                  {[0,1,2,3,4].map(i=> <div key={i} style={{ height: 1, background: 'var(--grid-line, #f1f5f9)' }} />)}
                </div>
                {chartData.map((d, idx) => {
                  const h = maxVal ? (d.value / maxVal) * 120 : 6;
                  const placeholderH = 10 + (idx % 4) * 3 + (idx % 2) * 2;
                  const barH = d.value===0 ? placeholderH : Math.max(14, h);
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 1 }}>
                      <div title={`${d.label}: ${d.value}`} style={{ width: '68%', maxWidth: 34, height: barH, background: d.value===0 ? emptyBar : '#10b981', borderRadius: '6px 6px 2px 2px', opacity: d.value===0?0.9:1, transition: 'height 0.5s cubic-bezier(0.16,1,0.3,1), background-color 0.3s ease', animation: `barGrow 0.62s cubic-bezier(0.16,1,0.3,1) ${idx*70}ms both`, transformOrigin: 'bottom' }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 10, padding: '0 8px', color: '#94a3b8', fontSize: 11, fontWeight: 600 }}>
                {chartData.map((d, idx)=> <div key={idx} style={{ flex: 1, textAlign: 'center' }}>{d.label}</div>)}
              </div>
            </div>
          </div>
          <div className="sales-legend">
            <span className="sales-legend-item"><span className="sales-legend-dot sales-legend-dot--sales" /> Sales</span>
            <span className="sales-legend-item"><span className="sales-legend-dot sales-legend-dot--profit" /> Profit</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertsCardProper() {
  const [items, setItems] = useState([]);
  const [clearing, setClearing] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        // filter out steady info, keep only real alerts, take latest 4 (newest first), FIFO oldest dropped
        const filtered = (data || []).filter(a => {
          const msg = String(a.message||'').toLowerCase();
          if (msg.includes('steady') || msg.includes('no urgent')) return false;
          return true;
        });
        setItems(filtered.slice(0, 4));
      }
    } catch {}
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 12000);
    const h = () => load();
    window.addEventListener('alerts:updated', h);
    return () => { clearInterval(id); window.removeEventListener('alerts:updated', h); };
  }, []);

  const handleClear = async () => {
    setClearing(true);
    try { await fetch('/api/alerts/clear', { method: 'POST' }); setItems([]); window.dispatchEvent(new CustomEvent('alerts:updated')); } catch {}
    setClearing(false);
  };

  const getIcon = (type) => {
    if ((type||'').includes('stock')) return 'warn';
    if ((type||'').includes('profit')) return 'profit';
    return 'info';
  };

  return (
    <div className="dash-card alerts-proper-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="dash-card-header">
        <div className="dash-card-title" style={{ gap: 8 }}>
          <span className="alerts-title-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </span>
          Alerts
          {items.length > 0 && <span style={{ background:'#fef3c7', color:'#92400e', fontSize:10, fontWeight:800, padding:'2px 7px', borderRadius:999, marginLeft:6 }}>{items.length}</span>}
        </div>
        {items.length > 0 && <button onClick={handleClear} disabled={clearing} style={{ fontSize:11, fontWeight:700, color:'#2563eb', background:'transparent', border:'none', cursor:'pointer' }}>{clearing ? 'Clearing...' : 'Clear all'}</button>}
      </div>
      <div className="alerts-proper-list">
        {items.length === 0 ? (
          <div className="alerts-empty-proper">
            <div className="alerts-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <p className="alerts-empty-title">No alerts</p>
            <p className="alerts-empty-sub">You're all caught up — no issues detected.</p>
          </div>
        ) : (
          items.map((a, idx) => (
            <div key={`${a.title}-${idx}`} className={`alert-proper-item alert-proper--${getIcon(a.type)}`} style={{ animationDelay: `${idx*70}ms` }}>
              <span className={`alert-proper-icon alert-proper-icon--${getIcon(a.type)}`}>
                {getIcon(a.type)==='warn' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
                {getIcon(a.type)==='profit' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.3 12.3a3.5 3.5 0 0 1-2.3 3.2"/><path d="M8.7 12.3a3.5 3.5 0 0 0 2.3 3.2"/></svg>}
                {getIcon(a.type)==='info' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
              </span>
              <div className="alert-proper-text">
                <div className="alert-proper-title">{a.title}</div>
                <div className="alert-proper-msg">{a.message}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DashboardPage({ data, onEditForm, onLogout }) {
  const {
    summary, setSummary, salesSummary, setSalesSummary,
    rules, setRules, analytics,
    notify, submitSale, removeSaleHandler, addStock,
  } = useDashboardState(data);

  const [activeNav, setActiveNav] = useState("dashboard");
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockOverviewOpen, setStockOverviewOpen] = useState(false);
  const [historyDetailProduct, setHistoryDetailProduct] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [dashMenuOpen, setDashMenuOpen] = useState(false);
  const [dashShowEditConfirm, setDashShowEditConfirm] = useState(false);
  const dashMenuAnchorRef = useRef(null);

  const { fireRule, handleRemoveRule } = useStockAutomation(rules, setRules, addStock, notify);

  const handleStockSubmit = async (payload) => {
    setStockModalOpen(false);
    const quantity = Number(payload.quantity || 0);
    if (!payload.productName || quantity <= 0) return;

    if (payload.mode === "automatic") {
      const newRule = {
        id: Date.now(),
        productName: payload.productName,
        quantity,
        dayOfMonth: Number(payload.dayOfMonth || 1),
        hour: payload.hour,
        minute: payload.minute,
        ampm: payload.ampm,
        createdAt: new Date().toISOString(),
      };
      setRules((prev) => [...prev, newRule]);
      notify(`Automatic add saved: ${quantity} units of ${payload.productName} on day ${newRule.dayOfMonth} of every month at ${payload.hour}:${payload.minute} ${payload.ampm}.`, "info");
      return;
    }

    await addStock(payload.productName, quantity, payload.date || "");
    notify(`Added ${quantity} units to ${payload.productName} on ${new Date((payload.date || new Date().toISOString().split("T")[0]) + "T00:00:00").toLocaleDateString()}.`, "success");
  };

  const handleNav = (nav) => {
    setActiveNav(nav);
    setHistoryDetailProduct(null);
    setEditingProfile(false);
    const scrollable = document.querySelector(".page-transition-slide:not(.slide-hidden)");
    if (scrollable) scrollable.scrollTop = 0;
    window.scrollTo(0, 0);
  };

  const initialsDash = (summary?.owner_name || "AH").trim().split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase() || "AH";

  useEffect(() => {
    if (!dashMenuOpen) return undefined;
    const onDown = (e) => {
      if (dashMenuAnchorRef.current && !dashMenuAnchorRef.current.contains(e.target)) setDashMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [dashMenuOpen]);

  const totalStock = (summary?.products || []).reduce((sum, p) => sum + Number(p.stockAvailable || 0), 0);
  const grossProfit = summary?.metrics?.gross_profit ?? 0;
  const monthlyExpenses = summary?.metrics?.total_expenses ?? summary?.metrics?.monthly_expenses ?? 0;
  const netProfit = summary?.metrics?.net_profit ?? 0;
  const currency = summary?.currency || "₹";

  // For non-dashboard pages, we render them below topbar but without dashboard grid
  const renderMainContent = () => {
    if (editingProfile) {
      return (
        <EditProfilePage
          profile={summary}
          onBack={() => setEditingProfile(false)}
          onSuccess={(updated) => {
            setSummary(updated);
            setEditingProfile(false);
            notify("Profile updated successfully.", "success");
          }}
        />
      );
    }
    if (activeNav === "inventory") return <InventoryPage products={summary?.products || []} onSubmit={handleStockSubmit} />;
    if (activeNav === "sales") return <AnalyticsPage data={summary} onBack={() => setActiveNav("dashboard")} />;
    if (activeNav === "editSales") return <AdjustSalesTab products={summary?.products || []} submitSale={submitSale} removeSale={removeSaleHandler} />;
    if (activeNav === "ai") return <AiInsightsPage data={summary} onBack={() => setActiveNav("dashboard")} />;
    if (activeNav === "forecast") return <ForecastingPage data={summary} onBack={() => setActiveNav("dashboard")} />;
    if (activeNav === "history") {
      if (historyDetailProduct) {
        return (
          <ProductHistoryDetail
            productName={historyDetailProduct}
            salesSummary={salesSummary}
            products={summary?.products || []}
            onBack={() => setHistoryDetailProduct(null)}
            onClearHistory={async () => {
              try {
                const res = await fetch("/api/dashboard");
                if (res.ok) {
                  const updated = await res.json();
                  if (updated.sales_summary) setSalesSummary(updated.sales_summary);
                  if (updated.metrics) setSummary((prev) => ({ ...prev, metrics: updated.metrics }));
                }
              } catch (err) { console.error(err); }
            }}
          />
        );
      }
      return <HistoryTab salesSummary={salesSummary} products={summary?.products || []} onOpenProduct={setHistoryDetailProduct} />;
    }
    if (activeNav === "automation") return <AutomationPage products={summary?.products || []} rules={rules} onRun={fireRule} onRemove={handleRemoveRule} onSubmit={handleStockSubmit} />;
    if (activeNav === "expenses") return <MonthlyExpensesPage expenses={summary?.expenses || []} metrics={summary?.metrics || {}} nextDeductions={summary?.next_deductions || []} recentDeductions={summary?.recent_deductions || []} currency={currency} onRefresh={async ()=>{ try{ const res=await fetch("/api/dashboard"); if(res.ok){const u=await res.json(); setSummary(u); if(u.sales_summary) setSalesSummary(u.sales_summary);} }catch{}}} />;
    if (activeNav === "reports") return <ReportsPage />;
    if (activeNav === "settings") return <SettingsPage />;
    return null;
  };

  const isDashboard = activeNav === "dashboard" && !editingProfile;

  return (
    <div className="demo-page demo-page--dashboard">
      <div className="app-layout">
        <Sidebar active={activeNav} onSelect={handleNav} />
        <div className="app-main">
          {isDashboard ? (
            <div className="dashboard-content">
              {/* Greeting row - notification + profile moved from topbar to replace date card */}
              <div className="dash-greeting-row dash-greeting-row--clean">
                <div className="dash-greeting-left">
                  <h1>{getGreeting()}, {summary?.owner_name || "Alex Harrison"}! <span style={{ fontSize: 20 }}>👋</span></h1>
                  <p>Here's what's happening with your business today.</p>
                </div>
                <div className="dash-greeting-actions">
                  <DateTimeChip />
                  <NotificationBell />
                  <div className="profile-menu" ref={dashMenuAnchorRef} style={{ position: 'relative' }}>
                    <div className="topbar-user topbar-user--avatar-only" onClick={()=>setDashMenuOpen(v=>!v)} style={{ cursor: 'pointer' }}>
                      <div className="topbar-avatar">{initialsDash}</div>
                    </div>
                    {dashMenuOpen && (
                      <div className="profile-dropdown" style={{ right: 0, top: 'calc(100% + 10px)', position: 'absolute' }}>
                        <button type="button" className="profile-menu-item" onClick={()=>{setDashMenuOpen(false); setEditingProfile(true);}}>Edit profile</button>
                        <button type="button" className="profile-menu-item" onClick={()=>{setDashMenuOpen(false); setDashShowEditConfirm(true);}}>Edit form</button>
                        <button type="button" className="profile-menu-item" onClick={()=>{setDashMenuOpen(false); onLogout?.();}}>Logout</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {dashShowEditConfirm && (
                <ModalPortal>
                  <div className="stock-modal-backdrop">
                    <div className="stock-modal confirm-modal">
                      <div className="stock-modal-header">
                        <div><h2>Edit Form</h2><p className="stock-modal-subtitle">This action cannot be undone.</p></div>
                        <button type="button" className="stock-modal-close" onClick={()=>setDashShowEditConfirm(false)}>×</button>
                      </div>
                      <div className="confirm-modal-body">
                        <p>Editing the form will <strong>reset all your data</strong> including sales history, stock, analytics, and expenses. You will start fresh with a new setup form.</p>
                        <p>Are you sure you want to continue?</p>
                      </div>
                      <div className="stock-modal-actions">
                        <button type="button" className="confirm-cancel-btn" onClick={()=>setDashShowEditConfirm(false)}>Cancel</button>
                        <button type="button" className="confirm-delete-btn" onClick={()=>{setDashShowEditConfirm(false); onEditForm?.();}}>Yes, Edit Form</button>
                      </div>
                    </div>
                  </div>
                </ModalPortal>
              )}

              {/* Top — 2x2 stats square + Add Sales + Alerts in one line (compact if needed) */}
              <div className="dash-top-grid">
                <div className="dash-stats-square">
                  <StatCards totalStock={totalStock} grossProfit={grossProfit} monthlyExpenses={monthlyExpenses} netProfit={netProfit} currency={currency} salesSummary={salesSummary} analytics={analytics} products={summary?.products || []} deductions={summary?.recent_deductions || []} onStockOverview={()=>setStockOverviewOpen(true)} onAddStock={()=>setStockModalOpen(true)} />
                </div>
                <div className="dash-add-sales-side">
                  <RecordSalesTab products={summary?.products || []} submitSale={submitSale} />
                </div>
                <div className="dash-alerts-side">
                  <AlertsCardProper />
                </div>
              </div>

              {/* Bottom — Sales Overview full width */}
              <div className="dash-bottom-row">
                <SalesOverviewCard analytics={analytics} />
              </div>
            </div>
          ) : (
            <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
              {renderMainContent()}
            </div>
          )}

          {/* Modals */}
          <StockModal products={summary?.products || []} isOpen={stockModalOpen} onClose={() => setStockModalOpen(false)} onSubmit={handleStockSubmit} />
          <StockOverviewModal products={summary?.products || []} isOpen={stockOverviewOpen} onClose={() => setStockOverviewOpen(false)} />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
