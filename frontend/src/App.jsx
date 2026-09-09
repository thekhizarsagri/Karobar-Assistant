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
        <BgSwitcher />
      </BrowserRouter>
    </ThemeProvider>
  );
}

const BG_THEMES = [
  { id: "waves", label: "Ocean Waves", dot: "linear-gradient(135deg, #5eead4, #38bdf8)" },
  { id: "bubbles", label: "Rising Bubbles", dot: "linear-gradient(135deg, #a5f3fc, #2563eb)" },
  { id: "ribbons", label: "Neon Ribbons", dot: "linear-gradient(135deg, #2dd4bf, #3b82f6)" },
  { id: "dots", label: "Tech Dots", dot: "linear-gradient(135deg, #94a3b8, #0e7490)" },
];

function BgSwitcher() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("karobar-bg") || "waves";
    } catch {
      return "waves";
    }
  });

  useEffect(() => {
    document.body.dataset.bg = theme;
    try {
      localStorage.setItem("karobar-bg", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (!e.target.closest(".bg-switcher")) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open ]);

  return (
    <div className="bg-switcher">
      {open && (
        <div className="bg-switcher-pop" role="menu" aria-label="Background theme">
          <div className="bg-switcher-title">Background</div>
          {BG_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={theme === t.id}
              className={theme === t.id ? "bg-switcher-opt active" : "bg-switcher-opt"}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
            >
              <span className="bg-switcher-dot" style={{ background: t.dot }} />
              {t.label}
            </button>
          ))}
        </div>
      )}
      <button type="button" className="bg-switcher-btn" aria-label="Change background" onClick={() => setOpen((v) => !v)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r="0.5" />
          <circle cx="17.5" cy="10.5" r="0.5" />
          <circle cx="8.5" cy="7.5" r="0.5" />
          <circle cx="6.5" cy="12.5" r="0.5" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.2-.3-.4-.7-.4-1.1a1.7 1.7 0 0 1 1.7-1.7h2C19.5 16.4 22 13.5 22 10c0-4.4-4.5-8-10-8z" />
        </svg>
      </button>
    </div>
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
