// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Global Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Session {
  user: User;
  token: string;
}

// ── Time Blocking ─────────────────────────────────────────────────────────────

export type BlockCategory =
  | 'Estudo'
  | 'Trabalho'
  | 'Pausa'
  | 'Almoço'
  | 'Transporte'
  | 'Lazer'
  | 'Treino'
  | 'Sono';

export interface TimeBlock {
  id: string;
  user_id: string;
  title: string;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  category: BlockCategory;
  date: string;       // "YYYY-MM-DD"
  created_at: string;
}

export interface TimeBlockFormData {
  title: string;
  start_time: string;
  end_time: string;
  category: BlockCategory;
  date: string;
}

export interface TimeGap {
  start: string;
  end: string;
  durationMinutes: number;
}

export interface CategorySummary {
  category: BlockCategory;
  totalMinutes: number;
  percentage: number;
}

// ── Nutrition ─────────────────────────────────────────────────────────────────

export interface Meal {
  id: string;
  user_id: string;
  date: string;       // "YYYY-MM-DD"
  name: string;
  time: string;       // "HH:MM"
  protein: number;    // grams
  carbs: number;      // grams
  fats: number;       // grams
  fiber: number;      // grams
  notes?: string;
  created_at: string;
}

export interface MealFormData {
  name: string;
  time: string;
  protein: number | string;
  carbs: number | string;
  fats: number | string;
  fiber: number | string;
  notes: string;
}

export interface MacroTotals {
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  calories: number;
}

export interface MacroGoals {
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

// ── Fitness ───────────────────────────────────────────────────────────────────

export interface Workout {
  id: string;
  user_id: string;
  date: string;       // "YYYY-MM-DD"
  name: string;
  notes?: string;
  created_at: string;
}

export interface WorkoutFormData {
  name: string;
  date: string;
  notes?: string;
}

export interface Exercise {
  id: string;
  workout_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;     // kg
  rest_seconds?: number;
  notes?: string;
}

export interface ExerciseFormData {
  exercise_name: string;
  sets: number | string;
  reps: number | string;
  weight: number | string;
  notes?: string;
}

export interface ExerciseHistory {
  exercise_name: string;
  entries: Array<{
    date: string;
    sets: number;
    reps: number;
    weight: number;
  }>;
  trend: 'up' | 'down' | 'stable';
  lastDelta: number;
}

// ── Planning ──────────────────────────────────────────────────────────────────

export type EventType = BlockCategory;

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  date: string;       // "YYYY-MM-DD"
  type: EventType;
  notes?: string;
  created_at: string;
}

export interface EventFormData {
  title: string;
  date: string;
  type: EventType;
  notes: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  currentBlock: TimeBlock | null;
  nextBlock: TimeBlock | null;
  todayMacros: MacroTotals;
  mealCount: number;
  dayProgressPercent: number;
  categorySummary: CategorySummary[];
  upcomingEvents: CalendarEvent[];
  lastWorkout: Workout | null;
  lastWorkoutExercises: Exercise[];
  mealSuggestion: TimeBlock | null;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface NotificationConfig {
  id: string;
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  scheduledFor?: Date;
}

// ── Supabase / DB ─────────────────────────────────────────────────────────────

export type DbResult<T> = {
  data: T | null;
  error: string | null;
};

export type DbListResult<T> = {
  data: T[];
  error: string | null;
};