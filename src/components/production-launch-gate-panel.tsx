import type {
  ProductionLaunchGate,
  ProductionLaunchEvidenceCheck,
  ProductionLaunchGateItem,
} from "@/services/production-launch-gate";

type ProductionLaunchGatePanelProps = {
  gate: ProductionLaunchGate;
};

export function ProductionLaunchGatePanel({
  gate,
}: ProductionLaunchGatePanelProps) {
  if (!gate.canReadGate) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
            Production launch gate
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{gate.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {gate.summary}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
          <MiniStat label="Launch" value={gate.launchReady ? "yes" : "no"} />
          <MiniStat label="Blocked" value={`${gate.counts.blockedBeforeLive}`} />
          <MiniStat
            label="Evidence"
            value={`${gate.counts.launchEvidenceChecks}`}
          />
          <MiniStat label="Writes" value={`${gate.browserWritesEnabled}`} />
          <MiniStat label="Sends" value={`${gate.externalWritesEnabled}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {gate.items.map((item) => (
          <GateItemCard key={item.key} item={item} />
        ))}
      </div>

      <article className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/70">
              Staging and pilot proof
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              Launch evidence checklist
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
              Collect the Goal 150 launch evidence checklist before moving from
              local review to staging approval, live pilot setup, production
              writes, or student invitations.
            </p>
          </div>
          <MiniStat
            label="Checks"
            value={`${gate.counts.launchEvidenceChecks}`}
          />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {gate.launchEvidenceChecks.map((check) => (
            <LaunchEvidenceCard key={check.key} check={check} />
          ))}
        </div>
      </article>

      <p className="mt-4 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/58">
        {gate.finalReviewPrompt}
      </p>
    </section>
  );
}

function GateItemCard({ item }: { item: ProductionLaunchGateItem }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusPill status={item.status} />
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
              {item.ownerLane}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white">{item.label}</h3>
        </div>
        <div className="flex gap-2">
          <MiniToken label="Writes" value={`${item.browserWritesExpected}`} />
          <MiniToken label="Sends" value={`${item.externalWritesExpected}`} />
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/66">{item.localEvidence}</p>

      <div className="mt-3 rounded-2xl bg-white/[0.05] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
          Missing live evidence
        </p>
        <ul className="mt-2 grid gap-2">
          {item.missingLiveEvidence.map((evidence) => (
            <li key={evidence} className="text-sm leading-6 text-white/62">
              {evidence}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {item.reviewRoutes.map((route) => (
          <span
            key={`${item.key}-${route}`}
            className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/58"
          >
            {route}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-amber-100/70">
        Approval: {item.approvalRequired}
      </p>
    </article>
  );
}

function LaunchEvidenceCard({ check }: { check: ProductionLaunchEvidenceCheck }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#071d1a]/70 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="rounded-full border border-rose-300/30 bg-rose-300/15 px-3 py-1 text-xs font-semibold text-rose-100">
            {check.status.replaceAll("_", " ")}
          </span>
          <h4 className="mt-3 text-base font-semibold text-white">
            {check.label}
          </h4>
          <p className="mt-1 text-xs leading-5 text-white/46">
            {check.ownerLane}
          </p>
        </div>
        <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
          {check.reviewRoute}
        </span>
      </div>

      <dl className="mt-4 space-y-3 text-sm leading-6">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">
            Required evidence
          </dt>
          <dd className="mt-1 text-white/66">{check.requiredEvidence}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">
            Acceptance signal
          </dt>
          <dd className="mt-1 text-white/66">{check.acceptanceSignal}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">
            Still blocked
          </dt>
          <dd className="mt-1 text-white/58">{check.blockedUntil}</dd>
        </div>
      </dl>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniToken({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/58">
      {label} {value}
    </span>
  );
}

function StatusPill({ status }: { status: ProductionLaunchGateItem["status"] }) {
  const className =
    status === "local_evidence_ready"
      ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
      : "border-rose-300/30 bg-rose-300/15 text-rose-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
