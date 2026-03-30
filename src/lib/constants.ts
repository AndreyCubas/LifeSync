import type { BlockCategory, MacroGoals } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Category configuration
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORY_CONFIG: Record<
  BlockCategory,
  { color: string; bg: string; border: string; tailwind: string }
> = {
  Estudo:     { color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', tailwind: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  Trabalho:   { color: '#0ea5e9', bg: '#e0f2fe', border: '#bae6fd', tailwind: 'bg-sky-50 text-sky-600 border-sky-200' },
  Pausa:      { color: '#10b981', bg: '#d1fae5', border: '#a7f3d0', tailwind: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  Almoço:     { color: '#f59e0b', bg: '#fef3c7', border: '#fde68a', tailwind: 'bg-amber-50 text-amber-600 border-amber-200' },
  Transporte: { color: '#8b5cf6', bg: '#ede9fe', border: '#ddd6fe', tailwind: 'bg-violet-50 text-violet-600 border-violet-200' },
  Lazer:      { color: '#ec4899', bg: '#fce7f3', border: '#fbcfe8', tailwind: 'bg-pink-50 text-pink-600 border-pink-200' },
  Treino:     { color: '#ef4444', bg: '#fee2e2', border: '#fecaca', tailwind: 'bg-red-50 text-red-600 border-red-200' },
  Sono:       { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', tailwind: 'bg-slate-50 text-slate-500 border-slate-200' },
};

export const BLOCK_CATEGORIES: BlockCategory[] = [
  'Estudo', 'Trabalho', 'Pausa', 'Almoço', 'Transporte', 'Lazer', 'Treino', 'Sono',
];

// ─────────────────────────────────────────────────────────────────────────────
// Macro goals (daily targets in grams)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_MACRO_GOALS: MacroGoals = {
  protein: 150,
  carbs: 250,
  fats: 65,
  fiber: 30,
};

// ─────────────────────────────────────────────────────────────────────────────
// Locale constants
// ─────────────────────────────────────────────────────────────────────────────

export const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
export const DAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] as const;
export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Exercise autocomplete list
// ─────────────────────────────────────────────────────────────────────────────

export const EXERCISE_LIST: string[] = [
  'Supino Reto', 'Supino Inclinado', 'Supino Declinado',
  'Agachamento Livre', 'Leg Press', 'Cadeira Extensora', 'Mesa Flexora',
  'Rosca Direta', 'Rosca Martelo', 'Rosca Concentrada',
  'Desenvolvimento', 'Elevação Lateral', 'Elevação Frontal',
  'Remada Curvada', 'Remada Unilateral', 'Puxada Frontal', 'Puxada Neutra',
  'Barra Fixa', 'Stiff', 'Afundo', 'Panturrilha em Pé',
  'Tríceps Corda', 'Tríceps Testa', 'Tríceps Paralelas',
  'Crucifixo', 'Voador', 'Abdominais', 'Prancha', 'Deadlift',
  'Hip Thrust', 'Hack Squat', 'Glúteo no Cabo',
];

// ─────────────────────────────────────────────────────────────────────────────
// Notification constants
// ─────────────────────────────────────────────────────────────────────────────

export const NOTIFICATION_CHECK_INTERVAL_MS = 60_000; // 1 minute
export const MEAL_REMINDER_HOUR_START = 12;
export const MEAL_REMINDER_HOUR_END = 20;