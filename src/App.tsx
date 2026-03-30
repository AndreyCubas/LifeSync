// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Root App Component
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useAppStore } from "./store/appStore";
import {
  initializeSupabaseAuth,
  checkAuthStatus,
} from "./store/initializeAuth";
import { printDiagnostics } from "./lib/debug";
import { useNotificationScheduler } from "./hooks";
import { AuthPage } from "./pages/AuthPage";
import { Sidebar } from "./components/Sidebar";
import { DashboardModule } from "./modules/dashboard";
import { TimeBlockingModule } from "./modules/time-blocking/TimeBlockingModule";
import { FitnessModule } from "./modules/fitness";
import { PlanningModule } from "./modules/planning";

export default function App() {
  const user = useAppStore((s) => s.user);
  const isAuthLoading = useAppStore((s) => s.isAuthLoading);
  const setAuthLoading = useAppStore((s) => s.setAuthLoading);
  const activeTab = useAppStore((s) => s.activeTab);

  // Initialize Supabase auth listener on app mount
  useEffect(() => {
    const initAuth = async () => {
      // Print diagnostics
      await printDiagnostics();

      // Set up auth listener
      initializeSupabaseAuth();

      // Check current auth status
      const currentUser = await checkAuthStatus();
      if (currentUser) {
        useAppStore.getState().setUser(currentUser);
      }

      setAuthLoading(false);
    };

    initAuth();
  }, [setAuthLoading]);

  // Start notification scheduler only when logged in
  useNotificationScheduler();

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  // Show loading state while auth is being checked
  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">A carregar autenticação...</p>
        </div>
      </div>
    );
  }

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
