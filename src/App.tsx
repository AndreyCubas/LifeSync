// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Root App Component
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useAppStore } from "./store/appStore";
import { useNotificationScheduler } from "./hooks";
import { AuthPage } from "./pages/AuthPage";
import { Sidebar } from "./components/Sidebar";
import { DashboardModule } from "./modules/dashboard/DashboardModule";
import { TimeBlockingModule } from "./modules/time-blocking/TimeBlockingModule";
import { FitnessModule } from "./modules/fitness/FitnessModule";
import { PlanningModule } from "./modules/planning/PlanningModule";

export default function App() {
  const user = useAppStore((s) => s.user);
  const activeTab = useAppStore((s) => s.activeTab);
  const dark = useAppStore((s) => s.dark);

  useNotificationScheduler();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  if (!user) return <AuthPage />;

  return (
    <div
      className={`flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans`}
    >
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        {activeTab === "dashboard" && <DashboardModule />}
        {activeTab === "time" && <TimeBlockingModule />}
        {activeTab === "fitness" && <FitnessModule />}
        {activeTab === "planning" && <PlanningModule />}
      </main>
    </div>
  );
}
