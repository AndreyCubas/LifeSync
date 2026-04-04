// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Fitness Module (Nutrition + Workouts + Progress)
// Dark mode + meal registration animation effects
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import { useMealsForDate, useWorkouts, useExercisesForWorkout, useAllExercises } from '../../hooks';
import { mealsService, workoutsService, exercisesService } from '../../services/dataService';
import {
  Card, PageHeader, Button, Modal, FormField, Input, Select,
  Autocomplete, MacroBar, ConfirmDialog, EmptyState,
  AppleIcon, DumbbellIcon, TrendIcon, PlusIcon, EditIcon, TrashIcon,
  ChevronLIcon, ChevronRIcon,
} from '../../components/ui';
import { todayISO, sumMacros, fmtDuration } from '../../lib/utils';
import { DEFAULT_MACRO_GOALS, EXERCISE_LIST } from '../../lib/constants';
import type { Meal, MealFormData, Workout, WorkoutFormData, Exercise, ExerciseFormData } from '../../types';

type FitnessTab = 'nutrition' | 'workouts' | 'progress';

const SUBTABS: { id: FitnessTab; label: string }[] = [
  { id: 'nutrition', label: '🥗 Nutrição' },
  { id: 'workouts',  label: '🏋️ Treinos' },
  { id: 'progress',  label: '📈 Evolução' },
];

// ── Confetti particle ─────────────────────────────────────────────────────────
function Confetti({ x, y, color, onDone }: { x: number; y: number; color: string; onDone: () => void }) {
  return (
    <div
      className="confetti-piece fixed pointer-events-none z-50 w-2 h-2 rounded-sm"
      style={{ left: x, top: y, background: color }}
      onAnimationEnd={onDone}
    />
  );
}

// ── Ripple hook ───────────────────────────────────────────────────────────────
function useRipple() {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const trigger = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const id = Date.now();
    setRipples(r => [...r, { id, x: e.clientX - rect.left - size/2, y: e.clientY - rect.top - size/2, size }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600);
  }, []);
  return { ripples, trigger };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODULE
// ─────────────────────────────────────────────────────────────────────────────

export function FitnessModule() {
  const [subtab, setSubtab] = useState<FitnessTab>('nutrition');

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader title="Fitness & Saúde" subtitle="Registo de refeições, treinos e evolução de cargas" />

      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit mb-7 gap-1">
        {SUBTABS.map(({ id, label }) => (
          <button key={id} onClick={() => setSubtab(id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
              subtab === id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {subtab === 'nutrition' && <NutritionTab />}
      {subtab === 'workouts'  && <WorkoutsTab />}
      {subtab === 'progress'  && <ProgressTab />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NUTRITION TAB
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_MEAL: MealFormData = { name: '', time: '', protein: '', carbs: '', fats: '', fiber: '', notes: '' };
const CONFETTI_COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899','#0ea5e9','#8b5cf6'];

function NutritionTab() {
  const user = useAppStore(s => s.user)!;
  const [date, setDate]     = useState(todayISO());
  const { meals, loading, refresh } = useMealsForDate(date);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<MealFormData>({ ...EMPTY_MEAL });
  const [saving, setSaving]         = useState(false);
  const [confirmId, setConfirmId]   = useState<string | null>(null);

  // ── Animation state ────────────────────────────────────────────────────────
  const [confetti, setConfetti]   = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const { ripples, trigger: triggerRipple } = useRipple();

  const totals = useMemo(() => sumMacros(meals), [meals]);

  const fireConfetti = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top;
    const newPieces = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: cx + (Math.random() - 0.5) * 120,
      y: cy + (Math.random() - 0.5) * 40,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    }));
    setConfetti(c => [...c, ...newPieces]);
  }, []);

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_MEAL }); setModalOpen(true); };
  const openEdit   = (m: Meal) => {
    setEditingId(m.id);
    setForm({ name: m.name, time: m.time, protein: m.protein, carbs: m.carbs, fats: m.fats, fiber: m.fiber, notes: m.notes ?? '' });
    setModalOpen(true);
  };

  const handleSave = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editingId) {
      await mealsService.update(user.id, editingId, form);
    } else {
      const { data } = await mealsService.create(user.id, date, form);
      if (data) {
        setLastAdded(data.id);
        fireConfetti();
        setTimeout(() => setLastAdded(null), 800);
      }
    }
    await refresh();
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    await mealsService.delete(user.id, confirmId);
    await refresh();
    setConfirmId(null);
  };

  const shiftDate = (d: number) => { const dt = new Date(date); dt.setDate(dt.getDate()+d); setDate(dt.toISOString().split('T')[0]); };
  const f = <K extends keyof MealFormData>(k: K, v: MealFormData[K]) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      {/* Confetti */}
      {confetti.map(c => (
        <Confetti key={c.id} x={c.x} y={c.y} color={c.color} onDone={() => setConfetti(prev => prev.filter(p => p.id !== c.id))} />
      ))}

      {/* Date nav + CTA */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftDate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
            <ChevronLIcon />
          </button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm outline-none focus:border-indigo-400 cursor-pointer" />
          <button onClick={() => shiftDate(1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
            <ChevronRIcon />
          </button>
          <button onClick={() => setDate(todayISO())} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition-colors">
            Hoje
          </button>
        </div>

        {/* ── Animated Register button ── */}
        <button
          ref={btnRef}
          onClick={(e) => { triggerRipple(e); openCreate(); }}
          className="ripple-container relative inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm shadow-indigo-200 dark:shadow-indigo-900 transition-all duration-150 select-none"
        >
          {ripples.map(r => (
            <span key={r.id} className="ripple-wave" style={{ left: r.x, top: r.y, width: r.size, height: r.size }} />
          ))}
          <PlusIcon />
          Registar refeição
        </button>
      </div>

      {/* Macro overview */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Calorias', value: `${totals.calories}`, unit: 'kcal', color: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Proteína', value: `${totals.protein}`, unit: `/${DEFAULT_MACRO_GOALS.protein}g`, color: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Carbos',   value: `${totals.carbs}`,   unit: `/${DEFAULT_MACRO_GOALS.carbs}g`,  color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Gorduras', value: `${totals.fats}`,    unit: `/${DEFAULT_MACRO_GOALS.fats}g`,   color: 'text-pink-600 dark:text-pink-400' },
          { label: 'Fibras',   value: `${totals.fiber}`,   unit: `/${DEFAULT_MACRO_GOALS.fiber}g`,  color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(item => (
          <Card key={item.label} className="text-center py-3 px-2">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
            <p className={`text-xl font-extrabold ${item.color}`}>{item.value}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">{item.unit}</p>
          </Card>
        ))}
      </div>

      {/* Macro progress bars */}
      <Card className="mb-5">
        <MacroBar label="Proteína"     value={totals.protein} goal={DEFAULT_MACRO_GOALS.protein} color="bg-indigo-500" />
        <MacroBar label="Carboidratos" value={totals.carbs}   goal={DEFAULT_MACRO_GOALS.carbs}   color="bg-amber-500" />
        <MacroBar label="Gorduras"     value={totals.fats}    goal={DEFAULT_MACRO_GOALS.fats}    color="bg-pink-500" />
        <MacroBar label="Fibras"       value={totals.fiber}   goal={DEFAULT_MACRO_GOALS.fiber}   color="bg-emerald-500" />
      </Card>

      {/* Meals list */}
      {loading ? (
        <Card><div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">A carregar...</div></Card>
      ) : meals.length === 0 ? (
        <Card>
          <EmptyState icon={<AppleIcon />} text="Nenhuma refeição registada hoje."
            action={<Button size="sm" icon={<PlusIcon />} onClick={openCreate}>Registar refeição</Button>} />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {meals.map(m => (
            <MealCard
              key={m.id}
              meal={m}
              isNew={m.id === lastAdded}
              onEdit={() => openEdit(m)}
              onDelete={() => setConfirmId(m.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar refeição' : 'Registar refeição'}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Nome da refeição">
              <Input value={form.name} onChange={e => f('name', e.target.value)} placeholder="Ex: Café da manhã, Almoço..." autoFocus />
            </FormField>
          </div>
          <FormField label="Horário"><Input type="time" value={form.time as string} onChange={e => f('time', e.target.value)} /></FormField>
          <div />
          <FormField label="Proteínas (g)"><Input type="number" value={form.protein as string} onChange={e => f('protein', e.target.value)} placeholder="0" /></FormField>
          <FormField label="Carboidratos (g)"><Input type="number" value={form.carbs as string} onChange={e => f('carbs', e.target.value)} placeholder="0" /></FormField>
          <FormField label="Gorduras (g)"><Input type="number" value={form.fats as string} onChange={e => f('fats', e.target.value)} placeholder="0" /></FormField>
          <FormField label="Fibras (g)"><Input type="number" value={form.fiber as string} onChange={e => f('fiber', e.target.value)} placeholder="0" /></FormField>
          <div className="col-span-2">
            <FormField label="Notas"><Input value={form.notes as string} onChange={e => f('notes', e.target.value)} placeholder="Ingredientes, observações..." /></FormField>
          </div>
        </div>

        {/* Save button with pulse animation */}
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className={`relative inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 select-none
              ${saving ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-md shadow-indigo-200 dark:shadow-indigo-900'}
            `}
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Guardando...
              </>
            ) : (
              <>{editingId ? '💾 Salvar' : '🍽️ Registar'}</>
            )}
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(confirmId)} title="Excluir refeição"
        message="Tens a certeza que queres remover esta refeição?"
        onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />
    </div>
  );
}

// ── Meal Card with entrance animation ────────────────────────────────────────

function MealCard({ meal: m, isNew, onEdit, onDelete }: {
  meal: Meal; isNew: boolean; onEdit: () => void; onDelete: () => void;
}) {
  const [hov, setHov] = useState(false);
  const kcal = Math.round(m.protein * 4 + m.carbs * 4 + m.fats * 9);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={`flex items-center gap-4 bg-white dark:bg-slate-800/60 border rounded-2xl px-5 py-4 transition-all duration-200 ${
        isNew
          ? 'border-indigo-300 dark:border-indigo-700 shadow-md shadow-indigo-100 dark:shadow-indigo-900/30 meal-pop'
          : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform duration-200 ${hov ? 'scale-110' : ''}`}>
        🍽️
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{m.name}</p>
          {m.time && <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{m.time}</span>}
          {isNew && <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full animate-pulse">✓ registado</span>}
        </div>
        <div className="flex gap-3 mt-1 text-xs font-semibold flex-wrap">
          <span className="text-indigo-600 dark:text-indigo-400">P: {m.protein}g</span>
          <span className="text-amber-600 dark:text-amber-400">C: {m.carbs}g</span>
          <span className="text-pink-600 dark:text-pink-400">G: {m.fats}g</span>
          <span className="text-emerald-600 dark:text-emerald-400">F: {m.fiber}g</span>
          <span className="text-slate-400 dark:text-slate-500">· {kcal} kcal</span>
        </div>
        {m.notes && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{m.notes}</p>}
      </div>
      <div className={`flex gap-2 transition-opacity duration-150 ${hov ? 'opacity-100' : 'opacity-0'}`}>
        <Button variant="outline" size="sm" icon={<EditIcon />} onClick={onEdit} />
        <Button variant="danger"  size="sm" icon={<TrashIcon />} onClick={onDelete} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKOUTS TAB
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_WORKOUT: WorkoutFormData = { name: '', date: todayISO() };
const EMPTY_EXERCISE: ExerciseFormData = { exercise_name: '', sets: '', reps: '', weight: '' };

function WorkoutsTab() {
  const user = useAppStore(s => s.user)!;
  const { workouts, loading, refresh: refreshWorkouts } = useWorkouts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedWorkout = workouts.find(w => w.id === selectedId) ?? workouts[0] ?? null;
  const { exercises, refresh: refreshEx } = useExercisesForWorkout(selectedWorkout?.id ?? null);

  const [wModal, setWModal] = useState(false);
  const [eModal, setEModal] = useState(false);
  const [editWId, setEditWId] = useState<string | null>(null);
  const [editEId, setEditEId] = useState<string | null>(null);
  const [wForm, setWForm] = useState<WorkoutFormData>({ ...EMPTY_WORKOUT });
  const [eForm, setEForm] = useState<ExerciseFormData>({ ...EMPTY_EXERCISE });
  const [saving, setSaving] = useState(false);
  const [confirmWId, setConfirmWId] = useState<string | null>(null);
  const [confirmEId, setConfirmEId] = useState<string | null>(null);
  const { ripples: wRipples, trigger: triggerWRipple } = useRipple();

  const openCreateW = () => { setEditWId(null); setWForm({ ...EMPTY_WORKOUT, date: todayISO() }); setWModal(true); };
  const openEditW   = (w: Workout) => { setEditWId(w.id); setWForm({ name: w.name, date: w.date }); setWModal(true); };
  const openCreateE = () => { setEditEId(null); setEForm({ ...EMPTY_EXERCISE }); setEModal(true); };
  const openEditE   = (ex: Exercise) => {
    setEditEId(ex.id);
    setEForm({ exercise_name: ex.exercise_name, sets: ex.sets, reps: ex.reps, weight: ex.weight });
    setEModal(true);
  };

  const saveWorkout = async () => {
    if (!wForm.name.trim()) return;
    setSaving(true);
    if (editWId) {
      await workoutsService.update(user.id, editWId, wForm);
    } else {
      const { data } = await workoutsService.create(user.id, wForm);
      if (data) setSelectedId(data.id);
    }
    await refreshWorkouts(); setSaving(false); setWModal(false);
  };

  const deleteWorkout = async () => {
    if (!confirmWId) return;
    await workoutsService.delete(user.id, confirmWId);
    await refreshWorkouts(); setConfirmWId(null);
    if (selectedId === confirmWId) setSelectedId(null);
  };

  const saveExercise = async () => {
    if (!eForm.exercise_name.trim() || !selectedWorkout) return;
    setSaving(true);
    if (editEId) await exercisesService.update(user.id, editEId, eForm);
    else await exercisesService.create(user.id, selectedWorkout.id, eForm);
    await refreshEx(); setSaving(false); setEModal(false);
  };

  const deleteExercise = async () => {
    if (!confirmEId) return;
    await exercisesService.delete(user.id, confirmEId);
    await refreshEx(); setConfirmEId(null);
  };

  const wf = <K extends keyof WorkoutFormData>(k: K, v: WorkoutFormData[K]) => setWForm(p => ({ ...p, [k]: v }));
  const ef = <K extends keyof ExerciseFormData>(k: K, v: ExerciseFormData[K]) => setEForm(p => ({ ...p, [k]: v }));

  return (
    <div className="grid grid-cols-3 gap-5">
      {/* List */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Fichas</p>
          <button
            onClick={(e) => { triggerWRipple(e); openCreateW(); }}
            className="ripple-container relative inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            {wRipples.map(r => (
              <span key={r.id} className="ripple-wave" style={{ left: r.x, top: r.y, width: r.size, height: r.size }} />
            ))}
            <PlusIcon /> Nova
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">A carregar...</p>
        ) : workouts.length === 0 ? (
          <EmptyState icon={<DumbbellIcon />} text="Nenhuma ficha"
            action={<Button size="sm" icon={<PlusIcon />} onClick={openCreateW}>Criar ficha</Button>} />
        ) : (
          <div className="flex flex-col gap-2">
            {workouts.map(w => (
              <div key={w.id} onClick={() => setSelectedId(w.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                  selectedWorkout?.id === w.id
                    ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950'
                    : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600'
                }`}>
                <p className={`text-sm font-semibold ${selectedWorkout?.id === w.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-slate-100'}`}>
                  {w.name}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{w.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exercise list */}
      <div className="col-span-2">
        {!selectedWorkout ? (
          <Card><EmptyState icon={<DumbbellIcon />} text="Seleciona ou cria uma ficha de treino" /></Card>
        ) : (
          <Card padding={false}>
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedWorkout.name}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{selectedWorkout.date}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={<EditIcon />} onClick={() => openEditW(selectedWorkout)}>Editar</Button>
                <Button variant="danger"  size="sm" icon={<TrashIcon />} onClick={() => setConfirmWId(selectedWorkout.id)}>Excluir</Button>
                <Button size="sm" icon={<PlusIcon />} onClick={openCreateE}>Exercício</Button>
              </div>
            </div>
            {exercises.length === 0 ? (
              <EmptyState icon={<DumbbellIcon />} text="Nenhum exercício"
                action={<Button size="sm" icon={<PlusIcon />} onClick={openCreateE}>Adicionar</Button>} />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {['Exercício','Séries','Reps','Carga',''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exercises.map(ex => (
                    <ExerciseRow key={ex.id} exercise={ex}
                      onEdit={() => openEditE(ex)} onDelete={() => setConfirmEId(ex.id)} />
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}
      </div>

      {/* Workout modal */}
      <Modal open={wModal} onClose={() => setWModal(false)} title={editWId ? 'Editar ficha' : 'Nova ficha de treino'} width="max-w-sm">
        <FormField label="Nome"><Input value={wForm.name} onChange={e => wf('name', e.target.value)} placeholder="Ex: Peito + Tríceps" autoFocus /></FormField>
        <FormField label="Data"><Input type="date" value={wForm.date} onChange={e => wf('date', e.target.value)} /></FormField>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setWModal(false)}>Cancelar</Button>
          <Button loading={saving} onClick={saveWorkout}>{editWId ? 'Salvar' : 'Criar'}</Button>
        </div>
      </Modal>

      {/* Exercise modal */}
      <Modal open={eModal} onClose={() => setEModal(false)} title={editEId ? 'Editar exercício' : 'Adicionar exercício'}>
        <FormField label="Exercício">
          <Autocomplete value={eForm.exercise_name as string} onChange={v => ef('exercise_name', v)} suggestions={EXERCISE_LIST} placeholder="Comece a digitar..." />
        </FormField>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Séries"><Input type="number" value={eForm.sets as string} onChange={e => ef('sets', e.target.value)} placeholder="4" /></FormField>
          <FormField label="Reps"><Input type="number" value={eForm.reps as string} onChange={e => ef('reps', e.target.value)} placeholder="10" /></FormField>
          <FormField label="Carga (kg)"><Input type="number" value={eForm.weight as string} onChange={e => ef('weight', e.target.value)} placeholder="60" /></FormField>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setEModal(false)}>Cancelar</Button>
          <Button loading={saving} onClick={saveExercise}>{editEId ? 'Salvar' : 'Adicionar'}</Button>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(confirmWId)} title="Excluir ficha" message="Isto irá remover a ficha e todos os exercícios. Continuar?" onConfirm={deleteWorkout} onCancel={() => setConfirmWId(null)} />
      <ConfirmDialog open={Boolean(confirmEId)} title="Excluir exercício" message="Remover este exercício?" onConfirm={deleteExercise} onCancel={() => setConfirmEId(null)} />
    </div>
  );
}

function ExerciseRow({ exercise: ex, onEdit, onDelete }: { exercise: Exercise; onEdit: () => void; onDelete: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{ex.exercise_name}</td>
      <td className="px-4 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400">{ex.sets}</td>
      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{ex.reps}</td>
      <td className="px-4 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">{ex.weight}kg</td>
      <td className="px-4 py-3">
        <div className={`flex gap-2 transition-opacity ${hov ? 'opacity-100' : 'opacity-0'}`}>
          <Button variant="outline" size="sm" icon={<EditIcon />} onClick={onEdit} />
          <Button variant="danger"  size="sm" icon={<TrashIcon />} onClick={onDelete} />
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS TAB
// ─────────────────────────────────────────────────────────────────────────────

function ProgressTab() {
  const { exercises } = useAllExercises();
  const { workouts }  = useWorkouts();

  const history = useMemo(() => {
    const byName: Record<string, Array<{ date: string; sets: number; reps: number; weight: number }>> = {};
    for (const ex of exercises) {
      const w = workouts.find(w => w.id === ex.workout_id);
      if (!w) continue;
      if (!byName[ex.exercise_name]) byName[ex.exercise_name] = [];
      byName[ex.exercise_name].push({ date: w.date, sets: ex.sets, reps: ex.reps, weight: ex.weight });
    }
    return Object.entries(byName)
      .filter(([, arr]) => arr.length >= 2)
      .map(([name, entries]) => {
        const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
        const latest = sorted[sorted.length - 1];
        const prev   = sorted[sorted.length - 2];
        const delta  = latest.weight - prev.weight;
        return { name, sorted, latest, prev, delta, trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable' };
      })
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, [exercises, workouts]);

  if (history.length === 0) {
    return <EmptyState icon={<TrendIcon />} text="Regista pelo menos 2 treinos com os mesmos exercícios para ver a evolução" />;
  }

  return (
    <div className="grid grid-cols-2 gap-5">
      {history.map(({ name, sorted, latest, prev, delta, trend }) => (
        <Card key={name}>
          <div className="flex items-start justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{name}</h4>
            <span className={`text-sm font-extrabold px-2.5 py-1 rounded-lg ${
              trend === 'up'   ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' :
              trend === 'down' ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400' :
                                 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              {delta > 0 ? '+' : ''}{delta}kg
            </span>
          </div>
          <div className="flex gap-6 mb-4">
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-1">ATUAL</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{latest.weight}kg</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{latest.sets}×{latest.reps}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-1">ANTERIOR</p>
              <p className="text-2xl font-extrabold text-slate-400 dark:text-slate-500">{prev.weight}kg</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{prev.sets}×{prev.reps}</p>
            </div>
          </div>
          <div className="flex items-end gap-1 h-10">
            {sorted.map((entry, i) => {
              const max = Math.max(...sorted.map(e => e.weight), 1);
              const isLast = i === sorted.length - 1;
              return (
                <div key={i} title={`${entry.date}: ${entry.weight}kg`}
                  className="flex-1 rounded-t transition-all duration-300"
                  style={{ height: `${(entry.weight/max)*100}%`, background: isLast ? '#6366f1' : '#e0e7ff' }} />
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">{sorted.length} registos</p>
        </Card>
      ))}
    </div>
  );
}