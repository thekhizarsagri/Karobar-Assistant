import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";
import "./App.css";
import SwipePages from "./components/SwipePages";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}

function DashboardLoading() {
  return (
    <div className="demo-page">
      <div className="demo-panel">
        <p>Loading your dashboard…</p>
      </div>
    </div>
  );
}

const PAGE_PATHS = { welcome: "/welcome", setup: "/setup", dashboard: "/dashboard" };

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [restoring, setRestoring] = useState(() => location.pathname === "/dashboard");
  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (location.pathname !== "/dashboard" || dashboardData) {
      if (dashboardData) setRestoring(false);
      return undefined;
    }
    const id = (fetchIdRef.current += 1);
    setRestoring(true);
    let cancelled = false;
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.business_name) setDashboardData(data);
        else navigate("/welcome", { replace: true });
      })
      .catch(() => {
        if (!cancelled) navigate("/welcome", { replace: true });
      })
      .finally(() => {
        if (fetchIdRef.current === id) setRestoring(false);
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname, dashboardData, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleFinish = useCallback((data) => setDashboardData(data), []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/reset", { method: "POST" });
    } catch {
      /* ignore */
    }
    setDashboardData(null);
  }, []);

  const renderPage = useCallback(
    (page) => (
      <SwipePages initialPage={page} dashboardData={dashboardData} onFinish={handleFinish} onLogout={handleLogout} />
    ),
    [dashboardData, handleFinish, handleLogout]
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      {Object.keys(PAGE_PATHS).map((page) => (
        <Route
          key={page}
          path={PAGE_PATHS[page]}
          element={page === "dashboard" && restoring ? <DashboardLoading /> : renderPage(page)}
        />
      ))}
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}

export default App;
