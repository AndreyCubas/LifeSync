import { useState } from "react";
import { useAppStore } from "../../store/appStore";
import {
  PageHeader,
  Card,
  Button,
  EmptyState,
  DumbbellIcon,
} from "../../components/ui";

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

      {subtab === "nutrition" && <NutritionTab />}
      {subtab === "workouts" && <WorkoutsTab />}
      {subtab === "progress" && <ProgressTab />}
    </div>
  );
}

function NutritionTab() {
  const user = useAppStore((s) => s.user);

  return (
    <div className="space-y-6">
      {/* Macro Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Calorias", value: "—", color: "text-indigo-600" },
          {
            label: "Proteína",
            value: "—g",
            target: "150g",
            color: "text-indigo-600",
          },
          {
            label: "Carbos",
            value: "—g",
            target: "250g",
            color: "text-amber-600",
          },
          {
            label: "Gorduras",
            value: "—g",
            target: "65g",
            color: "text-rose-600",
          },
          {
            label: "Fibras",
            value: "—g",
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
            </div>
            {stat.target && (
              <div className="text-xs text-slate-400 mt-1">/ {stat.target}</div>
            )}
          </Card>
        ))}
      </div>

      {/* Empty State */}
      <Card className="p-16">
        <EmptyState
          icon={<div className="text-5xl">🥗</div>}
          text="Nenhuma refeição registada"
          action={<Button size="sm">Registar Refeição</Button>}
        />
      </Card>
    </div>
  );
}

function WorkoutsTab() {
  return (
    <Card className="p-16">
      <EmptyState
        icon={<DumbbellIcon />}
        text="Nenhuma ficha de treino criada"
        action={<Button size="sm">Nova Ficha</Button>}
      />
    </Card>
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
