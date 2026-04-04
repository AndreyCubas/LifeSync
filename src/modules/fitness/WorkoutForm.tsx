import { useState } from "react";
import { WorkoutFormData, ExerciseFormData } from "../../types";
import { Card, Button } from "../../components/ui";

interface WorkoutFormProps {
  onSubmit: (data: WorkoutFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function WorkoutForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: WorkoutFormProps) {
  const [form, setForm] = useState<WorkoutFormData>({
    name: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [exercises, setExercises] = useState<ExerciseFormData[]>([]);
  const [newExercise, setNewExercise] = useState<ExerciseFormData>({
    exercise_name: "",
    sets: "",
    reps: "",
    weight: "",
    notes: "",
  });

  const handleAddExercise = () => {
    if (!newExercise.exercise_name.trim()) {
      alert("Por favor, insira o nome do exercício");
      return;
    }
    setExercises([...exercises, newExercise]);
    setNewExercise({
      exercise_name: "",
      sets: "",
      reps: "",
      weight: "",
      notes: "",
    });
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Por favor, insira o nome da ficha de treino");
      return;
    }
    onSubmit(form);
    setForm({
      name: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setExercises([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Workout Info */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">
          Informações da Ficha
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nome da Ficha *
            </label>
            <input
              type="text"
              placeholder="ex: Peito e Costas, Perna..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Notas da Sessão
          </label>
          <textarea
            placeholder="ex: Treino mais leve, dores no ombro..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </Card>

      {/* Add Exercise Form */}
      <Card className="p-6 space-y-4 border-2 border-dashed border-slate-200">
        <h3 className="text-lg font-bold text-slate-900">
          Adicionar Exercício
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Nome do exercício *"
            value={newExercise.exercise_name}
            onChange={(e) =>
              setNewExercise({ ...newExercise, exercise_name: e.target.value })
            }
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="number"
            min="1"
            placeholder="Séries"
            value={newExercise.sets}
            onChange={(e) =>
              setNewExercise({ ...newExercise, sets: e.target.value })
            }
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="number"
            min="1"
            placeholder="Repetições"
            value={newExercise.reps}
            onChange={(e) =>
              setNewExercise({ ...newExercise, reps: e.target.value })
            }
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="Peso (kg)"
            value={newExercise.weight}
            onChange={(e) =>
              setNewExercise({ ...newExercise, weight: e.target.value })
            }
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <input
          type="text"
          placeholder="Notas do exercício (opcional)"
          value={newExercise.notes}
          onChange={(e) =>
            setNewExercise({ ...newExercise, notes: e.target.value })
          }
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <Button
          type="button"
          onClick={handleAddExercise}
          className="w-full bg-slate-100 text-slate-900 hover:bg-slate-200"
        >
          + Adicionar Exercício
        </Button>
      </Card>

      {/* Exercises List */}
      {exercises.length > 0 && (
        <Card className="p-6 space-y-3">
          <h3 className="text-lg font-bold text-slate-900">
            Exercícios ({exercises.length})
          </h3>
          {exercises.map((ex, idx) => (
            <div
              key={idx}
              className="bg-slate-50 rounded-lg p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1">
                <div className="font-semibold text-slate-900 mb-1">
                  {ex.exercise_name}
                </div>
                <div className="text-sm text-slate-600 space-y-1">
                  <div>
                    <span className="font-medium">{ex.sets || "—"}</span> séries
                    × <span className="font-medium">{ex.reps || "—"}</span> reps{" "}
                    {ex.weight && (
                      <span>
                        @ <span className="font-medium">{ex.weight}kg</span>
                      </span>
                    )}
                  </div>
                  {ex.notes && (
                    <div className="italic text-slate-500">📝 {ex.notes}</div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveExercise(idx)}
                className="text-slate-400 hover:text-rose-600 transition-colors flex-shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </Card>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? "Guardando..." : "Guardar Ficha de Treino"}
        </button>
      </div>
    </form>
  );
}
