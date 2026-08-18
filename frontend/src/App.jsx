import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import Welcome from "./components/Welcome";
import SetupPage from "./components/SetupPage";
import DashboardPage from "./components/DashboardPage";

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
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
    // Already showing in-session data; nothing to fetch.
    if (location.pathname !== "/dashboard") {
      return undefined;
    }
    if (dashboardData) {
      setRestoring(false);
      return undefined;
    }
    // Load the current session's data from the backend (in-memory). On a
    // fresh server start there is none, so we go back to the welcome page.
    // During a live session the data survives refreshes.
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

  // Always start a fresh page at the top when the route changes.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleFinish = useCallback(
    (data) => {
      setDashboardData(data);
      navigate("/dashboard");
    },
    [navigate]
  );

  const handleReset = useCallback(async () => {
    try {
      await fetch("/api/reset", { method: "POST" });
    } catch {
      /* ignore */
    }
    setDashboardData(null);
    navigate("/welcome", { replace: true });
  }, [navigate]);

  const handleLogout = useCallback(() => {
    setDashboardData(null);
    navigate("/welcome", { replace: true });
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      <Route
        path="/welcome"
        element={<Welcome onDemoClick={() => navigate("/setup")} />}
      />
      <Route
        path="/setup"
        element={
          <SetupPage
            initialData={dashboardData}
            onBack={() => navigate("/welcome")}
            onFinish={handleFinish}
          />
        }
      />
      <Route
        path="/dashboard"
        element={
          restoring ? (
            <DashboardLoading />
          ) : (
            <DashboardPage
              data={dashboardData}
              onEditForm={() => navigate("/setup")}
              onLogout={handleLogout}
              onReset={handleReset}
            />
          )
        }
      />
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}

export default App;