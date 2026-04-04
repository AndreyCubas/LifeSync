import { Meal } from "../../types";
import { Card } from "../../components/ui";

interface MealListProps {
  meals: Meal[];
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function MealList({
  meals,
  onDelete,
  isLoading = false,
}: MealListProps) {
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFats = meals.reduce((sum, m) => sum + m.fats, 0);
  const totalFiber = meals.reduce((sum, m) => sum + m.fiber, 0);
  const totalCalories = (
    totalProtein * 4 +
    totalCarbs * 4 +
    totalFats * 9
  ).toFixed(0);

  if (meals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Totals Summary */}
      <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200 p-4">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
              Total
            </div>
            <div className="text-2xl font-bold text-indigo-900">
              {totalCalories}
            </div>
            <div className="text-xs text-indigo-700">calorias</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
              Proteína
            </div>
            <div className="text-xl font-bold text-indigo-900">
              {totalProtein.toFixed(1)}g
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
              Carbos
            </div>
            <div className="text-xl font-bold text-amber-900">
              {totalCarbs.toFixed(1)}g
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-rose-600 uppercase tracking-wide">
              Gorduras
            </div>
            <div className="text-xl font-bold text-rose-900">
              {totalFats.toFixed(1)}g
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
              Fibras
            </div>
            <div className="text-xl font-bold text-emerald-900">
              {totalFiber.toFixed(1)}g
            </div>
          </div>
        </div>
      </Card>

      {/* Meals List */}
      <div className="space-y-3">
        {meals.map((meal) => {
          const mealCalories = (
            meal.protein * 4 +
            meal.carbs * 4 +
            meal.fats * 9
          ).toFixed(0);
          return (
            <Card
              key={meal.id}
              className="p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-baseline gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {meal.name}
                    </h3>
                    <span className="text-xs text-slate-500">{meal.time}</span>
                    <span className="text-sm font-bold text-indigo-600">
                      {mealCalories} kcal
                    </span>
                  </div>

                  <div className="flex gap-4 text-xs text-slate-600 mb-2">
                    <div>
                      <span className="font-medium text-indigo-600">
                        {meal.protein.toFixed(1)}g
                      </span>
                      <span className="text-slate-500"> proteína</span>
                    </div>
                    <div>
                      <span className="font-medium text-amber-600">
                        {meal.carbs.toFixed(1)}g
                      </span>
                      <span className="text-slate-500"> carbos</span>
                    </div>
                    <div>
                      <span className="font-medium text-rose-600">
                        {meal.fats.toFixed(1)}g
                      </span>
                      <span className="text-slate-500"> gorduras</span>
                    </div>
                    <div>
                      <span className="font-medium text-emerald-600">
                        {meal.fiber.toFixed(1)}g
                      </span>
                      <span className="text-slate-500"> fibras</span>
                    </div>
                  </div>

                  {meal.notes && (
                    <div className="text-xs text-slate-500 italic">
                      📝 {meal.notes}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onDelete(meal.id)}
                  disabled={isLoading}
                  className="text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
