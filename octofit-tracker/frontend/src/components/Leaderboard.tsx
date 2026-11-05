import { CapabilityCard } from './CapabilityCard.js';

type Ranking = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  return <CapabilityCard<Ranking>
    title="Leaderboard"
    description="Compare team point totals."
    path="/api/leaderboard"
    dataKey="leaderboard"
    emptyMessage="No leaderboard rankings yet."
    renderItems={(rankings) => <ol>{rankings.map((ranking) => <li key={ranking.rank}>
      {ranking.teamName}: {ranking.totalPoints} points
    </li>)}</ol>}
  />;
}
