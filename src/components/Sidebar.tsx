// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Sidebar (with Dark Mode toggle)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import {
  DashboardIcon, ClockIcon, FitnessIcon, CalendarIcon,
  LogoutIcon, BellIcon, SunIcon,
} from './ui';
import { requestNotifPermission } from '../services/notificationService';

type TabId = 'dashboard' | 'time' | 'fitness' | 'planning';

const NAV_ITEMS: { id: TabId; label: string; icon: () => JSX.Element }[] = [
  { id: 'dashboard', label: 'Dashboard',      icon: DashboardIcon },
  { id: 'time',      label: 'Time Blocking',   icon: ClockIcon     },
  { id: 'fitness',   label: 'Fitness & Saúde', icon: FitnessIcon   },
  { id: 'planning',  label: 'Planeamento',     icon: CalendarIcon  },
];

// ── Moon / Sun icons ──────────────────────────────────────────────────────────
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}
function SunToggleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

export function Sidebar() {
  const user         = useAppStore(s => s.user);
  const activeTab    = useAppStore(s => s.activeTab);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const logout       = useAppStore(s => s.logout);
  const dark         = useAppStore(s => s.dark);
  const toggleDark   = useAppStore(s => s.toggleDark);
  const notifPerm    = useAppStore(s => s.notifPermission);
  const setNotifPerm = useAppStore(s => s.setNotifPermission);

  const handleNotif = async () => {
    const result = await requestNotifPermission();
    setNotifPerm(result as any);
  };

  return (
    <aside className="
      w-56 flex-shrink-0 flex flex-col justify-between py-5 px-3
      bg-white dark:bg-slate-900
      border-r border-slate-100 dark:border-slate-800
    ">
      {/* ── Top ── */}
      <div>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow shadow-indigo-200">
            <div className="text-white scale-75"><SunIcon /></div>
          </div>
          <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">LifeSync</span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all duration-150 ${
                activeTab === id
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
              }`}>
              <span className={activeTab === id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}>
                <Icon />
              </span>
              {label}
            </button>
          ))}
        </nav>

        {/* Dark mode toggle */}
        <div className="mt-4 px-1">
          <button
            onClick={toggleDark}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-slate-400 dark:text-slate-500">
                {dark ? <SunToggleIcon /> : <MoonIcon />}
              </span>
              <span>{dark ? 'Modo claro' : 'Modo escuro'}</span>
            </div>
            {/* Toggle pill */}
            <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${dark ? 'bg-indigo-600' : 'bg-slate-200'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${dark ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </div>

        {/* Notification prompt */}
        {notifPerm === 'default' && (
          <button onClick={handleNotif}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900 border border-amber-200 dark:border-amber-800 transition-colors">
            <span className="text-amber-600"><BellIcon /></span>
            Ativar notificações
          </button>
        )}
        {notifPerm === 'granted' && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
            <span><BellIcon /></span> Notificações ativas
          </div>
        )}
      </div>

      {/* ── Bottom: user + logout ── */}
      <div className="flex flex-col gap-2">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all w-full">
          <LogoutIcon /> Sair da conta
        </button>
      </div>
    </aside>
  );
}