import { useState } from "react";
import CredentialsCard from "../setup/CredentialsCard";
import BusinessProfileCard from "../setup/BusinessProfileCard";

function EditProfilePage({ profile, onBack, onSuccess }) {
  const [form, setForm] = useState({
    ownerName: profile?.owner_name ?? "",
    username: profile?.username ?? "",
    email: profile?.email ?? "",
    password: profile?.password ?? "",
    businessName: profile?.business_name ?? "",
    businessType: profile?.business_type ?? "Manufacturing",
    phoneNumber: profile?.phone_number ?? "",
    location: profile?.location ?? "",
    description: profile?.description ?? "",
    currency: profile?.currency ?? "₹",
    taxId: profile?.tax_id ?? "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const currencyObj = { symbol: form.currency || "₹" };

  const handleSave = async () => {
    if (!form.businessName?.trim()) {
      setFeedback("Business Name is required.");
      return;
    }
    if (!form.ownerName?.trim()) {
      setFeedback("Owner Name is required.");
      return;
    }
    setSaving(true);
    setFeedback("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const data = await res.json();
      onSuccess?.(data);
    } catch (err) {
      console.error(err);
      setFeedback("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-profile-root">
      <div className="analytics-header">
        <div className="analytics-title-block">
          <h1 className="analytics-title">Edit Profile</h1>
          <p className="analytics-subtitle">Update your credentials and business information</p>
        </div>
        <button type="button" className="analytics-back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      {feedback && (
        <div className="setup-error-alert-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{feedback}</span>
        </div>
      )}

      <div className="edit-profile-cards">
        <CredentialsCard
          value={form}
          onInput={handleInput}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((v) => !v)}
        />
        <BusinessProfileCard
          value={form}
          onInput={handleInput}
          currentCurrency={currencyObj}
        />

        <div className="edit-profile-actions">
          <button
            type="button"
            className="setup-primary-launch-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="setup-spinner"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Save Changes</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditProfilePage;
