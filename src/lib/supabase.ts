// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Supabase Client
//
// HOW TO CONNECT SUPABASE:
//   1. Create a project at https://supabase.com
//   2. Copy your Project URL and anon key
//   3. Create a `.env` file at the project root:
//        VITE_SUPABASE_URL=https://xxxx.supabase.co
//        VITE_SUPABASE_ANON_KEY=your-anon-key
//   4. Run the SQL migration in /supabase/migrations/001_init.sql
//
// WITHOUT .env, the app falls back to localStorage automatically.
// ─────────────────────────────────────────────────────────────────────────────

/// <reference types="vite/client" />

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured =
  Boolean(SUPABASE_URL) && Boolean(SUPABASE_KEY) &&
  SUPABASE_URL !== 'your-project-url' &&
  SUPABASE_KEY !== 'your-anon-key';

/** Typed Supabase client — only use when isSupabaseConfigured is true */
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_KEY!)
  : (null as unknown as SupabaseClient);

// ─────────────────────────────────────────────────────────────────────────────
// Database table names
// ─────────────────────────────────────────────────────────────────────────────

export const TABLES = {
  USERS:      'users',
  TIME_BLOCKS:'time_blocks',
  MEALS:      'meals',
  WORKOUTS:   'workouts',
  EXERCISES:  'workout_exercises',
  EVENTS:     'events',
} as const;