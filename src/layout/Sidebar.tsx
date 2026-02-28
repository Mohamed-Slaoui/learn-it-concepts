import { CONCEPTS } from '../data/conceptsList';
import { ConceptDetails } from '../components/ConceptDetails';

interface SidebarProps {
  activeConcept: string;
}

export function Sidebar({ activeConcept }: SidebarProps) {
  const concept = CONCEPTS.find((c) => c.id === activeConcept);

  if (!concept) return null;

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden">
      <ConceptDetails concept={concept} />
    </aside>
  );
}
