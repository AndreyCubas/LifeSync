import { useState } from "react";
import { WorkoutFormData, ExerciseFormData } from "../../types";
import {
  Card,
  Button,
  Input,
  Textarea,
  FormField,
  SectionTitle,
  TrashIcon,
  PlusIcon,
} from "../../components/ui";

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
      <Card padding className="space-y-4">
        <SectionTitle>Informações da Ficha</SectionTitle>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nome da Ficha *">
            <Input
              type="text"
              placeholder="ex: Peito e Costas, Perna..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>

          <FormField label="Data">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </FormField>
        </div>

        <FormField label="Notas da Sessão">
          <Textarea
            placeholder="ex: Treino mais leve, dores no ombro..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />
        </FormField>
      </Card>

      {/* Add Exercise Form */}
      <Card
        padding
        className="border-2 border-dashed border-slate-200 space-y-4"
      >
        <SectionTitle>Adicionar Exercício</SectionTitle>

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="text"
            placeholder="Nome do exercício *"
            value={newExercise.exercise_name}
            onChange={(e) =>
              setNewExercise({ ...newExercise, exercise_name: e.target.value })
            }
          />
          <Input
            type="number"
            min="1"
            placeholder="Séries"
            value={newExercise.sets}
            onChange={(e) =>
              setNewExercise({ ...newExercise, sets: e.target.value })
            }
          />
          <Input
            type="number"
            min="1"
            placeholder="Repetições"
            value={newExercise.reps}
            onChange={(e) =>
              setNewExercise({ ...newExercise, reps: e.target.value })
            }
          />
          <Input
            type="number"
            min="0"
            step="0.5"
            placeholder="Peso (kg)"
            value={newExercise.weight}
            onChange={(e) =>
              setNewExercise({ ...newExercise, weight: e.target.value })
            }
          />
        </div>

        <Input
          type="text"
          placeholder="Notas do exercício (opcional)"
          value={newExercise.notes}
          onChange={(e) =>
            setNewExercise({ ...newExercise, notes: e.target.value })
          }
        />

        <Button
          type="button"
          variant="outline"
          onClick={handleAddExercise}
          icon={<PlusIcon />}
          className="w-full"
        >
          Adicionar Exercício
        </Button>
      </Card>

      {/* Exercises List */}
      {exercises.length > 0 && (
        <Card padding className="space-y-3">
          <SectionTitle>Exercícios ({exercises.length})</SectionTitle>
          <div className="space-y-2">
            {exercises.map((ex, idx) => (
              <div
                key={idx}
                className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 flex items-start justify-between gap-4 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 dark:text-white mb-2">
                    {ex.exercise_name}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <div>
                      <span className="font-medium">{ex.sets || "—"}</span>{" "}
                      séries ×{" "}
                      <span className="font-medium">{ex.reps || "—"}</span> reps{" "}
                      {ex.weight && (
                        <span className="text-slate-500 dark:text-slate-400">
                          @ <span className="font-medium">{ex.weight}kg</span>
                        </span>
                      )}
                    </div>
                    {ex.notes && (
                      <div className="italic text-slate-500 dark:text-slate-400">
                        📝 {ex.notes}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveExercise(idx)}
                  title="Remover exercício"
                  className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-3 justify-end pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? "Guardando..." : "Guardar Ficha de Treino"}
        </Button>
      </div>
    </form>
  );
}
