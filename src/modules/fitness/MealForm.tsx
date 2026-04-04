import { useState } from "react";
import { MealFormData } from "../../types";
import {
  Card,
  Button,
  Input,
  Textarea,
  FormField,
  SectionTitle,
} from "../../components/ui";

interface MealFormProps {
  onSubmit: (data: MealFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function MealForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: MealFormProps) {
  const [form, setForm] = useState<MealFormData>({
    name: "",
    time: new Date().toTimeString().slice(0, 5),
    protein: "",
    carbs: "",
    fats: "",
    fiber: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Por favor, insira o nome da refeição");
      return;
    }
    onSubmit(form);
    setForm({
      name: "",
      time: new Date().toTimeString().slice(0, 5),
      protein: "",
      carbs: "",
      fats: "",
      fiber: "",
      notes: "",
    });
  };

  const calories = (
    (Number(form.protein) || 0) * 4 +
    (Number(form.carbs) || 0) * 4 +
    (Number(form.fats) || 0) * 9
  ).toFixed(0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card padding className="space-y-4">
        <SectionTitle>Informações da Refeição</SectionTitle>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nome da Refeição *">
            <Input
              type="text"
              placeholder="ex: Almoço, Café da Manhã..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>

          <FormField label="Hora">
            <Input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </FormField>
        </div>
      </Card>

      {/* Macronutrients */}
      <Card padding className="space-y-4">
        <SectionTitle>Macronutrientes</SectionTitle>

        <div className="grid grid-cols-4 gap-3">
          <FormField label="Proteína (g)">
            <Input
              type="number"
              min="0"
              step="0.1"
              placeholder="30"
              value={form.protein}
              onChange={(e) => setForm({ ...form, protein: e.target.value })}
            />
          </FormField>

          <FormField label="Carbos (g)">
            <Input
              type="number"
              min="0"
              step="0.1"
              placeholder="50"
              value={form.carbs}
              onChange={(e) => setForm({ ...form, carbs: e.target.value })}
            />
          </FormField>

          <FormField label="Gorduras (g)">
            <Input
              type="number"
              min="0"
              step="0.1"
              placeholder="20"
              value={form.fats}
              onChange={(e) => setForm({ ...form, fats: e.target.value })}
            />
          </FormField>

          <FormField label="Fibras (g)">
            <Input
              type="number"
              min="0"
              step="0.1"
              placeholder="5"
              value={form.fiber}
              onChange={(e) => setForm({ ...form, fiber: e.target.value })}
            />
          </FormField>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
          <div className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
            ≈ {calories} calorias
          </div>
          <div className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
            P: {form.protein || 0}g | C: {form.carbs || 0}g | G:{" "}
            {form.fats || 0}g | F: {form.fiber || 0}g
          </div>
        </div>
      </Card>

      {/* Notes */}
      <Card padding className="space-y-4">
        <FormField label="Notas">
          <Textarea
            placeholder="ex: Sem óleo, adoçante..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
          />
        </FormField>
      </Card>

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
          {isLoading ? "Guardando..." : "Guardar Refeição"}
        </Button>
      </div>
    </form>
  );
}
