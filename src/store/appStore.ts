// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Global Store (Zustand)
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import type { User, TimeBlock, Meal, Workout, Exercise, CalendarEvent } from '../types';
import { authService } from '../services/dataService';

// ── Dark mode helper ──────────────────────────────────────────────────────────
const DARK_KEY = 'lifesync_dark';
function initDark(): boolean {
  const saved = localStorage.getItem(DARK_KEY);
  if (saved !== null) return saved === 'true';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
function applyDark(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem(DARK_KEY, String(dark));
}
if (typeof window !== 'undefined') applyDark(initDark());

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;

  activeTab: 'dashboard' | 'time' | 'fitness' | 'planning';
  setActiveTab: (tab: AppState['activeTab']) => void;

  dark: boolean;
  toggleDark: () => void;

  todayBlocks: TimeBlock[];
  setTodayBlocks: (blocks: TimeBlock[]) => void;

  todayMeals: Meal[];
  setTodayMeals: (meals: Meal[]) => void;

  workouts: Workout[];
  setWorkouts: (workouts: Workout[]) => void;

  exercises: Exercise[];
  setExercises: (exercises: Exercise[]) => void;

  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;

  notifPermission: NotificationPermission | 'unsupported';
  setNotifPermission: (p: AppState['notifPermission']) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: authService.getSession(),
  setUser: (user) => set({ user }),
  logout: async () => {
    await authService.logout();
    set({ user: null, todayBlocks: [], todayMeals: [], workouts: [], exercises: [], events: [] });
  },

  activeTab: 'dashboard',
  setActiveTab: (activeTab) => set({ activeTab }),

  dark: initDark(),
  toggleDark: () => {
    const next = !get().dark;
    applyDark(next);
    set({ dark: next });
  },

  todayBlocks: [],
  setTodayBlocks: (todayBlocks) => set({ todayBlocks }),

  todayMeals: [],
  setTodayMeals: (todayMeals) => set({ todayMeals }),

  workouts: [],
  setWorkouts: (workouts) => set({ workouts }),

  exercises: [],
  setExercises: (exercises) => set({ exercises }),

  events: [],
  setEvents: (events) => set({ events }),

  notifPermission: (typeof Notification !== 'undefined'
    ? Notification.permission
    : 'unsupported') as AppState['notifPermission'],
  setNotifPermission: (notifPermission) => set({ notifPermission }),
}));