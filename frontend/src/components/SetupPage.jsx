import { useState } from "react";
import BusinessInfoForm from "./setup/BusinessInfoForm";
import ProductsForm from "./setup/ProductsForm";
import { defaultProduct, fixedExpenseItems } from "./setup/constants";
import titleImg from "../assets/title-image.png";
import titleImgDark from "../assets/title-image-dark.png";
import { useTheme } from "../ThemeContext";

function SetupPage({ initialData, onBack, onFinish }) {
  const { dark } = useTheme();
  const [businessInfo, setBusinessInfo] = useState({
    businessName: initialData?.business_name ?? "Apex Glass & Packaging Co.",
    businessType: initialData?.business_type ?? "Manufacturing",
    ownerName: initialData?.owner_name ?? "Alex Harrison",
    username: initialData?.username ?? "alex_harrison",
    email: initialData?.email ?? "alex@apexpackaging.com",
    password: initialData?.password ?? "",
    phoneNumber: initialData?.phone_number ?? "+91 98765 43210",
    location: initialData?.location ?? "Industrial Area Phase 2, Mumbai",
    currency: initialData?.currency ?? "₹",
    taxId: initialData?.tax_id ?? "",
    description:
      initialData?.description ??
      "We manufacture premium reusable glass bottles and eco-friendly packaging for beverage and retail businesses.",
  });

  const [products, setProducts] = useState(() => {
    if (initialData?.products?.length) {
      return initialData.products.map((product) => ({
        name: product.name ?? "",
        category: product.category ?? "Packaging Materials",
        sku: product.sku ?? "KB-001",
        sellingPrice: product.sellingPrice ?? 0,
        costPrice: product.costPrice ?? 0,
        stockAvailable: product.stockAvailable ?? 0,
        unit: product.unit ?? "pcs",
        reorderPoint: product.reorderPoint ?? 10,
      }));
    }
    // Default with 0 active products
    return [];
  });

  const [expenses, setExpenses] = useState(() => {
    const initialExpenses = (initialData?.expenses || []).reduce((acc, item) => {
      acc[item.key] = { enabled: !!item.enabled, amount: item.amount };
      return acc;
    }, {});
    return fixedExpenseItems.reduce((acc, item) => {
      acc[item.key] = initialExpenses[item.key] ?? {
        enabled: false,
        amount: item.amount,
      };
      return acc;
    }, {});
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState("");

  const setBusiness = (name, value) =>
    setBusinessInfo((prev) => ({ ...prev, [name]: value }));

  const setProduct = (index, field, value) =>
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );

  const addProduct = (newProduct) => {
    setProducts((prev) => [
      ...prev,
      newProduct || { ...defaultProduct, name: "" },
    ]);
  };

  const removeProduct = (index) =>
    setProducts((prev) => prev.filter((_, i) => i !== index));

  const toggleExpense = (key) =>
    setExpenses((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));

  const setExpense = (key, value) =>
    setExpenses((prev) => ({
      ...prev,
      [key]: { ...prev[key], amount: value },
    }));

  const handleFinishSetup = async () => {
    if (!businessInfo.businessName?.trim()) {
      setSubmissionFeedback("Please provide a Business Name in the company profile section.");
      return;
    }

    if (products.length === 0) {
      setSubmissionFeedback("Please add at least one product in the product catalog section.");
      return;
    }

    setIsSubmitting(true);
    setSubmissionFeedback("");

    const payload = {
      ...businessInfo,
      products: products.map((p) => ({
        name: p.name || "Unnamed Product",
        category: p.category || "Other",
        sku: p.sku || "",
        sellingPrice: Number(p.sellingPrice || 0),
        costPrice: Number(p.costPrice || 0),
        stockAvailable: Number(p.stockAvailable || 0),
        unit: p.unit || "pcs",
        reorderPoint: Number(p.reorderPoint || 10),
      })),
      expenses: fixedExpenseItems.map((item) => ({
        key: item.key,
        label: item.label,
        amount: Number(expenses[item.key]?.amount || 0),
        enabled: expenses[item.key]?.enabled ?? true,
      })),
    };

    try {
      const response = await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Unable to load dashboard data");
      const data = await response.json();
      onFinish?.(data);
    } catch (error) {
      console.error(error);
      // Fallback demo mode data
      onFinish?.({
        business_name: businessInfo.businessName,
        owner_name: businessInfo.ownerName,
        currency: businessInfo.currency,
        status: "Demo mode",
        products: payload.products,
        metrics: { net_profit: 0, gross_profit: 0, total_expenses: 0 },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live overview statistics
  const totalStockCount = products.reduce(
    (acc, p) => acc + (Number(p.stockAvailable) || 0),
    0
  );

  const totalCatalogValue = products.reduce(
    (acc, p) => acc + (Number(p.sellingPrice) || 0) * (Number(p.stockAvailable) || 0),
    0
  );

  return (
    <div className="setup-fullscreen-root">
      {/* Top Application Header Bar with Integrated Logo, Overview Stats, and Actions */}
      <header className="setup-top-navbar">
        <div className="navbar-left">
          <div className="setup-brand-container">
            <img
              src={dark ? titleImgDark : titleImg}
              alt="Karobar Assistant"
              className="setup-nav-title-image"
              draggable={false}
            />
          </div>
        </div>

        {/* Live Overview Stats in Header */}
        <div className="navbar-center-overview">
          <div className="overview-item">
            <span className="overview-lbl">Workspace:</span>
            <strong className="overview-val">{businessInfo.businessName || "My Business"}</strong>
          </div>
          <div className="overview-sep">•</div>
          <div className="overview-item">
            <span className="overview-lbl">Owner:</span>
            <strong className="overview-val">{businessInfo.ownerName || "Admin"}</strong>
          </div>
          <div className="overview-sep">•</div>
          <div className="overview-item">
            <span className="overview-lbl">Catalog:</span>
            <strong className="overview-val">{products.length} Products ({totalStockCount} units)</strong>
          </div>
          <div className="overview-sep">•</div>
          <div className="overview-item">
            <span className="overview-lbl">Est. Value:</span>
            <strong className="overview-val text-emerald">
              {businessInfo.currency}
              {totalCatalogValue.toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="navbar-right">
          <button type="button" className="setup-ghost-back-btn" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Login
          </button>

          <button
            type="button"
            className="setup-primary-launch-btn"
            onClick={handleFinishSetup}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="setup-spinner"></span>
                <span>Configuring Dashboard...</span>
              </>
            ) : (
              <>
                <span>Complete Setup & Launch Dashboard</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Two-Column Container */}
      <main className="setup-two-column-wrapper">
        {submissionFeedback && (
          <div className="setup-error-alert-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{submissionFeedback}</span>
          </div>
        )}

        <div className="setup-columns-grid">
          {/* Left Column: Business & Account Suite */}
          <BusinessInfoForm
            value={businessInfo}
            onChange={setBusiness}
            expenses={expenses}
            onToggleExpense={toggleExpense}
            onChangeExpense={setExpense}
          />

          {/* Invisible / Subtle Centre Divider */}
          <div className="center-column-divider" aria-hidden="true">
            <div className="divider-line"></div>
            <div className="divider-orb">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div className="divider-line"></div>
          </div>

          {/* Right Column: Products & Inventory Catalog */}
          <ProductsForm
            products={products}
            onChange={setProduct}
            onAdd={addProduct}
            onRemove={removeProduct}
            currency={businessInfo.currency}
          />
        </div>
      </main>
    </div>
  );
}

export default SetupPage;