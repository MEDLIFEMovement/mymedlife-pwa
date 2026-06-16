import type { AdminGlossary } from "@/services/admin-glossary";

type AdminGlossaryPanelProps = {
  glossary: AdminGlossary;
};

export function AdminGlossaryPanel({ glossary }: AdminGlossaryPanelProps) {
  if (!glossary.canReadGlossary) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-white/12 bg-white/[0.05] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/48">
            Plain English
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{glossary.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {glossary.summary}
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/62">
          {glossary.terms.length} terms
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {glossary.terms.map((item) => (
          <article key={item.term} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <h3 className="text-lg font-semibold text-white">{item.term}</h3>
            <p className="mt-2 text-sm leading-6 text-white/68">{item.plainEnglish}</p>
            <p className="mt-3 rounded-xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/52">
              Why it matters: {item.whyItMatters}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
