/**
 * Single source of truth for navigation + page icon colors.
 * Sidebar accent, dashboard KPI icon, and each page's header icon
 * must all use the same value from here so colors stay unified.
 */
export const NAV_ACCENTS = {
  dashboard: "#0d9d7a", // emerald — home / brand
  inventory: "#2563eb", // blue — matches Total Stock KPI card
  sales: "#2f80ed", // blue — matches Sales Analytics header
  editSales: "#d97706", // amber — record / adjust sales
  history: "#0284c7", // sky — product history
  automation: "#6d28d9", // deep violet — automation (distinct from expenses purple)
  ai: "#8b5cf6", // light purple — analytics / AI insights
  forecast: "#0ea5e9", // light blue — demand forecasting
  reports: "#f43f5e", // rose — business reports
  expenses: "#7c3aed", // purple — monthly expenses (matches dashboard KPI card)
  settings: "#64748b", // slate — settings
};

export default NAV_ACCENTS;
