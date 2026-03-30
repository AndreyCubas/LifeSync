// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Custom Hooks
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { blocksService, mealsService, workoutsService, exercisesService, eventsService } from '../services/dataService';
import { startNotificationScheduler } from '../services/notificationService';
import { todayISO } from '../lib/utils';

// ── Live clock hook ───────────────────────────────────────────────────────────

export function useClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}

// ── Today's blocks ────────────────────────────────────────────────────────────

export function useTodayBlocks() {
  const user        = useAppStore((s) => s.user);
  const todayBlocks = useAppStore((s) => s.todayBlocks);
  const setBlocks   = useAppStore((s) => s.setTodayBlocks);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await blocksService.list(user.id, todayISO());
    setBlocks(data);
    setLoading(false);
  }, [user, setBlocks]);

  useEffect(() => { refresh(); }, [refresh]);

  return { blocks: todayBlocks, loading, refresh };
}

// ── Blocks for a specific date ────────────────────────────────────────────────

export function useBlocksForDate(date: string) {
  const user = useAppStore((s) => s.user);
  const [blocks, setBlocks]   = useState<import('../types').TimeBlock[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await blocksService.list(user.id, date);
    setBlocks(data);
    setLoading(false);
  }, [user, date]);

  useEffect(() => { refresh(); }, [refresh]);

  return { blocks, loading, refresh, setBlocks };
}

// ── Meals for a specific date ─────────────────────────────────────────────────

export function useMealsForDate(date: string) {
  const user = useAppStore((s) => s.user);
  const [meals, setMeals]     = useState<import('../types').Meal[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await mealsService.list(user.id, date);
    setMeals(data);
    setLoading(false);
  }, [user, date]);

  useEffect(() => { refresh(); }, [refresh]);

  return { meals, loading, refresh, setMeals };
}

// ── All workouts ──────────────────────────────────────────────────────────────

export function useWorkouts() {
  const user     = useAppStore((s) => s.user);
  const workouts = useAppStore((s) => s.workouts);
  const setWorks = useAppStore((s) => s.setWorkouts);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await workoutsService.list(user.id);
    setWorks(data);
    setLoading(false);
  }, [user, setWorks]);

  useEffect(() => { refresh(); }, [refresh]);

  return { workouts, loading, refresh };
}

// ── Exercises for a workout ───────────────────────────────────────────────────

export function useExercisesForWorkout(workoutId: string | null) {
  const user = useAppStore((s) => s.user);
  const [exercises, setExercises] = useState<import('../types').Exercise[]>([]);
  const [loading, setLoading]     = useState(false);

  const refresh = useCallback(async () => {
    if (!user || !workoutId) { setExercises([]); return; }
    setLoading(true);
    const { data } = await exercisesService.listForWorkout(user.id, workoutId);
    setExercises(data);
    setLoading(false);
  }, [user, workoutId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { exercises, loading, refresh, setExercises };
}

// ── All exercises (for progress tracking) ────────────────────────────────────

export function useAllExercises() {
  const user       = useAppStore((s) => s.user);
  const exercises  = useAppStore((s) => s.exercises);
  const setEx      = useAppStore((s) => s.setExercises);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await exercisesService.listAll(user.id);
    setEx(data);
    setLoading(false);
  }, [user, setEx]);

  useEffect(() => { refresh(); }, [refresh]);

  return { exercises, loading, refresh };
}

// ── Calendar events ───────────────────────────────────────────────────────────

export function useEvents() {
  const user      = useAppStore((s) => s.user);
  const events    = useAppStore((s) => s.events);
  const setEvents = useAppStore((s) => s.setEvents);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await eventsService.list(user.id);
    setEvents(data);
    setLoading(false);
  }, [user, setEvents]);

  useEffect(() => { refresh(); }, [refresh]);

  return { events, loading, refresh };
}

// ── Notification scheduler ────────────────────────────────────────────────────

export function useNotificationScheduler() {
  const todayBlocks  = useAppStore((s) => s.todayBlocks);
  const todayMeals   = useAppStore((s) => s.todayMeals);
  const events       = useAppStore((s) => s.events);

  const blocksRef = useRef(todayBlocks);
  const mealsRef  = useRef(todayMeals);
  const eventsRef = useRef(events);

  useEffect(() => { blocksRef.current = todayBlocks; }, [todayBlocks]);
  useEffect(() => { mealsRef.current  = todayMeals;  }, [todayMeals]);
  useEffect(() => { eventsRef.current = events;       }, [events]);

  useEffect(() => {
    const stop = startNotificationScheduler(
      () => blocksRef.current,
      () => mealsRef.current,
      () => eventsRef.current
    );
    return stop;
  }, []);
}

// ── Local form state helper ───────────────────────────────────────────────────

export function useFormState<T extends object>(initial: T) {
  const [form, setForm] = useState<T>(initial);
  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);
  const reset = useCallback(() => setForm(initial), [initial]);
  return { form, set, reset, setForm };
}