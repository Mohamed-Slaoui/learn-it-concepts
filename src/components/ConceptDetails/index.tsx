import type { ConceptMeta } from '../../types';

interface ConceptDetailsProps {
  concept: ConceptMeta;
}

const SECTION_LABEL = 'text-[10px] font-bold tracking-[2px] uppercase mb-1.5';

export function ConceptDetails({ concept }: ConceptDetailsProps) {
  return (
    <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-4">
      {/* OVERVIEW */}
      <section className="px-3">
        <h3 className={`${SECTION_LABEL} text-code`} style={{ color: '#64748b' }}>
          Overview
        </h3>
        <p className="text-[12px] text-slate-700 leading-relaxed text-serif">
          {concept.overview}
        </p>
      </section>

      <div className="border-t border-slate-100 mx-3" />

      {/* HOW IT WORKS */}
      <section className="px-3">
        <h3 className={`${SECTION_LABEL} text-code`} style={{ color: '#64748b' }}>
          How It Works
        </h3>
        <p className="text-[12px] text-slate-700 leading-relaxed text-serif">
          {concept.howItWorks}
        </p>
      </section>

      <div className="border-t border-slate-100 mx-3" />

      {/* REAL-WORLD EXAMPLE */}
      <section className="px-3">
        <h3 className={`${SECTION_LABEL} text-code`} style={{ color: '#64748b' }}>
          Real-World Example
        </h3>
        <div
          className="rounded-lg p-2.5 text-[12px] leading-relaxed text-serif"
          style={{
            background: '#f8fafc',
            borderLeft: `3px solid ${concept.color}`,
            color: '#475569',
          }}
        >
          {concept.realWorldDetails}
        </div>
      </section>

      <div className="border-t border-slate-100 mx-3" />

      {/* USE CASE */}
      <section className="px-3">
        <h3 className={`${SECTION_LABEL} text-code`} style={{ color: '#64748b' }}>
          Use Case
        </h3>
        <p className="text-[12px] text-slate-700 leading-relaxed text-serif">
          {concept.useCases[0]} — {concept.what}
        </p>
      </section>

      {/* PROCESS STEPS */}
      {concept.processSteps?.length > 0 && (
        <>
          <div className="border-t border-slate-100 mx-3" />
          <section className="px-3 pb-3">
            <h3 className={`${SECTION_LABEL} text-code`} style={{ color: '#64748b' }}>
              Process Steps
            </h3>
            <div className="flex flex-col gap-2">
              {concept.processSteps.map((step) => (
                <div key={step.num} className="flex items-start gap-2">
                  <span
                    className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white mt-[1px] text-code"
                    style={{ background: concept.color }}
                  >
                    {step.num}
                  </span>
                  <p
                    className="text-[12px] text-slate-600 leading-snug text-serif"
                  >
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
