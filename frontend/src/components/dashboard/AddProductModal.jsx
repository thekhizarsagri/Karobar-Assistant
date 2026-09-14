import { useEffect, useState } from "react";
import ModalPortal from "./ModalPortal";
import ProductDraftForm from "../setup/ProductDraftForm";
import { productCategories } from "../setup/constants";

const EMPTY_DRAFT = {
  name: "",
  category: "Packaging Materials",
  sku: "",
  sellingPrice: "",
  costPrice: "",
  stockAvailable: "",
  unit: "pcs",
  reorderPoint: "10",
};

function AddProductModal({ isOpen, currency, existingNames, onClose, onSubmit }) {
  const [draftProduct, setDraftProduct] = useState({ ...EMPTY_DRAFT, category: productCategories[0] });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraftProduct({ ...EMPTY_DRAFT, category: productCategories[0] });
      setFormError("");
      setSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDraftChange = (field, value) => {
    if (field === "_error") {
      setFormError(value);
      return;
    }
    setDraftProduct((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError("");
  };

  const handleAdd = async (newProd) => {
    const duplicate = (existingNames || []).some(
      (n) => String(n || "").trim().toLowerCase() === String(newProd.name || "").trim().toLowerCase()
    );
    if (duplicate) {
      setFormError(`"${newProd.name.trim()}" is already in your catalog.`);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await onSubmit(newProd);
    } catch (err) {
      const code = err?.code || "";
      if (code === "duplicate_product") {
        setFormError(`"${newProd.name.trim()}" is already in your catalog.`);
      } else if (code === "invalid_price") {
        setFormError("Please enter a valid selling price greater than 0.");
      } else if (code === "name_required") {
        setFormError("Please enter a product name.");
      } else if (code === "no_profile") {
        setFormError("Business data not found. Please reload and try again.");
      } else {
        setFormError("Could not add product. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div className="stock-modal-backdrop" onClick={onClose}>
        <div
          className="stock-modal add-product-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Add new product"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="stock-modal-header add-product-head">
            <span className="add-product-head-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
                <path d="M3 8l9 5 9-5" />
                <path d="M12 13v8" />
              </svg>
            </span>
            <div>
              <h2>Add Product</h2>
            </div>
            <button type="button" className="stock-modal-close" onClick={onClose} aria-label="Close">×</button>
          </div>
          <div className={`add-product-body${saving ? " add-product-body--busy" : ""}`}>
            <ProductDraftForm
              draftProduct={draftProduct}
              onDraftChange={handleDraftChange}
              onAdd={handleAdd}
              currency={currency}
              formError={formError}
            />
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export default AddProductModal;
