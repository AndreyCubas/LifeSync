import { Workout } from "../../types";
import { Card, SectionTitle, Button, TrashIcon } from "../../components/ui";

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
      <SectionTitle>Fichas Registadas ({workouts.length})</SectionTitle>

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
            padding
            hover
            className="flex items-start justify-between gap-4"
          >
            <div className="flex-1">
              <div className="flex items-baseline gap-3 mb-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {workout.name}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formattedDate}
                </span>
              </div>

              {workout.notes && (
                <div className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                  📝 {workout.notes}
                </div>
              )}

              <div className="flex gap-3">
                {onViewExercises && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onViewExercises(workout.id)}
                  >
                    Ver Exercícios
                  </Button>
                )}
              </div>
            </div>

            <button
              onClick={() => onDelete(workout.id)}
              disabled={isLoading}
              title="Remover ficha"
              className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50 flex-shrink-0 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              <TrashIcon />
            </button>
          </Card>
        );
      })}
    </div>
  );
}
