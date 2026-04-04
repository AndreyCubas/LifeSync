import { useState } from "react";
import { MealFormData } from "../../types";

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
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nome da Refeição *
          </label>
          <input
            type="text"
            placeholder="ex: Almoço, Café da Manhã..."
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Hora
          </label>
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Proteína (g)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="30"
            value={form.protein}
            onChange={(e) => setForm({ ...form, protein: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Carbos (g)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="50"
            value={form.carbs}
            onChange={(e) => setForm({ ...form, carbs: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Gorduras (g)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="20"
            value={form.fats}
            onChange={(e) => setForm({ ...form, fats: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Fibras (g)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="5"
            value={form.fiber}
            onChange={(e) => setForm({ ...form, fiber: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="text-sm font-semibold text-slate-900">
          ≈ {calories} calorias
        </div>
        <div className="text-xs text-slate-500 mt-1">
          P: {form.protein || 0}g | C: {form.carbs || 0}g | G: {form.fats || 0}g
          | F: {form.fiber || 0}g
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Notas
        </label>
        <textarea
          placeholder="ex: Sem óleo, adoçante..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex gap-3 justify-end pt-4">
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
          {isLoading ? "Guardando..." : "Guardar Refeição"}
        </button>
      </div>
    </form>
  );
}
