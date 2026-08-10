import { useEffect, useState } from "react";
import "./App.css";
import Welcome from "./components/Welcome";
import SetupPage from "./components/SetupPage";
import DashboardPage from "./components/DashboardPage";

function App() {
  const [page, setPage] = useState("welcome");
  const [dashboardData, setDashboardData] = useState(null);

  const resetSession = () => {
    setDashboardData(null);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [page]);

  return page === "dashboard" ? (
    <DashboardPage
      data={dashboardData}
      onBack={() => {
        resetSession();
        setPage("demo");
      }}
    />
  ) : page === "demo" ? (
    <SetupPage
      onBack={() => {
        resetSession();
        setPage("welcome");
      }}
      onFinish={(data) => {
        setDashboardData(data);
        setPage("dashboard");
      }}
    />
  ) : (
    <Welcome onDemoClick={() => {
      resetSession();
      setPage("demo");
    }} />
  );
}

export default App;