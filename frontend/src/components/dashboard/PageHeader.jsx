function PageHeader({ ownerName, greeting, onBack }) {
  return (
    <div className="demo-header">
      <div className="greeting-block">
        <h1 className="dashboard-greeting">{greeting}, {ownerName || "Business Owner"}!</h1>
      </div>
      <div className="header-controls">
        <button type="button" className="demo-back-btn" onClick={onBack}>Back to Setup</button>
      </div>
    </div>
  );
}

export default PageHeader;