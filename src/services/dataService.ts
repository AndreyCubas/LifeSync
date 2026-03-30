// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Data Service
//
// Provides a unified CRUD interface that works with either:
//   - Supabase (when configured via .env)
//   - localStorage (automatic fallback for offline / demo use)
//
// Consumers (hooks, components) never need to know which backend is active.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseConfigured, TABLES } from '../lib/supabase';
import { genId } from '../lib/utils';
import type {
  User, TimeBlock, TimeBlockFormData,
  Meal, MealFormData,
  Workout, WorkoutFormData,
  Exercise, ExerciseFormData,
  CalendarEvent, EventFormData,
  DbResult, DbListResult,
} from '../types';

// ── Password hashing (demo-grade, NOT production crypto) ──────────────────────
function hashPassword(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return 'h_' + Math.abs(h).toString(36);
}

// ── localStorage helpers ──────────────────────────────────────────────────────
const ls = {
  get<T>(key: string): T | null {
    try { return JSON.parse(localStorage.getItem('ls_' + key) ?? 'null'); }
    catch { return null; }
  },
  set<T>(key: string, value: T): void {
    localStorage.setItem('ls_' + key, JSON.stringify(value));
  },
  forUser<T>(userId: string, table: string): T[] {
    return ls.get<T[]>(`${userId}_${table}`) ?? [];
  },
  saveForUser<T>(userId: string, table: string, data: T[]): void {
    ls.set(`${userId}_${table}`, data);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const authService = {
  async register(name: string, email: string, password: string): Promise<DbResult<User>> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) return { data: null, error: error.message };
      const user: User = {
        id: data.user!.id,
        name,
        email,
        createdAt: new Date().toISOString(),
      };
      return { data: user, error: null };
    }

    // localStorage fallback
    const users = ls.get<Array<User & { passwordHash: string }>>('users') ?? [];
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { data: null, error: 'E-mail já cadastrado.' };
    }
    const user: User = { id: genId(), name: name.trim(), email: email.toLowerCase(), createdAt: new Date().toISOString() };
    users.push({ ...user, passwordHash: hashPassword(password) });
    ls.set('users', users);
    return { data: user, error: null };
  },

  async login(email: string, password: string): Promise<DbResult<User>> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { data: null, error: error.message };
      const user: User = {
        id: data.user!.id,
        name: data.user!.user_metadata?.name ?? email,
        email,
        createdAt: data.user!.created_at,
      };
      return { data: user, error: null };
    }

    const users = ls.get<Array<User & { passwordHash: string }>>('users') ?? [];
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { data: null, error: 'E-mail não encontrado.' };
    if (found.passwordHash !== hashPassword(password)) return { data: null, error: 'Senha incorreta.' };
    const { passwordHash: _, ...user } = found;
    return { data: user, error: null };
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    localStorage.removeItem('ls_session');
  },

  getSession(): User | null {
    if (isSupabaseConfigured) return null; // handled by Supabase listener
    return ls.get<User>('session');
  },

  saveSession(user: User): void {
    ls.set('session', user);
  },

  clearSession(): void {
    localStorage.removeItem('ls_session');
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TIME BLOCKS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const blocksService = {
  async list(userId: string, date: string): Promise<DbListResult<TimeBlock>> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from(TABLES.TIME_BLOCKS)
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('start_time');
      return { data: data ?? [], error: error?.message ?? null };
    }
    const all = ls.forUser<TimeBlock>(userId, 'blocks');
    return { data: all.filter((b) => b.date === date), error: null };
  },

  async create(userId: string, form: TimeBlockFormData): Promise<DbResult<TimeBlock>> {
    const block: TimeBlock = {
      id: genId(), user_id: userId,
      title: form.title, start_time: form.start_time,
      end_time: form.end_time, category: form.category,
      date: form.date, created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from(TABLES.TIME_BLOCKS).insert(block).select().single();
      return { data, error: error?.message ?? null };
    }
    const all = ls.forUser<TimeBlock>(userId, 'blocks');
    ls.saveForUser(userId, 'blocks', [...all, block]);
    return { data: block, error: null };
  },

  async update(userId: string, id: string, form: Partial<TimeBlockFormData>): Promise<DbResult<TimeBlock>> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from(TABLES.TIME_BLOCKS).update(form).eq('id', id).select().single();
      return { data, error: error?.message ?? null };
    }
    const all = ls.forUser<TimeBlock>(userId, 'blocks');
    const updated = all.map((b) => (b.id === id ? { ...b, ...form } : b));
    ls.saveForUser(userId, 'blocks', updated);
    return { data: updated.find((b) => b.id === id) ?? null, error: null };
  },

  async delete(userId: string, id: string): Promise<DbResult<null>> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from(TABLES.TIME_BLOCKS).delete().eq('id', id);
      return { data: null, error: error?.message ?? null };
    }
    const all = ls.forUser<TimeBlock>(userId, 'blocks');
    ls.saveForUser(userId, 'blocks', all.filter((b) => b.id !== id));
    return { data: null, error: null };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MEALS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const mealsService = {
  async list(userId: string, date: string): Promise<DbListResult<Meal>> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from(TABLES.MEALS).select('*').eq('user_id', userId).eq('date', date).order('time');
      return { data: data ?? [], error: error?.message ?? null };
    }
    const all = ls.forUser<Meal>(userId, 'meals');
    return { data: all.filter((m) => m.date === date), error: null };
  },

  async create(userId: string, date: string, form: MealFormData): Promise<DbResult<Meal>> {
    const meal: Meal = {
      id: genId(), user_id: userId, date,
      name: form.name, time: form.time,
      protein: Number(form.protein) || 0, carbs: Number(form.carbs) || 0,
      fats: Number(form.fats) || 0, fiber: Number(form.fiber) || 0,
      notes: form.notes || undefined, created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from(TABLES.MEALS).insert(meal).select().single();
      return { data, error: error?.message ?? null };
    }
    const all = ls.forUser<Meal>(userId, 'meals');
    ls.saveForUser(userId, 'meals', [...all, meal]);
    return { data: meal, error: null };
  },

  async update(userId: string, id: string, form: Partial<MealFormData>): Promise<DbResult<Meal>> {
    const patch = {
      ...form,
      protein: form.protein !== undefined ? Number(form.protein) || 0 : undefined,
      carbs:   form.carbs   !== undefined ? Number(form.carbs)   || 0 : undefined,
      fats:    form.fats    !== undefined ? Number(form.fats)    || 0 : undefined,
      fiber:   form.fiber   !== undefined ? Number(form.fiber)   || 0 : undefined,
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from(TABLES.MEALS).update(patch).eq('id', id).select().single();
      return { data, error: error?.message ?? null };
    }
    const all = ls.forUser<Meal>(userId, 'meals');
    const updated = all.map((m) => (m.id === id ? { ...m, ...patch } : m));
    ls.saveForUser(userId, 'meals', updated);
    return { data: updated.find((m) => m.id === id) ?? null, error: null };
  },

  async delete(userId: string, id: string): Promise<DbResult<null>> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from(TABLES.MEALS).delete().eq('id', id);
      return { data: null, error: error?.message ?? null };
    }
    const all = ls.forUser<Meal>(userId, 'meals');
    ls.saveForUser(userId, 'meals', all.filter((m) => m.id !== id));
    return { data: null, error: null };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// WORKOUTS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const workoutsService = {
  async list(userId: string): Promise<DbListResult<Workout>> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from(TABLES.WORKOUTS).select('*').eq('user_id', userId).order('date', { ascending: false });
      return { data: data ?? [], error: error?.message ?? null };
    }
    const all = ls.forUser<Workout>(userId, 'workouts');
    return { data: [...all].sort((a, b) => b.date.localeCompare(a.date)), error: null };
  },

  async create(userId: string, form: WorkoutFormData): Promise<DbResult<Workout>> {
    const workout: Workout = {
      id: genId(), user_id: userId, name: form.name,
      date: form.date, notes: form.notes, created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from(TABLES.WORKOUTS).insert(workout).select().single();
      return { data, error: error?.message ?? null };
    }
    const all = ls.forUser<Workout>(userId, 'workouts');
    ls.saveForUser(userId, 'workouts', [...all, workout]);
    return { data: workout, error: null };
  },

  async update(userId: string, id: string, form: Partial<WorkoutFormData>): Promise<DbResult<Workout>> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from(TABLES.WORKOUTS).update(form).eq('id', id).select().single();
      return { data, error: error?.message ?? null };
    }
    const all = ls.forUser<Workout>(userId, 'workouts');
    const updated = all.map((w) => (w.id === id ? { ...w, ...form } : w));
    ls.saveForUser(userId, 'workouts', updated);
    return { data: updated.find((w) => w.id === id) ?? null, error: null };
  },

  async delete(userId: string, id: string): Promise<DbResult<null>> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from(TABLES.WORKOUTS).delete().eq('id', id);
      return { data: null, error: error?.message ?? null };
    }
    const all = ls.forUser<Workout>(userId, 'workouts');
    ls.saveForUser(userId, 'workouts', all.filter((w) => w.id !== id));
    return { data: null, error: null };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISES SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const exercisesService = {
  async listForWorkout(userId: string, workoutId: string): Promise<DbListResult<Exercise>> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from(TABLES.EXERCISES).select('*').eq('workout_id', workoutId).order('id');
      return { data: data ?? [], error: error?.message ?? null };
    }
    const all = ls.forUser<Exercise>(userId, 'exercises');
    return { data: all.filter((e) => e.workout_id === workoutId), error: null };
  },

  async listAll(userId: string): Promise<DbListResult<Exercise>> {
    if (isSupabaseConfigured) {
      // Join with workouts to get date
      const { data, error } = await supabase
        .from(TABLES.EXERCISES)
        .select('*, workouts(date, user_id)')
        .eq('workouts.user_id', userId);
      return { data: data ?? [], error: error?.message ?? null };
    }
    return { data: ls.forUser<Exercise>(userId, 'exercises'), error: null };
  },

  async create(userId: string, workoutId: string, form: ExerciseFormData): Promise<DbResult<Exercise>> {
    const exercise: Exercise = {
      id: genId(), workout_id: workoutId,
      exercise_name: form.exercise_name,
      sets: Number(form.sets) || 0, reps: Number(form.reps) || 0,
      weight: Number(form.weight) || 0, notes: form.notes,
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from(TABLES.EXERCISES).insert(exercise).select().single();
      return { data, error: error?.message ?? null };
    }
    const all = ls.forUser<Exercise>(userId, 'exercises');
    ls.saveForUser(userId, 'exercises', [...all, exercise]);
    return { data: exercise, error: null };
  },

  async update(userId: string, id: string, form: Partial<ExerciseFormData>): Promise<DbResult<Exercise>> {
    const patch = {
      ...form,
      sets:   form.sets   !== undefined ? Number(form.sets)   || 0 : undefined,
      reps:   form.reps   !== undefined ? Number(form.reps)   || 0 : undefined,
      weight: form.weight !== undefined ? Number(form.weight) || 0 : undefined,
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from(TABLES.EXERCISES).update(patch).eq('id', id).select().single();
      return { data, error: error?.message ?? null };
    }
    const all = ls.forUser<Exercise>(userId, 'exercises');
    const updated = all.map((e) => (e.id === id ? { ...e, ...patch } : e));
    ls.saveForUser(userId, 'exercises', updated);
    return { data: updated.find((e) => e.id === id) ?? null, error: null };
  },

  async delete(userId: string, id: string): Promise<DbResult<null>> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from(TABLES.EXERCISES).delete().eq('id', id);
      return { data: null, error: error?.message ?? null };
    }
    const all = ls.forUser<Exercise>(userId, 'exercises');
    ls.saveForUser(userId, 'exercises', all.filter((e) => e.id !== id));
    return { data: null, error: null };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const eventsService = {
  async list(userId: string): Promise<DbListResult<CalendarEvent>> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from(TABLES.EVENTS).select('*').eq('user_id', userId).order('date');
      return { data: data ?? [], error: error?.message ?? null };
    }
    const all = ls.forUser<CalendarEvent>(userId, 'events');
    return { data: [...all].sort((a, b) => a.date.localeCompare(b.date)), error: null };
  },

  async create(userId: string, form: EventFormData): Promise<DbResult<CalendarEvent>> {
    const event: CalendarEvent = {
      id: genId(), user_id: userId, title: form.title,
      date: form.date, type: form.type, notes: form.notes || undefined,
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from(TABLES.EVENTS).insert(event).select().single();
      return { data, error: error?.message ?? null };
    }
    const all = ls.forUser<CalendarEvent>(userId, 'events');
    ls.saveForUser(userId, 'events', [...all, event]);
    return { data: event, error: null };
  },

  async update(userId: string, id: string, form: Partial<EventFormData>): Promise<DbResult<CalendarEvent>> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from(TABLES.EVENTS).update(form).eq('id', id).select().single();
      return { data, error: error?.message ?? null };
    }
    const all = ls.forUser<CalendarEvent>(userId, 'events');
    const updated = all.map((e) => (e.id === id ? { ...e, ...form } : e));
    ls.saveForUser(userId, 'events', updated);
    return { data: updated.find((e) => e.id === id) ?? null, error: null };
  },

  async delete(userId: string, id: string): Promise<DbResult<null>> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from(TABLES.EVENTS).delete().eq('id', id);
      return { data: null, error: error?.message ?? null };
    }
    const all = ls.forUser<CalendarEvent>(userId, 'events');
    ls.saveForUser(userId, 'events', all.filter((e) => e.id !== id));
    return { data: null, error: null };
  },
};