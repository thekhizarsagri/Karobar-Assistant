import { useCallback, useEffect, useRef, useState } from "react";
import Welcome from "./Welcome";
import SetupPage from "./SetupPage";
import DashboardPage from "./DashboardPage";

const PAGE_PATH = { welcome: "/welcome", setup: "/setup", dashboard: "/dashboard" };
const SLIDE_TARGET = { "to-setup": "setup", "to-welcome": "welcome", "to-dashboard": "dashboard" };
const SLIDE_MS = 570;

export default function SwipePages({ initialPage, dashboardData, onFinish, onLogout }) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [slideDir, setSlideDir] = useState(null);
  const [ready, setReady] = useState(false);
  const [setupKey, setSetupKey] = useState(0);
  const welcomeRef = useRef(null);
  const setupRef = useRef(null);
  const dashboardRef = useRef(null);
  const refs = { welcome: welcomeRef, setup: setupRef, dashboard: dashboardRef };
  const sliding = slideDir !== null;

  useEffect(() => {
    const path = PAGE_PATH[initialPage] || "/welcome";
    if (window.location.pathname !== path) window.history.replaceState({}, "", path);
    requestAnimationFrame(() => setReady(true));
  }, [initialPage]);

  const goTo = useCallback(
    (dir, after) => {
      if (sliding && dir !== "to-welcome") return;
      const target = SLIDE_TARGET[dir];
      if (!target) return;
      setSlideDir(dir);
      setTimeout(() => {
        if (target === "welcome") setSetupKey((k) => k + 1);
        const el = refs[target]?.current;
        if (el) el.scrollTop = 0;
        setCurrentPage(target);
        setSlideDir(null);
        window.history.pushState({}, "", PAGE_PATH[target]);
        after?.();
      }, SLIDE_MS);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sliding]
  );

  const trackClass = slideDir || (currentPage === "welcome" ? "" : `to-${currentPage}`);
  const slideClass = (page) => {
    const active = currentPage === page || slideDir === `to-${page}`;
    if (!active) return "page-transition-slide slide-hidden";
    return sliding && currentPage === page ? "page-transition-slide slide-fade-out" : "page-transition-slide";
  };

  return (
    <div className="page-transition-wrapper">
      <div className={`page-transition-track ${trackClass} ${ready ? "ready" : ""}`}>
        <div ref={welcomeRef} className={slideClass("welcome")}>
          <Welcome onDemoClick={() => goTo("to-setup")} />
        </div>
        <div ref={setupRef} className={slideClass("setup")}>
          <SetupPage
            key={setupKey}
            initialData={dashboardData}
            onBack={() => goTo("to-welcome")}
            onFinish={(data) => {
              onFinish(data);
              goTo("to-dashboard");
            }}
          />
        </div>
        <div ref={dashboardRef} className={slideClass("dashboard")}>
          <DashboardPage
            data={dashboardData}
            onEditForm={() => goTo("to-setup")}
            onLogout={() => {
              onLogout();
              goTo("to-welcome");
            }}
          />
        </div>
      </div>
    </div>
  );
}
