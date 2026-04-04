// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

import type { MacroTotals, Meal, TimeBlock, TimeGap, CategorySummary } from '../types';

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Returns today as "YYYY-MM-DD" */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/** Returns "YYYY-MM-DD" for any Date object */
export function toDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Returns offset date from today as ISO string */
export function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateISO(d);
}

/** Formats "YYYY-MM-DD" → "DD/MM/YYYY" */
export function fmtDatePT(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Returns how many days until a date (0 = today, negative = past) */
export function daysUntil(iso: string): number {
  const target = new Date(iso + 'T00:00:00');
  const now    = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

/** Gets all days in a calendar month grid (null = empty padding cell) */
export function calendarGrid(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const grid: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) grid.push(null);
  for (let d = 1; d <= totalDays; d++) grid.push(d);
  return grid;
}

/** Zero-pads a number to 2 digits */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

// ── Time helpers ──────────────────────────────────────────────────────────────

/** "HH:MM" → total minutes from midnight */
export function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Minutes from midnight → "HH:MM" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

/** Formats "HH:MM" for display */
export function fmtTime(time: string): string {
  if (!time) return '—';
  const [h, m] = time.split(':').map(Number);
  return `${pad2(h)}:${pad2(m)}`;
}

/** Returns block duration in minutes (0 if invalid) */
export function blockDurationMinutes(block: Pick<TimeBlock, 'start_time' | 'end_time'>): number {
  const start = timeToMinutes(block.start_time);
  const end   = timeToMinutes(block.end_time);
  return end > start ? end - start : 0;
}

/** Returns current time as "HH:MM" */
export function nowTime(): string {
  const n = new Date();
  return `${pad2(n.getHours())}:${pad2(n.getMinutes())}`;
}

/** Returns current time in minutes from midnight */
export function nowMinutes(): number {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

/** Check if a block is currently active */
export function isBlockActive(block: TimeBlock): boolean {
  const now = nowMinutes();
  return timeToMinutes(block.start_time) <= now && now < timeToMinutes(block.end_time);
}

/** Check if a block is in the past */
export function isBlockPast(block: TimeBlock): boolean {
  return timeToMinutes(block.end_time) <= nowMinutes();
}

// ── Block analysis ────────────────────────────────────────────────────────────

/** Detects free time gaps between sorted blocks */
export function detectGaps(blocks: TimeBlock[]): TimeGap[] {
  const sorted = [...blocks].sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
  );
  const gaps: TimeGap[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const gapStart = timeToMinutes(sorted[i].end_time);
    const gapEnd   = timeToMinutes(sorted[i + 1].start_time);
    const dur = gapEnd - gapStart;
    if (dur >= 15) {
      gaps.push({
        start: minutesToTime(gapStart),
        end:   minutesToTime(gapEnd),
        durationMinutes: dur,
      });
    }
  }
  return gaps;
}

/** Builds per-category time summaries for a set of blocks */
export function buildCategorySummary(blocks: TimeBlock[]): CategorySummary[] {
  const totals: Partial<Record<string, number>> = {};
  let grandTotal = 0;
  for (const b of blocks) {
    const dur = blockDurationMinutes(b);
    totals[b.category] = (totals[b.category] ?? 0) + dur;
    grandTotal += dur;
  }
  return Object.entries(totals)
    .map(([category, totalMinutes]) => ({
      category: category as any,
      totalMinutes: totalMinutes ?? 0,
      percentage: grandTotal > 0 ? Math.round(((totalMinutes ?? 0) / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
}

/** Finds the first upcoming pause block suitable for a meal */
export function findMealSuggestion(blocks: TimeBlock[]): TimeBlock | null {
  const now = nowMinutes();
  return (
    blocks
      .filter(
        (b) =>
          b.category === 'Pausa' &&
          blockDurationMinutes(b) >= 30 &&
          timeToMinutes(b.start_time) > now
      )
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))[0] ?? null
  );
}

// ── Nutrition helpers ─────────────────────────────────────────────────────────

/** Sums macros from a list of meals */
export function sumMacros(meals: Meal[]): MacroTotals {
  const totals = meals.reduce(
    (acc, m) => ({
      protein: acc.protein + (Number(m.protein) || 0),
      carbs:   acc.carbs   + (Number(m.carbs)   || 0),
      fats:    acc.fats    + (Number(m.fats)     || 0),
      fiber:   acc.fiber   + (Number(m.fiber)    || 0),
    }),
    { protein: 0, carbs: 0, fats: 0, fiber: 0 }
  );
  return {
    ...totals,
    calories: Math.round(totals.protein * 4 + totals.carbs * 4 + totals.fats * 9),
  };
}

/** Macro progress as percentage (capped at 100) */
export function macroPercent(value: number, goal: number): number {
  return Math.min(100, Math.round((value / goal) * 100));
}

// ── Misc ──────────────────────────────────────────────────────────────────────

/** Formats minutes as "Xh Ym" */
export function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Generates a UUID v4 (required by Supabase PostgreSQL UUID columns) */
export function genId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/** Escape HTML for safe rendering */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Clamps a number between min and max */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}