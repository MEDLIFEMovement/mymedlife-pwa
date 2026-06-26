import type {
  DiscourseBakeoffEvaluation,
  DiscourseBakeoffStatus,
} from "@/services/discourse-bakeoff-evaluation";

export function DiscourseBakeoffPanel({
  evaluation,
}: {
  evaluation: DiscourseBakeoffEvaluation;
}) {
  return (
    <section className="rounded-[2rem] border border-blue-300/20 bg-blue-300/10 p-5">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/80">
            Bake-off recommendation
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {evaluation.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {evaluation.summary}
          </p>
        </div>
        <p className="rounded-2xl border border-white/10 bg-[#bfdbfe]/40 p-4 text-sm leading-6 text-white/72">
          {evaluation.finalRecommendation}
        </p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {evaluation.items.map((item) => (
          <article
            key={item.key}
            className="rounded-2xl border border-white/10 bg-[#bfdbfe]/40 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <BakeoffStatusPill status={item.status} />
                <h3 className="mt-3 text-base font-semibold text-white">
                  {item.label}
                </h3>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/72">
              <span className="font-semibold text-white">myMEDLIFE:</span>{" "}
              {item.mymedlifePosture}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/62">
              <span className="font-semibold text-white">Discourse:</span>{" "}
              {item.discoursePosture}
            </p>
            <p className="mt-3 rounded-2xl bg-white/[0.05] p-3 text-xs leading-5 text-white/54">
              Recommendation: {item.recommendation}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.routeEvidence.map((route) => (
                <span
                  key={`${item.key}-${route}`}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/58"
                >
                  {route}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-2">
        {evaluation.nextSteps.map((item) => (
          <p
            key={item}
            className="rounded-2xl border border-white/10 bg-[#bfdbfe]/40 p-3 text-sm leading-6 text-white/64"
          >
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}

function BakeoffStatusPill({
  status,
}: {
  status: DiscourseBakeoffStatus;
}) {
  const className =
    status === "pwa_leads"
      ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
      : status === "reference_only"
        ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
        : "border-blue-300/30 bg-blue-300/15 text-blue-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
