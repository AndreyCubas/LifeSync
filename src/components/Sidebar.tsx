// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Sidebar Component
// ─────────────────────────────────────────────────────────────────────────────

import React, { JSX, useState } from "react";
import { useAppStore } from "../store/appStore";
import {
  DashboardIcon,
  ClockIcon,
  FitnessIcon,
  CalendarIcon,
  LogoutIcon,
  BellIcon,
  SunIcon,
} from "./ui";
import { requestNotifPermission } from "../services/notificationService";

type TabId = "dashboard" | "time" | "fitness" | "planning";

const NAV_ITEMS: { id: TabId; label: string; icon: () => JSX.Element }[] = [
  { id: "dashboard", label: "Dashboard", icon: DashboardIcon },
  { id: "time", label: "Time Blocking", icon: ClockIcon },
  { id: "fitness", label: "Fitness & Saúde", icon: FitnessIcon },
  { id: "planning", label: "Planeamento", icon: CalendarIcon },
];

export function Sidebar() {
  const user = useAppStore((s) => s.user);
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const logout = useAppStore((s) => s.logout);
  const notifPerm = useAppStore((s) => s.notifPermission);
  const setNotifPerm = useAppStore((s) => s.setNotifPermission);

  const handleNotifRequest = async () => {
    const result = await requestNotifPermission();
    setNotifPerm(result as any);
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between py-6 px-4 flex-shrink-0">
      {/* Logo */}
      <div>
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg">
            <div className="text-white">
              <SunIcon />
            </div>
          </div>
          <span className="text-lg font-bold text-slate-900">LifeSync</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1.5 mb-8">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all duration-200 ${
                activeTab === id
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <span
                className={`flex-shrink-0 ${
                  activeTab === id ? "text-indigo-600" : "text-slate-400"
                }`}
              >
                <Icon />
              </span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Notification prompt */}
        {notifPerm === "default" && (
          <button
            onClick={handleNotifRequest}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors duration-200"
          >
            <span className="flex-shrink-0 text-amber-600">
              <BellIcon />
            </span>
            <span>Ativar notificações</span>
          </button>
        )}
        {notifPerm === "granted" && (
          <div className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-emerald-700 bg-emerald-50 border border-emerald-200">
            <span className="flex-shrink-0 text-emerald-600">
              <BellIcon />
            </span>
            Notificações ativas
          </div>
        )}
      </div>

      {/* User info + logout */}
      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.name}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <LogoutIcon />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
}
