// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Dashboard Module
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from "react";
import { useAppStore } from "../../store/appStore";
import {
  useTodayBlocks,
  useMealsForDate,
  useWorkouts,
  useExercisesForWorkout,
  useEvents,
  useClock,
} from "../../hooks";
import {
  Card,
  PageHeader,
  CategoryBadge,
  MacroBar,
  StatCard,
  ProgressBar,
  ClockIcon,
  TrendIcon,
  AppleIcon,
  SunIcon,
  CalendarIcon,
  DumbbellIcon,
  BellIcon,
  InfoIcon,
} from "../../components/ui";
import {
  isBlockActive,
  isBlockPast,
  buildCategorySummary,
  sumMacros,
  findMealSuggestion,
  fmtTime,
  fmtDuration,
  daysUntil,
  todayISO,
  nowMinutes,
} from "../../lib/utils";
import {
  CATEGORY_CONFIG,
  DEFAULT_MACRO_GOALS,
  DAYS_SHORT,
  MONTHS,
} from "../../lib/constants";
import type { TimeBlock } from "../../types";

export function DashboardModule() {
  const user = useAppStore((s) => s.user)!;
  const setTab = useAppStore((s) => s.setActiveTab);
  const clock = useClock();

  const { blocks } = useTodayBlocks();
  const { meals } = useMealsForDate(todayISO());
  const { workouts } = useWorkouts();
  const lastWorkout = workouts[0] ?? null;
  const { exercises: lastExercises } = useExercisesForWorkout(
    lastWorkout?.id ?? null,
  );
  const { events } = useEvents();

  // Derived state
  const nowMin = nowMinutes();
  const dayPct = Math.round((nowMin / (24 * 60)) * 100);
  const currentBlock = useMemo(
    () => blocks.find(isBlockActive) ?? null,
    [blocks, nowMin],
  );
  const nextBlock = useMemo(
    () =>
      [...blocks]
        .filter((b) => !isBlockActive(b) && !isBlockPast(b))
        .sort((a, b) => a.start_time.localeCompare(b.start_time))[0] ?? null,
    [blocks, nowMin],
  );
  const macros = useMemo(() => sumMacros(meals), [meals]);
  const catSummary = useMemo(() => buildCategorySummary(blocks), [blocks]);
  const mealSugg = useMemo(() => findMealSuggestion(blocks), [blocks, nowMin]);
  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => daysUntil(e.date) >= 0 && daysUntil(e.date) <= 14)
        .slice(0, 5),
    [events],
  );

  return (
    <div className="p-8 max-w-6xl">
      <PageHeader
        title={`Olá, ${user.name.split(" ")[0]} 👋`}
        subtitle={`${DAYS_SHORT[clock.getDay()]}, ${clock.getDate()} de ${MONTHS[clock.getMonth()]} · ${String(clock.getHours()).padStart(2, "0")}:${String(clock.getMinutes()).padStart(2, "0")}`}
      />

      {/* Top stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Atividade atual"
          value={currentBlock?.title ?? "Livre"}
          subtitle={
            currentBlock ? `até ${fmtTime(currentBlock.end_time)}` : "—"
          }
          icon={<ClockIcon />}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Próximo bloco"
          value={nextBlock?.title ?? "—"}
          subtitle={nextBlock ? fmtTime(nextBlock.start_time) : "Nenhum"}
          icon={<TrendIcon />}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Calorias hoje"
          value={`${macros.calories} kcal`}
          subtitle={`${meals.length} refeições`}
          icon={<AppleIcon />}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Progresso do dia"
          value={`${dayPct}%`}
          subtitle={`${String(clock.getHours()).padStart(2, "0")}:${String(clock.getMinutes()).padStart(2, "0")} de 24h`}
          icon={<SunIcon />}
          color="bg-pink-50 text-pink-600"
        />
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* Left column (3/5) */}
        <div className="col-span-3 flex flex-col gap-5">
          {/* Timeline */}
          <Card>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-bold text-slate-900">
                Cronograma de hoje
              </h3>
              <button
                onClick={() => setTab("time")}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Editar →
              </button>
            </div>
            {blocks.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                Nenhum bloco criado.{" "}
                <button
                  onClick={() => setTab("time")}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Criar agora
                </button>
              </p>
            ) : (
              <DashboardTimeline blocks={blocks} nowMin={nowMin} />
            )}
          </Card>

          {/* Category breakdown */}
          {catSummary.length > 0 && (
            <Card>
              <h3 className="text-sm font-bold text-slate-900 mb-4">
                Distribuição do dia
              </h3>
              <div className="flex flex-col gap-3">
                {catSummary.map((item) => (
                  <div key={item.category} className="flex items-center gap-3">
                    <CategoryBadge category={item.category} />
                    <div className="flex-1">
                      <ProgressBar
                        value={item.percentage}
                        color={`bg-[${CATEGORY_CONFIG[item.category]?.color}]`}
                        height="h-1.5"
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-12 text-right">
                      {fmtDuration(item.totalMinutes)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right column (2/5) */}
        <div className="col-span-2 flex flex-col gap-5">
          {/* Meal suggestion */}
          {mealSugg && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                  <InfoIcon />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-800 mb-0.5">
                    💡 Sugestão de refeição
                  </p>
                  <p className="text-xs text-amber-700">
                    Pausa às {fmtTime(mealSugg.start_time)} —{" "}
                    {fmtDuration(
                      mealSugg.end_time
                        ? parseInt(mealSugg.end_time) -
                            parseInt(mealSugg.start_time)
                        : 30,
                    )}{" "}
                    livres. Aproveita para te alimentar!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Macros */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Macros de hoje
              </h3>
              <button
                onClick={() => setTab("fitness")}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Ver tudo →
              </button>
            </div>
            <MacroBar
              label="Proteína"
              value={macros.protein}
              goal={DEFAULT_MACRO_GOALS.protein}
              color="bg-indigo-500"
            />
            <MacroBar
              label="Carboidratos"
              value={macros.carbs}
              goal={DEFAULT_MACRO_GOALS.carbs}
              color="bg-amber-500"
            />
            <MacroBar
              label="Gorduras"
              value={macros.fats}
              goal={DEFAULT_MACRO_GOALS.fats}
              color="bg-pink-500"
            />
            <MacroBar
              label="Fibras"
              value={macros.fiber}
              goal={DEFAULT_MACRO_GOALS.fiber}
              color="bg-emerald-500"
            />
          </Card>

          {/* Upcoming events */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Próximos eventos
              </h3>
              <button
                onClick={() => setTab("planning")}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Ver tudo →
              </button>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Nenhum evento próximo
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-50">
                {upcomingEvents.map((ev) => {
                  const days = daysUntil(ev.date);
                  const config =
                    CATEGORY_CONFIG[ev.type as keyof typeof CATEGORY_CONFIG];
                  return (
                    <div key={ev.id} className="flex items-center gap-3 py-2.5">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: config?.color ?? "#6366f1" }}
                      />
                      <span className="flex-1 text-sm text-slate-700 truncate">
                        {ev.title}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          days === 0
                            ? "bg-red-100 text-red-600"
                            : days <= 2
                              ? "bg-orange-100 text-orange-600"
                              : days <= 7
                                ? "bg-amber-100 text-amber-600"
                                : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {days === 0
                          ? "Hoje"
                          : days === 1
                            ? "Amanhã"
                            : `${days}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Last workout */}
          {lastWorkout && (
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Último treino
                </h3>
                <button
                  onClick={() => setTab("fitness")}
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  Ver tudo →
                </button>
              </div>
              <p className="text-sm font-bold text-slate-800 mb-3">
                {lastWorkout.name}
              </p>
              <div className="flex flex-col divide-y divide-slate-50">
                {lastExercises.slice(0, 4).map((ex) => (
                  <div
                    key={ex.id}
                    className="flex justify-between py-2 text-xs"
                  >
                    <span className="text-slate-700">{ex.exercise_name}</span>
                    <span className="text-slate-400">
                      {ex.sets}×{ex.reps} ·{" "}
                      <strong className="text-emerald-600">
                        {ex.weight}kg
                      </strong>
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Timeline Visual ─────────────────────────────────────────────────

function DashboardTimeline({
  blocks,
  nowMin,
}: {
  blocks: TimeBlock[];
  nowMin: number;
}) {
  const sorted = [...blocks].sort((a, b) =>
    a.start_time.localeCompare(b.start_time),
  );
  return (
    <div className="flex flex-col gap-0">
      {sorted.map((b, i) => {
        const active = isBlockActive(b);
        const past = isBlockPast(b);
        const cfg = CATEGORY_CONFIG[b.category];
        return (
          <div key={b.id} className="flex gap-3 items-start pb-3">
            {/* Connector */}
            <div className="flex flex-col items-center w-5 pt-1">
              <div
                className="w-2.5 h-2.5 rounded-full border-2 flex-shrink-0"
                style={{
                  background: active ? cfg?.color : past ? "#cbd5e1" : cfg?.bg,
                  borderColor: active
                    ? cfg?.color
                    : past
                      ? "#e2e8f0"
                      : cfg?.color,
                }}
              />
              {i < sorted.length - 1 && (
                <div className="w-px flex-1 min-h-4 bg-slate-100 my-1" />
              )}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-sm font-medium truncate ${past ? "text-slate-400" : "text-slate-800"}`}
                >
                  {b.title}
                </span>
                <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">
                  {fmtTime(b.start_time)}–{fmtTime(b.end_time)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <CategoryBadge category={b.category} />
                {active && (
                  <span
                    className="text-[11px] font-bold animate-pulse"
                    style={{ color: cfg?.color }}
                  >
                    ● em andamento
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
