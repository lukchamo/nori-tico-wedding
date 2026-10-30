import { STAGES, type Stage } from "@/lib/invitations";

export function StagePill({ stage }: { stage: Stage }) {
  const s = STAGES[stage];
  return <span className={`adm-pill tone-${s.tone}`}>{s.label}</span>;
}
