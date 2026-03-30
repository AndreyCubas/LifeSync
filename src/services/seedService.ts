// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Seed Service
// Populates demo data for new users so the app is immediately useful
// ─────────────────────────────────────────────────────────────────────────────

import { blocksService, mealsService, workoutsService, exercisesService, eventsService } from './dataService';
import { todayISO, offsetDate, genId } from '../lib/utils';

export async function seedDemoData(userId: string): Promise<void> {
  const today    = todayISO();
  const tomorrow = offsetDate(1);
  const in3days  = offsetDate(3);
  const in7days  = offsetDate(7);
  const in14days = offsetDate(14);
  const ago2days = offsetDate(-2);

  // ── Time Blocks ────────────────────────────────────────────────────────────
  const blocks = [
    { title: 'Acordar + Rotina matinal', start_time: '06:30', end_time: '07:00', category: 'Pausa'      as const },
    { title: 'Estudo — Matemática',      start_time: '07:00', end_time: '09:30', category: 'Estudo'     as const },
    { title: 'Transporte para o trabalho',start_time:'09:30', end_time: '10:00', category: 'Transporte' as const },
    { title: 'Trabalho / Estágio',        start_time:'10:00', end_time: '14:00', category: 'Trabalho'   as const },
    { title: 'Almoço',                   start_time: '14:00', end_time: '14:40', category: 'Almoço'     as const },
    { title: 'Estudo — Revisão',         start_time: '15:00', end_time: '17:00', category: 'Estudo'     as const },
    { title: 'Treino na academia',       start_time: '17:30', end_time: '19:00', category: 'Treino'     as const },
    { title: 'Lazer / Descanso',         start_time: '20:00', end_time: '22:00', category: 'Lazer'      as const },
    { title: 'Sono',                     start_time: '22:30', end_time: '06:30', category: 'Sono'       as const },
  ];
  for (const b of blocks) {
    await blocksService.create(userId, { ...b, date: today });
  }

  // ── Meals ──────────────────────────────────────────────────────────────────
  await mealsService.create(userId, today, { name: 'Café da manhã', time: '07:00', protein: 30, carbs: 45, fats: 12, fiber: 5, notes: 'Ovos mexidos + aveia com banana' });
  await mealsService.create(userId, today, { name: 'Almoço',        time: '14:10', protein: 45, carbs: 70, fats: 18, fiber: 8, notes: 'Frango grelhado + arroz + salada' });
  await mealsService.create(userId, today, { name: 'Pré-treino',    time: '17:00', protein: 25, carbs: 40, fats: 5,  fiber: 3, notes: 'Whey + banana' });

  // ── Workouts ───────────────────────────────────────────────────────────────
  const w1result = await workoutsService.create(userId, { name: 'Peito + Tríceps', date: today });
  const w2result = await workoutsService.create(userId, { name: 'Costas + Bíceps', date: ago2days });
  const w3result = await workoutsService.create(userId, { name: 'Pernas',          date: offsetDate(-4) });

  if (w1result.data) {
    const wid = w1result.data.id;
    await exercisesService.create(userId, wid, { exercise_name: 'Supino Reto',     sets: 4, reps: 10, weight: 60 });
    await exercisesService.create(userId, wid, { exercise_name: 'Supino Inclinado',sets: 3, reps: 12, weight: 50 });
    await exercisesService.create(userId, wid, { exercise_name: 'Tríceps Corda',   sets: 3, reps: 15, weight: 25 });
    await exercisesService.create(userId, wid, { exercise_name: 'Tríceps Testa',   sets: 3, reps: 12, weight: 30 });
  }
  if (w2result.data) {
    const wid = w2result.data.id;
    await exercisesService.create(userId, wid, { exercise_name: 'Supino Reto',     sets: 4, reps: 10, weight: 57.5 });
    await exercisesService.create(userId, wid, { exercise_name: 'Puxada Frontal',  sets: 4, reps: 10, weight: 55 });
    await exercisesService.create(userId, wid, { exercise_name: 'Remada Curvada',  sets: 4, reps: 10, weight: 50 });
    await exercisesService.create(userId, wid, { exercise_name: 'Rosca Direta',    sets: 3, reps: 12, weight: 20 });
  }
  if (w3result.data) {
    const wid = w3result.data.id;
    await exercisesService.create(userId, wid, { exercise_name: 'Agachamento Livre',sets: 4, reps: 8, weight: 80 });
    await exercisesService.create(userId, wid, { exercise_name: 'Leg Press',       sets: 4, reps: 12, weight: 120 });
    await exercisesService.create(userId, wid, { exercise_name: 'Stiff',           sets: 3, reps: 10, weight: 60 });
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  await eventsService.create(userId, { title: 'Prova de Matemática',   date: in3days,  type: 'Estudo',   notes: 'Capítulos 3 e 4 — Derivadas' });
  await eventsService.create(userId, { title: 'Reunião de equipe',     date: tomorrow, type: 'Trabalho', notes: 'Sala de conferências 2 — 10h' });
  await eventsService.create(userId, { title: 'Entrega do relatório',  date: in7days,  type: 'Trabalho', notes: 'Enviar por e-mail até 23:59' });
  await eventsService.create(userId, { title: 'Simulado ENEM',         date: in14days, type: 'Estudo',   notes: 'ENEM online — todas as matérias' });
}