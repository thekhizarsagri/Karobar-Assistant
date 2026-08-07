import { useState } from "react";

const productCategories = [
  "Electronics",
  "Food & Beverages",
  "Clothing & Apparel",
  "Furniture & Home Décor",
  "Beauty & Personal Care",
  "Sports & Fitness",
  "Books & Stationery",
  "Toys & Games",
  "Appliances",
  "Vehicles & Auto Parts",
  "Packaging Materials",
  "Raw Materials",
  "Industrial Equipment",
];
const defaultProduct = {
  name: "Glass Bottle",
  category: "Packaging Materials",
  sellingPrice: "180",
  costPrice: "120",
  stockAvailable: "1200",
};
const fixedExpenseItems = [
  { key: "rent", label: "Rent", amount: "18000" },
  { key: "electricity", label: "Electricity", amount: "7200" },
  { key: "internet", label: "Internet", amount: "1500" },
  { key: "transportation", label: "Transportation", amount: "8500" },
  { key: "marketing", label: "Marketing", amount: "6500" },
  { key: "other", label: "Other", amount: "3000" },
];

function DemoPage({ onBack, onFinish }) {
  const [businessInfo, setBusinessInfo] = useState({
    businessName: "Bottle Factory",
    businessType: "Manufacturing",
    ownerName: "Alex",
    phoneNumber: "+91 9876543210",
    location: "Mumbai, India",
    description: "We manufacture reusable glass bottles for local retailers and distributors.",
  });
  const [products, setProducts] = useState([defaultProduct]);
  const [expenses, setExpenses] = useState(
    fixedExpenseItems.reduce((acc, item) => {
      acc[item.key] = { enabled: false, amount: item.amount };
      return acc;
    }, {})
  );

  const handleBusinessChange = (event) => {
    const { name, value } = event.target;

    if (name === "phoneNumber") {
      const sanitizedValue = value.replace(/[^0-9+\s-]/g, "");
      setBusinessInfo((prev) => ({ ...prev, [name]: sanitizedValue }));
      return;
    }

    setBusinessInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (index, field, value) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addProduct = () => {
    setProducts((prev) => [...prev, { ...defaultProduct, name: "" }]);
  };

  const removeProduct = (index) => {
    setProducts((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleExpenseToggle = (key) => {
    setExpenses((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  };

  const handleExpenseAmount = (key, value) => {
    setExpenses((prev) => ({
      ...prev,
      [key]: { ...prev[key], amount: value },
    }));
  };

  const handleFinishSetup = async () => {
    const payload = {
      businessName: businessInfo.businessName,
      businessType: businessInfo.businessType,
      ownerName: businessInfo.ownerName,
      phoneNumber: businessInfo.phoneNumber,
      location: businessInfo.location,
      description: businessInfo.description,
      products: products.map((product) => ({
        name: product.name,
        category: product.category,
        sellingPrice: Number(product.sellingPrice || 0),
        costPrice: Number(product.costPrice || 0),
        stockAvailable: Number(product.stockAvailable || 0),
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

      if (!response.ok) {
        throw new Error("Unable to load dashboard data");
      }

      const data = await response.json();
      onFinish?.(data);
    } catch (error) {
      console.error(error);
      onFinish?.({
        business_name: businessInfo.businessName,
        owner_name: businessInfo.ownerName,
        status: "Demo mode",
        products: payload.products,
        metrics: {
          net_profit: 0,
          gross_profit: 0,
          total_expenses: 0,
          break_even: 0,
        },
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
          <button type="button" className="demo-back-btn" onClick={onBack}>
            Back to Login
          </button>
        </div>

        <div className="demo-section">
          <div className="section-heading">
            <span className="step-pill">Step 1</span>
            <h2>Business information</h2>
          </div>
          <div className="form-grid">
            <label className="form-field">
              <span>Business Name</span>
              <input
                type="text"
                name="businessName"
                value={businessInfo.businessName}
                onChange={handleBusinessChange}
              />
            </label>
            <label className="form-field">
              <span>Business Type</span>
              <select
                name="businessType"
                value={businessInfo.businessType}
                onChange={handleBusinessChange}
              >
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Service">Service</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label className="form-field">
              <span>Owner Name</span>
              <input
                type="text"
                name="ownerName"
                value={businessInfo.ownerName}
                onChange={handleBusinessChange}
              />
            </label>
            <label className="form-field">
              <span>Phone Number</span>
              <input
                type="text"
                inputMode="numeric"
                name="phoneNumber"
                value={businessInfo.phoneNumber}
                onChange={handleBusinessChange}
                placeholder="+91 9876543210"
                pattern="[0-9+\s-]*"
              />
            </label>
            <label className="form-field">
              <span>Business Location</span>
              <input
                type="text"
                name="location"
                value={businessInfo.location}
                onChange={handleBusinessChange}
              />
            </label>

            <label className="form-field full-width">
              <span>Business Description</span>
              <textarea
                rows="3"
                name="description"
                value={businessInfo.description}
                onChange={handleBusinessChange}
              />
            </label>
          </div>
        </div>

        <div className="demo-section">
          <div className="section-heading">
            <span className="step-pill">Step 2</span>
            <h2>Products</h2>
          </div>
          <div className="products-list">
            {products.map((product, index) => (
              <div className="product-card" key={`product-${index}`}>
                <div className="product-row">
                  <label className="form-field small">
                    <span>Product Name</span>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(event) => handleProductChange(index, "name", event.target.value)}
                    />
                  </label>
                  <label className="form-field small">
                    <span>Category</span>
                    <select
                      value={product.category}
                      onChange={(event) => handleProductChange(index, "category", event.target.value)}
                    >
                      {productCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="product-row">
                  <label className="form-field small">
                    <span>Selling Price (per unit)</span>
                    <input
                      type="number"
                      value={product.sellingPrice}
                      onChange={(event) => handleProductChange(index, "sellingPrice", event.target.value)}
                    />
                  </label>
                  <label className="form-field small">
                    <span>Cost Price (per unit)</span>
                    <input
                      type="number"
                      value={product.costPrice}
                      onChange={(event) => handleProductChange(index, "costPrice", event.target.value)}
                    />
                  </label>
                </div>

                <div className="product-row">
                  <label className="form-field small">
                    <span>Available Stock</span>
                    <input
                      type="number"
                      min="0"
                      value={product.stockAvailable}
                      onChange={(event) => handleProductChange(index, "stockAvailable", event.target.value)}
                    />
                  </label>
                </div>

                <div className="product-actions">
                  <button
                    type="button"
                    className="remove-product-btn"
                    onClick={() => removeProduct(index)}
                  >
                    Remove product
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="add-product-btn" onClick={addProduct}>
            + Add another product
          </button>
        </div>

        <div className="demo-section">
          <div className="section-heading">
            <span className="step-pill">Step 3</span>
            <h2>Fixed monthly expenses</h2>
          </div>
          <div className="expenses-grid">
            {fixedExpenseItems.map((item) => (
              <div key={item.key} className="expense-row">
                <label className="expense-toggle">
                  <input
                    type="checkbox"
                    checked={expenses[item.key].enabled}
                    onChange={() => handleExpenseToggle(item.key)}
                  />
                  <span>{item.label}</span>
                </label>
                <input
                  type="number"
                  value={expenses[item.key].amount}
                  disabled={!expenses[item.key].enabled}
                  onChange={(event) => handleExpenseAmount(item.key, event.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        
        <div className="demo-actions final-actions">
          <button type="button" className="register-btn" onClick={handleFinishSetup}>
            Finish Setup
          </button>
        </div>
      </div>
    </div>
  );
}

export default DemoPage;
