import { Meal } from "../../types";
import { Card, SectionTitle, TrashIcon } from "../../components/ui";

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
      <Card
        padding
        className="bg-gradient-to-r from-indigo-50 dark:from-indigo-900/30 to-indigo-100 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800"
      >
        <div className="grid grid-cols-5 gap-4">
          <div>
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              Total
            </div>
            <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
              {totalCalories}
            </div>
            <div className="text-xs text-indigo-700 dark:text-indigo-300">
              calorias
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              Proteína
            </div>
            <div className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
              {totalProtein.toFixed(1)}g
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              Carbos
            </div>
            <div className="text-xl font-bold text-amber-900 dark:text-amber-100">
              {totalCarbs.toFixed(1)}g
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
              Gorduras
            </div>
            <div className="text-xl font-bold text-rose-900 dark:text-rose-100">
              {totalFats.toFixed(1)}g
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              Fibras
            </div>
            <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
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
              padding
              hover
              className="flex items-start justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-baseline gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {meal.name}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {meal.time}
                  </span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {mealCalories} kcal
                  </span>
                </div>

                <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-300 mb-2">
                  <div>
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                      {meal.protein.toFixed(1)}g
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {" "}
                      proteína
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      {meal.carbs.toFixed(1)}g
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {" "}
                      carbos
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-rose-600 dark:text-rose-400">
                      {meal.fats.toFixed(1)}g
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {" "}
                      gorduras
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {meal.fiber.toFixed(1)}g
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {" "}
                      fibras
                    </span>
                  </div>
                </div>

                {meal.notes && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                    📝 {meal.notes}
                  </div>
                )}
              </div>

              <button
                onClick={() => onDelete(meal.id)}
                disabled={isLoading}
                title="Remover refeição"
                className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50 flex-shrink-0 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <TrashIcon />
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
