import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; focus: string; minutes: number; difficulty: string; reason: string };

export default function Workouts() {
  return <CapabilityCard<Workout>
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    path="/api/workouts/suggestions/mona%40example.com"
    dataKey="suggestions"
    emptyMessage="No workout suggestions yet."
    renderItems={(workouts) => <ul>{workouts.map((workout) => <li key={workout.title}>
      <strong>{workout.title}</strong> - {workout.focus}, {workout.minutes} minutes, {workout.difficulty}. {workout.reason}
    </li>)}</ul>}
  />;
}
