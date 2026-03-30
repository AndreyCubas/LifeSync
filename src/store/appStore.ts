// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Global Store (Zustand)
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, TimeBlock, Meal, Workout, Exercise, CalendarEvent } from '../types';
import { authService } from '../services/dataService';

interface AppState {
  // ── Auth ──────────────────────────────────────────────────────────────────
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  isAuthLoading: boolean;
  setAuthLoading: (loading: boolean) => void;

  // ── Active tab ────────────────────────────────────────────────────────────
  activeTab: 'dashboard' | 'time' | 'fitness' | 'planning';
  setActiveTab: (tab: AppState['activeTab']) => void;

  // ── Time Blocks (today cache) ─────────────────────────────────────────────
  todayBlocks: TimeBlock[];
  setTodayBlocks: (blocks: TimeBlock[]) => void;

  // ── Meals (today cache) ───────────────────────────────────────────────────
  todayMeals: Meal[];
  setTodayMeals: (meals: Meal[]) => void;

  // ── Workouts cache ────────────────────────────────────────────────────────
  workouts: Workout[];
  setWorkouts: (workouts: Workout[]) => void;

  // ── Exercises cache (all) ─────────────────────────────────────────────────
  exercises: Exercise[];
  setExercises: (exercises: Exercise[]) => void;

  // ── Events cache ─────────────────────────────────────────────────────────
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;

  // ── Notification permission ───────────────────────────────────────────────
  notifPermission: NotificationPermission | 'unsupported';
  setNotifPermission: (p: AppState['notifPermission']) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),
      isAuthLoading: true,
      setAuthLoading: (isAuthLoading) => set({ isAuthLoading }),
      logout: async () => {
        await authService.logout();
        set({ user: null, todayBlocks: [], todayMeals: [], workouts: [], exercises: [], events: [] });
      },

      // Nav
      activeTab: 'dashboard',
      setActiveTab: (activeTab) => set({ activeTab }),

      // Data caches
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

      // Notifications
      notifPermission: ('Notification' in window ? Notification.permission : 'unsupported') as AppState['notifPermission'],
      setNotifPermission: (notifPermission) => set({ notifPermission }),
    }),
    { name: 'LifeSync' }
  )
);