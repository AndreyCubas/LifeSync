// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Notification Service
//
// Uses the Web Notifications API to surface:
//   - Block start/end alerts
//   - Meal reminders when no meal has been logged
//   - Upcoming event reminders (day-of)
// ─────────────────────────────────────────────────────────────────────────────

import type { TimeBlock, CalendarEvent, Meal } from '../types';
import { todayISO, timeToMinutes, nowMinutes, blockDurationMinutes } from '../lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Permission
// ─────────────────────────────────────────────────────────────────────────────

export type NotifPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotifPermission(): NotifPermission {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission as NotifPermission;
}

export async function requestNotifPermission(): Promise<NotifPermission> {
  if (!('Notification' in window)) return 'unsupported';
  const result = await Notification.requestPermission();
  return result as NotifPermission;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fire a notification
// ─────────────────────────────────────────────────────────────────────────────

interface NotifOptions {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  requireInteraction?: boolean;
}

export function fireNotification(opts: NotifOptions): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(opts.title, {
      body: opts.body,
      tag:  opts.tag,
      icon: opts.icon ?? '/favicon.ico',
      requireInteraction: opts.requireInteraction ?? false,
    });
  } catch {
    // Silently fail — notifications are a nice-to-have
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Scheduler — runs every minute via setInterval
// ─────────────────────────────────────────────────────────────────────────────

// Tracks which notification tags have already been fired this session
const firedTags = new Set<string>();

/** Checks all notification conditions and fires where appropriate */
export function runNotificationCheck(
  blocks: TimeBlock[],
  meals:  Meal[],
  events: CalendarEvent[]
): void {
  if (Notification.permission !== 'granted') return;

  const now   = nowMinutes();
  const today = todayISO();

  // ── 1. Block transition alerts ────────────────────────────────────────────
  for (const block of blocks) {
    if (block.date !== today) continue;
    const startMin = timeToMinutes(block.start_time);
    const endMin   = timeToMinutes(block.end_time);

    // Fire 1 min before block starts
    if (Math.abs(now - startMin) <= 1) {
      const tag = `block-start-${block.id}`;
      if (!firedTags.has(tag)) {
        firedTags.add(tag);
        fireNotification({
          title: `⏰ ${block.category} a começar`,
          body:  `"${block.title}" começa em 1 minuto (${block.start_time})`,
          tag,
        });
      }
    }

    // Fire at block end
    if (Math.abs(now - endMin) <= 1) {
      const tag = `block-end-${block.id}`;
      if (!firedTags.has(tag)) {
        firedTags.add(tag);
        const dur = blockDurationMinutes(block);
        fireNotification({
          title: `✅ "${block.title}" concluído`,
          body:  `Bloco de ${block.category} de ${Math.floor(dur / 60)}h${dur % 60 ? ` ${dur % 60}m` : ''} terminado.`,
          tag,
        });
      }
    }
  }

  // ── 2. Meal reminder ──────────────────────────────────────────────────────
  const mealHours = [12, 15, 19]; // 12:00, 15:00, 19:00
  for (const hour of mealHours) {
    if (Math.abs(now - hour * 60) <= 1) {
      const tag = `meal-reminder-${hour}`;
      if (!firedTags.has(tag)) {
        const mealCount = meals.filter((m) => m.date === today).length;
        if (mealCount === 0 || (hour >= 15 && mealCount < 2)) {
          firedTags.add(tag);
          fireNotification({
            title: '🍽️ Hora de registar a refeição',
            body:  `Não te esqueças de registar o que comeste! (${mealCount} refeições registadas hoje)`,
            tag,
            requireInteraction: true,
          });
        }
      }
    }
  }

  // ── 3. Today's events ─────────────────────────────────────────────────────
  const todayEvents = events.filter((e) => e.date === today);
  for (const event of todayEvents) {
    const tag = `event-today-${event.id}`;
    // Fire once per session at 8:00
    if (Math.abs(now - 8 * 60) <= 1 && !firedTags.has(tag)) {
      firedTags.add(tag);
      fireNotification({
        title: `📅 Evento hoje: ${event.title}`,
        body:  `Tens um compromisso hoje: ${event.title}`,
        tag,
        requireInteraction: true,
      });
    }
  }

  // ── 4. Tomorrow's events (8pm reminder) ───────────────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().split('T')[0];
  const tomorrowEvents = events.filter((e) => e.date === tomorrowISO);
  if (tomorrowEvents.length > 0 && Math.abs(now - 20 * 60) <= 1) {
    const tag = `event-tomorrow-${tomorrowISO}`;
    if (!firedTags.has(tag)) {
      firedTags.add(tag);
      fireNotification({
        title: `🔔 Lembrete para amanhã`,
        body:  `Tens ${tomorrowEvents.length} compromisso(s) amanhã: ${tomorrowEvents.map((e) => e.title).join(', ')}`,
        tag,
        requireInteraction: true,
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook-friendly starter
// ─────────────────────────────────────────────────────────────────────────────

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startNotificationScheduler(
  getBlocks: () => TimeBlock[],
  getMeals:  () => Meal[],
  getEvents: () => CalendarEvent[]
): () => void {
  if (intervalId !== null) clearInterval(intervalId);

  intervalId = setInterval(() => {
    runNotificationCheck(getBlocks(), getMeals(), getEvents());
  }, 60_000);

  // Run immediately too
  runNotificationCheck(getBlocks(), getMeals(), getEvents());

  return () => {
    if (intervalId !== null) clearInterval(intervalId);
  };
}