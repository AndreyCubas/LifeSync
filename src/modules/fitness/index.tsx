import { useState, useEffect } from "react";
import { useAppStore } from "../../store/appStore";
import { mealsService, workoutsService } from "../../services/dataService";
import { MealFormData, WorkoutFormData, Meal, Workout } from "../../types";
import {
  PageHeader,
  Card,
  Button,
  EmptyState,
  DumbbellIcon,
} from "../../components/ui";
import { MealForm } from "./MealForm";
import { MealList } from "./MealList";
import { WorkoutForm } from "./WorkoutForm";
import { WorkoutList } from "./WorkoutList";

export function FitnessModule() {
  const user = useAppStore((s) => s.user);
  const [subtab, setSubtab] = useState("nutrition");

  if (!user) return null;

  return (
    <div className="p-12 max-w-6xl mx-auto">
      <PageHeader
        title="Fitness & Saúde"
        subtitle="Registo de refeições, treinos e evolução"
      />

      <div className="flex gap-2 bg-slate-50 rounded-xl p-1.5 w-fit mb-12 border border-slate-200">
        {[
          { id: "nutrition", label: "🥗 Nutrição" },
          { id: "workouts", label: "💪 Treinos" },
          { id: "progress", label: "📈 Evolução" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubtab(t.id)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              subtab === t.id
                ? "bg-white text-slate-900 border border-slate-200 shadow-sm"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subtab === "nutrition" && <NutritionTab user={user} />}
      {subtab === "workouts" && <WorkoutsTab user={user} />}
      {subtab === "progress" && <ProgressTab />}
    </div>
  );
}

function NutritionTab({ user }: { user: any }) {
  const today = new Date().toISOString().split("T")[0];
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    setIsLoading(true);
    const result = await mealsService.list(user.id, today);
    if (!result.error) {
      setMeals(result.data);
    }
    setIsLoading(false);
  };

  const handleCreateMeal = async (form: MealFormData) => {
    setIsLoading(true);
    const result = await mealsService.create(user.id, today, form);
    if (!result.error && result.data) {
      setMeals([...meals, result.data]);
      setShowForm(false);
    } else {
      alert("Erro ao guardar refeição: " + result.error);
    }
    setIsLoading(false);
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!confirm("Deseja deletar esta refeição?")) return;
    setIsLoading(true);
    const result = await mealsService.delete(user.id, mealId);
    if (!result.error) {
      setMeals(meals.filter((m) => m.id !== mealId));
    } else {
      alert("Erro ao deletar refeição: " + result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Macro Stats */}
      {meals.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {[
            {
              label: "Calorias",
              value: Math.round(
                meals.reduce(
                  (sum, m) => sum + m.protein * 4 + m.carbs * 4 + m.fats * 9,
                  0,
                ),
              ),
              color: "text-indigo-600",
            },
            {
              label: "Proteína",
              value:
                Math.round(meals.reduce((sum, m) => sum + m.protein, 0) * 10) /
                10,
              target: "150g",
              color: "text-indigo-600",
            },
            {
              label: "Carbos",
              value:
                Math.round(meals.reduce((sum, m) => sum + m.carbs, 0) * 10) /
                10,
              target: "250g",
              color: "text-amber-600",
            },
            {
              label: "Gorduras",
              value:
                Math.round(meals.reduce((sum, m) => sum + m.fats, 0) * 10) / 10,
              target: "65g",
              color: "text-rose-600",
            },
            {
              label: "Fibras",
              value:
                Math.round(meals.reduce((sum, m) => sum + m.fiber, 0) * 10) /
                10,
              target: "30g",
              color: "text-emerald-600",
            },
          ].map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {stat.label}
              </div>
              <div className={`text-xl font-bold ${stat.color}`}>
                {stat.value}
                {stat.label !== "Calorias" && "g"}
              </div>
              {stat.target && (
                <div className="text-xs text-slate-400 mt-1">
                  / {stat.target}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Form or Button */}
      {!showForm ? (
        meals.length === 0 ? (
          <Card className="p-16">
            <EmptyState
              icon={<div className="text-5xl">🥗</div>}
              text="Nenhuma refeição registada"
              action={
                <Button size="sm" onClick={() => setShowForm(true)}>
                  Registar Refeição
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="flex justify-end">
            <Button onClick={() => setShowForm(true)}>
              + Adicionar Refeição
            </Button>
          </div>
        )
      ) : (
        <MealForm
          onSubmit={handleCreateMeal}
          onCancel={() => setShowForm(false)}
          isLoading={isLoading}
        />
      )}

      {/* Meals List */}
      {meals.length > 0 && (
        <MealList
          meals={meals}
          onDelete={handleDeleteMeal}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

function WorkoutsTab({ user }: { user: any }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    setIsLoading(true);
    const result = await workoutsService.list(user.id);
    if (!result.error) {
      setWorkouts(result.data);
    }
    setIsLoading(false);
  };

  const handleCreateWorkout = async (form: WorkoutFormData) => {
    setIsLoading(true);
    const result = await workoutsService.create(user.id, form);
    if (!result.error && result.data) {
      setWorkouts([result.data, ...workouts]);
      setShowForm(false);
    } else {
      alert("Erro ao guardar ficha: " + result.error);
    }
    setIsLoading(false);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm("Deseja deletar esta ficha de treino?")) return;
    setIsLoading(true);
    const result = await workoutsService.delete(user.id, workoutId);
    if (!result.error) {
      setWorkouts(workouts.filter((w) => w.id !== workoutId));
    } else {
      alert("Erro ao deletar ficha: " + result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {!showForm ? (
        workouts.length === 0 ? (
          <Card className="p-16">
            <EmptyState
              icon={<DumbbellIcon />}
              text="Nenhuma ficha de treino criada"
              action={
                <Button size="sm" onClick={() => setShowForm(true)}>
                  Nova Ficha
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="flex justify-end">
            <Button onClick={() => setShowForm(true)}>
              + Nova Ficha de Treino
            </Button>
          </div>
        )
      ) : (
        <WorkoutForm
          onSubmit={handleCreateWorkout}
          onCancel={() => setShowForm(false)}
          isLoading={isLoading}
        />
      )}

      {workouts.length > 0 && (
        <WorkoutList
          workouts={workouts}
          onDelete={handleDeleteWorkout}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

function ProgressTab() {
  return (
    <Card className="p-16">
      <EmptyState
        icon={<div className="text-5xl">📈</div>}
        text="Registe treinos para acompanhar evolução"
      />
    </Card>
  );
}

export default FitnessModule;
