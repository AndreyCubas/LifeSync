// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Smart Suggestions Engine
// Gera sugestões inteligentes baseadas no cronograma + dados de fitness
// ─────────────────────────────────────────────────────────────────────────────

import { timeToMinutes, minutesToTime, blockDurationMinutes, nowMinutes } from './utils';
import type { TimeBlockExtended, SmartSuggestion, TimeGap } from '../types/timeBlocking';

// ── Deep Work categories (precisam de hidratação reforçada) ──────────────────
const DEEP_WORK_CATEGORIES = ['Estudo', 'Trabalho'];
const SHALLOW_CATEGORIES   = ['Transporte', 'Pausa', 'Lazer', 'Sono'];

// Duração mínima de foco para sugerir hidratação (60 min)
const HYDRATION_TRIGGER_MIN = 60;
// Duração mínima de gap para sugerir refeição (25 min)
const MEAL_GAP_MIN = 25;

// Horários típicos de refeição (minutos desde meia-noite)
const MEAL_WINDOWS = [
  { name: 'Café da manhã', from: 6 * 60, to: 9 * 60,  targetKcal: 400 },
  { name: 'Almoço',        from: 11 * 60, to: 14 * 60, targetKcal: 650 },
  { name: 'Lanche da tarde',from: 15 * 60, to: 17 * 60,targetKcal: 250 },
  { name: 'Jantar',        from: 18 * 60, to: 21 * 60, targetKcal: 600 },
];

// ─────────────────────────────────────────────────────────────────────────────

export interface SuggestionContext {
  blocks: TimeBlockExtended[];
  hydrationTotalMl: number;
  todayMealCount: number;
  dailyHydrationGoalMl?: number;  // default: 2500
}

export function generateSmartSuggestions(ctx: SuggestionContext): SmartSuggestion[] {
  const { blocks, hydrationTotalMl, todayMealCount, dailyHydrationGoalMl = 2500 } = ctx;
  const suggestions: SmartSuggestion[] = [];
  const now = nowMinutes();

  // Sort blocks by start time (real only)
  const realBlocks = blocks
    .filter(b => !b.is_ghost)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

  // ── 1. Meal window suggestions (cross-check with gaps) ──────────────────────
  const gaps = detectGapsInternal(realBlocks);

  for (const gap of gaps) {
    if (gap.durationMinutes < MEAL_GAP_MIN) continue;
    if (gap.endMin <= now) continue; // gap already passed

    for (const window of MEAL_WINDOWS) {
      // Gap overlaps with a typical meal window?
      const overlapStart = Math.max(gap.startMin, window.from);
      const overlapEnd   = Math.min(gap.endMin, window.to);
      if (overlapEnd - overlapStart >= MEAL_GAP_MIN) {
        suggestions.push({
          type: 'meal',
          start: minutesToTime(overlapStart),
          end:   minutesToTime(Math.min(overlapEnd, overlapStart + 45)),
          durationMinutes: Math.min(overlapEnd - overlapStart, 45),
          label: `Momento ideal: ${window.name}`,
          sublabel: `Meta: ~${window.targetKcal} kcal · ${gap.durationMinutes}min disponíveis`,
          emoji: '🍽️',
          targetKcal: window.targetKcal,
        });
        break; // one suggestion per gap
      }
    }
  }

  // ── 2. Hydration suggestions (deep work blocks) ────────────────────────────
  for (const block of realBlocks) {
    if (!DEEP_WORK_CATEGORIES.includes(block.category)) continue;
    const dur = blockDurationMinutes(block);
    if (dur < HYDRATION_TRIGGER_MIN) continue;

    const blockStart = timeToMinutes(block.start_time);
    const blockEnd   = timeToMinutes(block.end_time);
    if (blockEnd <= now) continue; // already done

    // Is this block currently active or upcoming?
    const isActive = blockStart <= now && now < blockEnd;
    const startDisplay = isActive ? minutesToTime(now) : block.start_time;

    const mlRecommended = Math.round((dur / 60) * 350); // ~350ml/hora de foco

    suggestions.push({
      type: 'hydration',
      start: startDisplay,
      end:   block.end_time,
      durationMinutes: dur,
      label: `Bloco de foco longo: ${block.title}`,
      sublabel: `${Math.floor(dur / 60)}h de Deep Work · Recomendado: ${mlRecommended}ml`,
      emoji: '💧',
      targetMl: mlRecommended,
      triggerBlockId: block.id,
    });
  }

  // ── 3. General hydration reminder (if behind goal) ─────────────────────────
  const hydrationPct = (hydrationTotalMl / dailyHydrationGoalMl) * 100;
  if (hydrationPct < 50 && now >= 12 * 60) { // after noon and less than 50% hydrated
    const existing = suggestions.find(s => s.type === 'hydration');
    if (!existing) {
      suggestions.push({
        type: 'hydration',
        start: minutesToTime(now),
        end:   minutesToTime(now + 5),
        durationMinutes: 5,
        label: `Hidratação em atraso`,
        sublabel: `${hydrationTotalMl}ml de ${dailyHydrationGoalMl}ml · Beba água agora!`,
        emoji: '⚠️💧',
        targetMl: dailyHydrationGoalMl - hydrationTotalMl,
      });
    }
  }

  // Remove duplicates and sort by time
  return suggestions
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))
    .slice(0, 6); // max 6 suggestions at once
}

// ── Internal gap detection ────────────────────────────────────────────────────

interface InternalGap {
  startMin: number;
  endMin: number;
  durationMinutes: number;
}

function detectGapsInternal(sortedBlocks: TimeBlockExtended[]): InternalGap[] {
  const gaps: InternalGap[] = [];
  for (let i = 0; i < sortedBlocks.length - 1; i++) {
    const gapStart = timeToMinutes(sortedBlocks[i].end_time);
    const gapEnd   = timeToMinutes(sortedBlocks[i + 1].start_time);
    const dur = gapEnd - gapStart;
    if (dur >= 10) {
      gaps.push({ startMin: gapStart, endMin: gapEnd, durationMinutes: dur });
    }
  }
  // Also check before first block (morning gap)
  if (sortedBlocks.length > 0) {
    const dayStart = 6 * 60; // 6am
    const firstStart = timeToMinutes(sortedBlocks[0].start_time);
    if (firstStart - dayStart >= MEAL_GAP_MIN) {
      gaps.unshift({ startMin: dayStart, endMin: firstStart, durationMinutes: firstStart - dayStart });
    }
  }
  return gaps;
}

// ── Category classifier ───────────────────────────────────────────────────────

export function isDeepWork(category: string): boolean {
  return DEEP_WORK_CATEGORIES.includes(category);
}

export function isShallowWork(category: string): boolean {
  return SHALLOW_CATEGORIES.includes(category);
}
