// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Quick Capture Parser
// Transforma texto livre num bloco de tempo estruturado
//
// Exemplos suportados:
//   "Academia 17:00 18:30"         → Treino, 17:00–18:30
//   "estudo matematica 07:00-09:30"→ Estudo, 07:00–09:30
//   "almoço 12:30 13:30"           → Almoço, 12:30–13:30
//   "trabalho 10h 14h"             → Trabalho, 10:00–14:00
//   "pausa cafe 15:30 15:45"       → Pausa, 15:30–15:45
// ─────────────────────────────────────────────────────────────────────────────

import type { ParsedQuickCapture } from '../types/timeBlocking';
import type { BlockCategory } from '../types';

// ── Category keyword map ──────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<BlockCategory, string[]> = {
  Estudo:     ['estudo', 'estudar', 'escola', 'aula', 'faculdade', 'revisão', 'leitura', 'provas', 'matematica', 'física', 'história', 'biologia', 'química', 'português', 'inglês'],
  Trabalho:   ['trabalho', 'trabalhar', 'estágio', 'estagio', 'empresa', 'reunião', 'reuniao', 'office', 'projeto', 'cliente', 'meeting'],
  Pausa:      ['pausa', 'descanso', 'intervalo', 'café', 'cafe', 'lanche', 'break'],
  Almoço:     ['almoço', 'almoco', 'jantar', 'janta', 'comer', 'refeição', 'refeicao'],
  Transporte: ['transporte', 'ônibus', 'onibus', 'metro', 'trem', 'carro', 'viagem', 'trajeto', 'commute', 'ida', 'volta'],
  Lazer:      ['lazer', 'jogo', 'netflix', 'série', 'serie', 'filme', 'descanso', 'hobby', 'livre', 'leitura lazer'],
  Treino:     ['academia', 'treino', 'treinar', 'musculação', 'musculacao', 'ginásio', 'ginasio', 'corrida', 'crossfit', 'pilates', 'yoga', 'natação', 'natacao', 'esporte', 'futebol', 'bike'],
  Sono:       ['dormir', 'sono', 'descanso noturno', 'nap', 'cochilo'],
};

// ── Time pattern regex ────────────────────────────────────────────────────────

// Matches: 17:30, 17h30, 17h, 17:00am, 9am, 9pm
const TIME_PATTERN = /\b(\d{1,2})(?:[h:](\d{2}))?\s*(?:(am|pm))?\b/gi;

// Matches dash-separated ranges: 17:00-18:30, 17h-18h30
const RANGE_PATTERN = /(\d{1,2})(?:[h:](\d{2}))?\s*(?:(am|pm))?\s*[-–to]\s*(\d{1,2})(?:[h:](\d{2}))?\s*(?:(am|pm))?/i;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseHHMM(h: string, m: string = '00', ampm?: string): string {
  let hours = parseInt(h, 10);
  const mins = parseInt(m, 10);
  if (ampm) {
    if (ampm.toLowerCase() === 'pm' && hours !== 12) hours += 12;
    if (ampm.toLowerCase() === 'am' && hours === 12) hours = 0;
  }
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function detectCategory(text: string): BlockCategory {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [BlockCategory, string[]][]) {
    for (const kw of keywords) {
      const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(kwNorm)) return cat;
    }
  }
  return 'Estudo'; // default
}

function extractTitle(text: string, timesUsed: string[]): string {
  let clean = text;
  // Remove time tokens
  for (const t of timesUsed) {
    clean = clean.replace(t, '');
  }
  // Remove extra spaces and dashes
  clean = clean.replace(/\s{2,}/g, ' ').replace(/^[-–\s]+|[-–\s]+$/g, '').trim();
  // Capitalise first letter
  return clean.length > 0 ? clean.charAt(0).toUpperCase() + clean.slice(1) : '';
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseQuickCapture(raw: string): ParsedQuickCapture {
  const text = raw.trim();

  if (!text) {
    return { title: '', start_time: '', end_time: '', category: 'Estudo', isValid: false, error: 'Texto vazio.' };
  }

  const usedTokens: string[] = [];
  let start_time = '';
  let end_time   = '';

  // 1. Try range pattern first (e.g. "17:00-18:30")
  const rangeMatch = RANGE_PATTERN.exec(text);
  if (rangeMatch) {
    start_time = parseHHMM(rangeMatch[1], rangeMatch[2] ?? '00', rangeMatch[3]);
    end_time   = parseHHMM(rangeMatch[4], rangeMatch[5] ?? '00', rangeMatch[6]);
    usedTokens.push(rangeMatch[0]);
  } else {
    // 2. Extract individual times
    const allTimes: Array<{ raw: string; value: string }> = [];
    let match: RegExpExecArray | null;
    const re = new RegExp(TIME_PATTERN.source, 'gi');

    while ((match = re.exec(text)) !== null) {
      const value = parseHHMM(match[1], match[2] ?? '00', match[3]);
      allTimes.push({ raw: match[0], value });
    }

    if (allTimes.length >= 2) {
      start_time = allTimes[0].value;
      end_time   = allTimes[1].value;
      usedTokens.push(allTimes[0].raw, allTimes[1].raw);
    } else if (allTimes.length === 1) {
      start_time = allTimes[0].value;
      // Default duration: 1 hour
      const [h, m] = allTimes[0].value.split(':').map(Number);
      const endMin = h * 60 + m + 60;
      end_time = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
      usedTokens.push(allTimes[0].raw);
    }
  }

  if (!start_time || !end_time) {
    return {
      title: text, start_time: '', end_time: '', category: detectCategory(text),
      isValid: false,
      error: 'Não foi possível detectar horários. Ex: "Academia 17:00 18:30"',
    };
  }

  // Validate times
  const [sh, sm] = start_time.split(':').map(Number);
  const [eh, em] = end_time.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin   = eh * 60 + em;

  if (startMin >= endMin) {
    return {
      title: extractTitle(text, usedTokens), start_time, end_time,
      category: detectCategory(text), isValid: false,
      error: 'O horário de fim deve ser depois do início.',
    };
  }

  const title    = extractTitle(text, usedTokens) || 'Bloco sem título';
  const category = detectCategory(text);

  return { title, start_time, end_time, category, isValid: true };
}

// ── Preview formatter (for UI feedback) ──────────────────────────────────────

export function formatParsePreview(parsed: ParsedQuickCapture): string {
  if (!parsed.isValid) return parsed.error ?? '';
  return `${parsed.category} · ${parsed.start_time} – ${parsed.end_time} · "${parsed.title}"`;
}
