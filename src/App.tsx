// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Root App Component
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useAppStore } from "./store/appStore";
import { useNotificationScheduler } from "./hooks";
import { AuthPage } from "./pages/AuthPage";
import { Sidebar } from "./components/Sidebar";
import { DashboardModule } from "./modules/dashboard";
import { TimeBlockingModule } from "./modules/time-blocking/TimeBlockingModule";
import { FitnessModule } from "./modules/fitness";
import { PlanningModule } from "./modules/planning";

export default function App() {
  const user = useAppStore((s) => s.user);
  const activeTab = useAppStore((s) => s.activeTab);

  // Start notification scheduler only when logged in
  useNotificationScheduler();

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  if (!user) return <AuthPage />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {activeTab === "dashboard" && <DashboardModule />}
        {activeTab === "time" && <TimeBlockingModule />}
        {activeTab === "fitness" && <FitnessModule />}
        {activeTab === "planning" && <PlanningModule />}
      </main>
    </div>
  );
}
