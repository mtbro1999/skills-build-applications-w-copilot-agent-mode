import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; mascot?: string; members: string[] };

export default function Teams() {
  return <CapabilityCard<Team>
    title="Teams"
    description="Manage teams and members."
    path="/api/teams"
    dataKey="teams"
    emptyMessage="No teams yet."
    renderItems={(teams) => <ul>{teams.map((team) => <li key={team.name}>
      {team.name} {team.mascot ? `(${team.mascot})` : ''} - {team.members.length} members
    </li>)}</ul>}
  />;
}
