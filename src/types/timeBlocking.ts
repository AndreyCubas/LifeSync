// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Extended Types: Time Blocking Advanced
// Adiciona ao types/index.ts — copiar para lá ou importar daqui
// ─────────────────────────────────────────────────────────────────────────────

import type { BlockCategory } from './index';

// ── Ghost Blocks ──────────────────────────────────────────────────────────────

/** Um bloco de tempo estendido com suporte a ghost blocks e templates */
export interface TimeBlockExtended {
  id: string;
  user_id: string;
  title: string;
  start_time: string;   // "HH:MM"
  end_time: string;     // "HH:MM"
  category: BlockCategory;
  date: string;         // "YYYY-MM-DD"
  is_ghost: boolean;    // TRUE = bloco fantasma (sugerido, não confirmado)
  template_id?: string; // UUID do template de origem
  created_at: string;
}

// ── Templates ─────────────────────────────────────────────────────────────────

export interface BlockTemplate {
  id: string;
  user_id: string;
  name: string;
  day_of_week: number | null; // 0=Dom, 1=Seg ... 6=Sab, null=genérico
  created_at: string;
  updated_at: string;
}

export interface BlockTemplateItem {
  id: string;
  template_id: string;
  title: string;
  start_time: string;
  end_time: string;
  category: BlockCategory;
  sort_order: number;
}

export interface BlockTemplateWithItems extends BlockTemplate {
  items: BlockTemplateItem[];
}

// ── Quick Capture Parsing ─────────────────────────────────────────────────────

export interface ParsedQuickCapture {
  title: string;
  start_time: string;
  end_time: string;
  category: BlockCategory;
  isValid: boolean;
  error?: string;
}

// ── Hydration ─────────────────────────────────────────────────────────────────

export interface HydrationLog {
  id: string;
  user_id: string;
  date: string;
  logged_at: string;
  ml: number;
  block_id?: string;
}

// ── Smart Suggestions ─────────────────────────────────────────────────────────

export type SuggestionType = 'meal' | 'hydration' | 'gap';

export interface SmartSuggestion {
  type: SuggestionType;
  start: string;
  end: string;
  durationMinutes: number;
  label: string;
  sublabel: string;
  emoji: string;
  /** Context: for meal windows - estimated kcal target */
  targetKcal?: number;
  /** Context: for hydration - ml recommendation */
  targetMl?: number;
  /** The triggering block (ex: the "Estudo" block causing hydration alert) */
  triggerBlockId?: string;
}

// ── Timeline Feed Item ────────────────────────────────────────────────────────

export type FeedItemType = 'block' | 'gap' | 'suggestion' | 'now-indicator';

export interface FeedItem {
  type: FeedItemType;
  startMinutes: number;
  endMinutes: number;
  block?: TimeBlockExtended;
  suggestion?: SmartSuggestion;
}
