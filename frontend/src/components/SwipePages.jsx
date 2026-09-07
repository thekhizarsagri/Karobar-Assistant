import { useCallback, useEffect, useRef, useState } from "react";
import Welcome from "./Welcome";
import SetupPage from "./SetupPage";
import DashboardPage from "./DashboardPage";

export default function SwipePages({ initialPage, dashboardData, onFinish, onLogout }) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [sliding, setSliding] = useState(false);
  const [slideDir, setSlideDir] = useState(null);
  const [ready, setReady] = useState(false);
  const [setupKey, setSetupKey] = useState(0);
  const slideRefs = { welcome: useRef(null), setup: useRef(null), dashboard: useRef(null) };

  useEffect(() => {
    const path = initialPage === "welcome" ? "/welcome" : initialPage === "setup" ? "/setup" : "/dashboard";
    if (window.location.pathname !== path) {
      window.history.replaceState({}, "", path);
    }
    requestAnimationFrame(() => setReady(true));
  }, [initialPage]);

  const startSlide = useCallback((dir) => {
    if (sliding) return;
    setSlideDir(dir);
    setSliding(true);
  }, [sliding]);

  const goToSetup = useCallback(() => startSlide("to-setup"), [startSlide]);
  const goToWelcome = useCallback(() => startSlide("to-welcome"), [startSlide]);
  const goToDashboard = useCallback(() => startSlide("to-dashboard"), [startSlide]);

  useEffect(() => {
    if (!sliding || !slideDir) return;
    const targetPage = { "to-setup": "setup", "to-welcome": "welcome", "to-dashboard": "dashboard" }[slideDir];
    const el = slideRefs[targetPage]?.current;
    if (el) el.scrollTop = 0;
    const timer = setTimeout(() => {
      setCurrentPage(targetPage);
      setSlideDir(null);
      setSliding(false);
      const path = targetPage === "welcome" ? "/welcome" : targetPage === "setup" ? "/setup" : "/dashboard";
      window.history.pushState({}, "", path);
    }, 570);
    return () => clearTimeout(timer);
  }, [sliding, slideDir]);

  const slideToWelcome = useCallback((afterSlide) => {
    setSlideDir("to-welcome");
    setSliding(true);
    setTimeout(() => {
      setSetupKey((k) => k + 1);
      setCurrentPage("welcome");
      setSlideDir(null);
      setSliding(false);
      window.history.pushState({}, "", "/welcome");
      const el = slideRefs.welcome?.current;
      if (el) el.scrollTop = 0;
      afterSlide?.();
    }, 570);
  }, []);

  const handleFinishWithSlide = useCallback(
    (data) => {
      onFinish(data);
      goToDashboard();
    },
    [onFinish, goToDashboard]
  );

  const getTrackClass = () => {
    if (slideDir) return slideDir;
    if (currentPage === "setup") return "to-setup";
    if (currentPage === "dashboard") return "to-dashboard";
    return "";
  };

  const getSlideClass = (page) => {
    const isCurrent = currentPage === page;
    const isTarget = slideDir === `to-${page}`;
    if (!isCurrent && !isTarget) return "page-transition-slide slide-hidden";
    if (isCurrent && slideDir) return "page-transition-slide slide-fade-out";
    return "page-transition-slide";
  };

  return (
    <div className="page-transition-wrapper">
      <div className={`page-transition-track ${getTrackClass()} ${ready ? "ready" : ""}`}>
        <div ref={slideRefs.welcome} className={getSlideClass("welcome")}>
          <Welcome onDemoClick={goToSetup} />
        </div>
        <div ref={slideRefs.setup} className={getSlideClass("setup")}>
          <SetupPage
            key={setupKey}
            initialData={dashboardData}
            onBack={goToWelcome}
            onFinish={handleFinishWithSlide}
          />
        </div>
        <div ref={slideRefs.dashboard} className={getSlideClass("dashboard")}>
          <DashboardPage
            data={dashboardData}
            onEditForm={goToSetup}
            onLogout={() => {
              onLogout();
              slideToWelcome();
            }}
          />
        </div>
      </div>
    </div>
  );
}
