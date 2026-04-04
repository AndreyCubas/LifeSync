import { Workout } from "../../types";
import { Card } from "../../components/ui";

interface WorkoutListProps {
  workouts: Workout[];
  onDelete: (id: string) => void;
  onViewExercises?: (workoutId: string) => void;
  isLoading?: boolean;
}

export function WorkoutList({
  workouts,
  onDelete,
  onViewExercises,
  isLoading = false,
}: WorkoutListProps) {
  if (workouts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-slate-900">
        Fichas Registadas ({workouts.length})
      </h3>

      {workouts.map((workout) => {
        const dateObj = new Date(workout.date + "T00:00:00");
        const formattedDate = dateObj.toLocaleDateString("pt-PT", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        });

        return (
          <Card
            key={workout.id}
            className="p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-baseline gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {workout.name}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {formattedDate}
                  </span>
                </div>

                {workout.notes && (
                  <div className="text-xs text-slate-600 mb-3">
                    📝 {workout.notes}
                  </div>
                )}

                <div className="flex gap-3">
                  {onViewExercises && (
                    <button
                      onClick={() => onViewExercises(workout.id)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Ver Exercícios
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDelete(workout.id)}
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
  );
}
