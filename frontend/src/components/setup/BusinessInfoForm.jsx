function BusinessInfoForm({ value, onChange }) {
  const handleInput = (event) => {
    const { name, value: raw } = event.target;
    const next = name === "phoneNumber" ? raw.replace(/[^0-9+\s-]/g, "") : raw;
    onChange(name, next);
  };

  return (
    <div className="demo-section">
      <div className="section-heading">
        <span className="step-pill active">Step 1</span>
        <h2>Business information</h2>
      </div>
      <div className="form-grid">
        <label className="form-field">
          <span>Business Name</span>
          <input
            type="text"
            name="businessName"
            value={value.businessName}
            onChange={handleInput}
            placeholder="Enter business name"
          />
        </label>
        <label className="form-field">
          <span>Business Type</span>
          <select name="businessType" value={value.businessType} onChange={handleInput}>
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
            value={value.ownerName}
            onChange={handleInput}
            placeholder="Enter owner name"
          />
        </label>
        <label className="form-field">
          <span>Phone Number</span>
          <input
            type="text"
            inputMode="numeric"
            name="phoneNumber"
            value={value.phoneNumber}
            onChange={handleInput}
            placeholder="+91 9876543210"
            pattern="[0-9+\s-]*"
            className="form-field.input-wrapper"
          />
          <p className="form-hint">Enter your phone number with country code</p>
        </label>
        <label className="form-field">
          <span>Business Location</span>
          <input
            type="text"
            name="location"
            value={value.location}
            onChange={handleInput}
            placeholder="Enter business location"
          />
        </label>
        <label className="form-field full-width">
          <span>Business Description</span>
          <textarea
            rows="3"
            name="description"
            value={value.description}
            onChange={handleInput}
            placeholder="Describe your business..."
          />
        </label>
      </div>
    </div>
  );
}

export default BusinessInfoForm;