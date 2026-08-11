import { useState } from "react";
import BusinessInfoForm from "./setup/BusinessInfoForm";
import ExpensesForm from "./setup/ExpensesForm";
import ProductsForm from "./setup/ProductsForm";
import { defaultProduct, fixedExpenseItems } from "./setup/constants";

function SetupPage({ initialData, onBack, onFinish }) {
  const [businessInfo, setBusinessInfo] = useState({
    businessName: initialData?.business_name ?? "Bottle Factory",
    businessType: initialData?.business_type ?? "Manufacturing",
    ownerName: initialData?.owner_name ?? "Alex",
    phoneNumber: initialData?.phone_number ?? "+91 9876543210",
    location: initialData?.location ?? "Mumbai, India",
    description: initialData?.description ?? "We manufacture reusable glass bottles for local retailers and distributors.",
  });
  const [products, setProducts] = useState(() => {
    if (initialData?.products?.length) {
      return initialData.products.map((product) => ({
        name: product.name ?? "",
        category: product.category ?? "",
        sellingPrice: product.sellingPrice ?? 0,
        costPrice: product.costPrice ?? 0,
        stockAvailable: product.stockAvailable ?? 0,
      }));
    }
    return [defaultProduct];
  });
  const [expenses, setExpenses] = useState(() => {
    const initialExpenses = (initialData?.expenses || []).reduce((acc, item) => {
      acc[item.key] = { enabled: !!item.enabled, amount: item.amount };
      return acc;
    }, {});
    return fixedExpenseItems.reduce((acc, item) => {
      acc[item.key] = initialExpenses[item.key] ?? { enabled: false, amount: item.amount };
      return acc;
    }, {});
  });

  const setBusiness = (name, value) => setBusinessInfo((prev) => ({ ...prev, [name]: value }));
  const setProduct = (index, field, value) =>
    setProducts((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  const addProduct = () => setProducts((prev) => [...prev, { ...defaultProduct, name: "" }]);
  const removeProduct = (index) => setProducts((prev) => prev.filter((_, i) => i !== index));
  const toggleExpense = (key) =>
    setExpenses((prev) => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }));
  const setExpense = (key, value) =>
    setExpenses((prev) => ({ ...prev, [key]: { ...prev[key], amount: value } }));

  const handleFinishSetup = async () => {
    const payload = {
      ...businessInfo,
      products: products.map((p) => ({
        name: p.name,
        category: p.category,
        sellingPrice: Number(p.sellingPrice || 0),
        costPrice: Number(p.costPrice || 0),
        stockAvailable: Number(p.stockAvailable || 0),
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
      onFinish?.(await response.json());
    } catch (error) {
      console.error(error);
      onFinish?.({
        business_name: businessInfo.businessName,
        owner_name: businessInfo.ownerName,
        status: "Demo mode",
        products: payload.products,
        metrics: { net_profit: 0, gross_profit: 0, total_expenses: 0, break_even: 0 },
      });
    }
  };

  return (
    <div className="demo-page">
      <div className="demo-panel demo-setup-panel">
        <div className="demo-header">
          <div>
            <p>Explore Karobar Assistant without registering.</p>
          </div>
          <button type="button" className="demo-back-btn" onClick={onBack}>Back to Login</button>
        </div>

        <BusinessInfoForm value={businessInfo} onChange={setBusiness} />
        <ProductsForm products={products} onChange={setProduct} onAdd={addProduct} onRemove={removeProduct} />
        <ExpensesForm items={fixedExpenseItems} values={expenses} onToggle={toggleExpense} onChange={setExpense} />

        <div className="demo-actions final-actions">
          <button type="button" className="register-btn" onClick={handleFinishSetup}>Finish Setup</button>
        </div>
      </div>
    </div>
  );
}

export default SetupPage;