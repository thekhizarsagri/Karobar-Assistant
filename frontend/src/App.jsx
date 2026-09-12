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

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [restoring, setRestoring] = useState(() => location.pathname === "/dashboard");
  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (location.pathname !== "/dashboard") {
      return undefined;
    }
    if (dashboardData) {
      setRestoring(false);
      return undefined;
    }
    const id = (fetchIdRef.current += 1);
    setRestoring(true);
    let cancelled = false;
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data && data.business_name) {
          setDashboardData(data);
        } else {
          navigate("/welcome", { replace: true });
        }
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

  const handleFinish = useCallback(
    (data) => {
      setDashboardData(data);
    },
    []
  );

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/reset", { method: "POST" });
    } catch {
      /* ignore */
    }
    setDashboardData(null);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      <Route
        path="/welcome"
        element={
          <SwipePages
            initialPage="welcome"
            dashboardData={dashboardData}
            onFinish={handleFinish}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/setup"
        element={
          <SwipePages
            initialPage="setup"
            dashboardData={dashboardData}
            onFinish={handleFinish}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/dashboard"
        element={
          restoring ? (
            <DashboardLoading />
          ) : (
            <SwipePages
              initialPage="dashboard"
              dashboardData={dashboardData}
              onFinish={handleFinish}
              onLogout={handleLogout}
            />
          )
        }
      />
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}

export default App;
