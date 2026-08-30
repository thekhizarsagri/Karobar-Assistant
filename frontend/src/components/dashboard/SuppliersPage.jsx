import { useEffect, useMemo, useState } from "react";

const emptySupplier = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  paymentTerms: "",
};

const emptyOrder = {
  supplierName: "",
  productName: "",
  quantity: 1,
  unitCost: 0,
  status: "ordered",
  expectedDeliveryDate: "",
  note: "",
};

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({ totalOpenOrders: 0, totalReceivedOrders: 0, amountOutstanding: 0, amountReceived: 0 });
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [orderForm, setOrderForm] = useState(emptyOrder);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [suppliersRes, ordersRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/purchase-orders"),
      ]);

      if (suppliersRes.ok) {
        const supplierData = await suppliersRes.json();
        setSuppliers(supplierData.suppliers || []);
        setSummary(supplierData.summary || summary);
      }

      if (ordersRes.ok) {
        const orderData = await ordersRes.json();
        setOrders(orderData.orders || []);
        setSummary(orderData.summary || summary);
      }
    } catch (error) {
      console.error("Unable to load supplier data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const supplierOptions = useMemo(() => suppliers.map((supplier) => supplier.name), [suppliers]);

  const handleSupplierSubmit = async (event) => {
    event.preventDefault();
    if (!supplierForm.name.trim()) return;

    const response = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supplierForm),
    });

    if (response.ok) {
      setSupplierForm(emptySupplier);
      await loadData();
    }
  };

  const handleOrderSubmit = async (event) => {
    event.preventDefault();
    if (!orderForm.supplierName || !orderForm.productName) return;

    const response = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...orderForm,
        quantity: Number(orderForm.quantity || 0),
        unitCost: Number(orderForm.unitCost || 0),
      }),
    });

    if (response.ok) {
      setOrderForm({ ...emptyOrder, supplierName: orderForm.supplierName });
      await loadData();
    }
  };

  if (loading) {
    return <div className="inventory-page"><div className="inv-loading">Loading suppliers…</div></div>;
  }

  return (
    <div className="inventory-page">
      <div className="analytics-header">
        <div className="analytics-title-block">
          <h1 className="analytics-title">Suppliers & Purchase Orders</h1>
          <p className="analytics-subtitle">Track vendor relationships and incoming stock commitments.</p>
        </div>
      </div>

      <div className="inv-stats">
        <div className="inv-stat">
          <span className="inv-stat-value">{summary.totalOpenOrders || 0}</span>
          <span className="inv-stat-label">Open orders</span>
        </div>
        <div className="inv-stat">
          <span className="inv-stat-value">₹{Number(summary.amountOutstanding || 0).toLocaleString()}</span>
          <span className="inv-stat-label">Outstanding value</span>
        </div>
        <div className="inv-stat">
          <span className="inv-stat-value">{summary.totalReceivedOrders || 0}</span>
          <span className="inv-stat-label">Received</span>
        </div>
        <div className="inv-stat">
          <span className="inv-stat-value inv-stat-value--profit">₹{Number(summary.amountReceived || 0).toLocaleString()}</span>
          <span className="inv-stat-label">Received value</span>
        </div>
      </div>

      <div className="inv-section">
        <h2 className="inv-section-title">Add supplier</h2>
        <form className="setup-form-grid" onSubmit={handleSupplierSubmit}>
          <label>
            Supplier name
            <input value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
          </label>
          <label>
            Contact person
            <input value={supplierForm.contactPerson} onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} />
          </label>
          <label>
            Phone
            <input value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
          </label>
          <label>
            Email
            <input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} />
          </label>
          <label>
            Address
            <input value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} />
          </label>
          <label>
            Payment terms
            <input value={supplierForm.paymentTerms} onChange={(e) => setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })} />
          </label>
          <button type="submit" className="setup-primary-launch-btn">Save supplier</button>
        </form>
      </div>

      <div className="inv-section">
        <h2 className="inv-section-title">Create purchase order</h2>
        <form className="setup-form-grid" onSubmit={handleOrderSubmit}>
          <label>
            Supplier
            <select value={orderForm.supplierName} onChange={(e) => setOrderForm({ ...orderForm, supplierName: e.target.value })}>
              <option value="">Select supplier</option>
              {supplierOptions.map((supplier) => (
                <option key={supplier} value={supplier}>{supplier}</option>
              ))}
            </select>
          </label>
          <label>
            Product name
            <input value={orderForm.productName} onChange={(e) => setOrderForm({ ...orderForm, productName: e.target.value })} />
          </label>
          <label>
            Quantity
            <input type="number" min="1" value={orderForm.quantity} onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })} />
          </label>
          <label>
            Unit cost
            <input type="number" min="0" step="0.01" value={orderForm.unitCost} onChange={(e) => setOrderForm({ ...orderForm, unitCost: e.target.value })} />
          </label>
          <label>
            Status
            <select value={orderForm.status} onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}>
              <option value="ordered">Ordered</option>
              <option value="in_transit">In transit</option>
              <option value="received">Received</option>
            </select>
          </label>
          <label>
            Expected delivery date
            <input type="date" value={orderForm.expectedDeliveryDate} onChange={(e) => setOrderForm({ ...orderForm, expectedDeliveryDate: e.target.value })} />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Notes
            <input value={orderForm.note} onChange={(e) => setOrderForm({ ...orderForm, note: e.target.value })} />
          </label>
          <button type="submit" className="setup-primary-launch-btn">Create order</button>
        </form>
      </div>

      <div className="inv-section">
        <h2 className="inv-section-title">Suppliers</h2>
        {suppliers.length === 0 ? (
          <p className="automation-empty">No suppliers added yet.</p>
        ) : (
          <div className="inv-attention-grid">
            {suppliers.map((supplier) => (
              <div key={supplier.id || supplier.name} className="inv-attention-card">
                <div className="inv-attention-head">
                  <span className="inv-attention-name">{supplier.name}</span>
                </div>
                <div className="inv-attention-row"><span>Contact</span><strong>{supplier.contactPerson || "—"}</strong></div>
                <div className="inv-attention-row"><span>Phone</span><strong>{supplier.phone || "—"}</strong></div>
                <div className="inv-attention-row"><span>Email</span><strong>{supplier.email || "—"}</strong></div>
                <div className="inv-attention-row"><span>Terms</span><strong>{supplier.paymentTerms || "—"}</strong></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="inv-section">
        <h2 className="inv-section-title">Purchase orders</h2>
        {orders.length === 0 ? (
          <p className="automation-empty">No purchase orders yet.</p>
        ) : (
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit cost</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Delivery</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.supplierName}</td>
                    <td>{order.productName}</td>
                    <td>{order.quantity}</td>
                    <td>₹{Number(order.unitCost || 0).toLocaleString()}</td>
                    <td>₹{Number(order.totalCost || 0).toLocaleString()}</td>
                    <td>{order.status}</td>
                    <td>{order.expectedDeliveryDate || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default SuppliersPage;
