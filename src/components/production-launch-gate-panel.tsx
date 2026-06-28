import type {
  ProductionLaunchGate,
  ProductionLaunchEvidenceCheck,
  ProductionEnvironmentReadinessItem,
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
    <section className="rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
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
          <MiniStat
            label="Env"
            value={`${gate.counts.environmentReadinessItems}`}
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

      <article className="mt-5 rounded-3xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/70">
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

      <article className="mt-5 rounded-3xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/70">
              Supabase and Vercel readiness
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              Production environment packet
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
              Confirm the production project, env vars, callbacks, DNS, backups,
              rollback, and support ownership before a live pilot. This packet
              records evidence needs only; it does not reveal or set secrets.
            </p>
          </div>
          <MiniStat
            label="Items"
            value={`${gate.counts.environmentReadinessItems}`}
          />
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {gate.environmentReadiness.map((item) => (
            <EnvironmentReadinessCard key={item.key} item={item} />
          ))}
        </div>
      </article>

      <p className="mt-4 rounded-2xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/70 p-3 text-xs leading-5 text-white/58">
        {gate.finalReviewPrompt}
      </p>
    </section>
  );
}

function GateItemCard({ item }: { item: ProductionLaunchGateItem }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
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
            className="rounded-full border border-white/10 bg-[var(--mymedlife-border)]/40 px-2.5 py-1 text-xs font-semibold text-white/58"
          >
            {route}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-[var(--mymedlife-badge-background)]/70">
        Approval: {item.approvalRequired}
      </p>
    </article>
  );
}

function LaunchEvidenceCard({ check }: { check: ProductionLaunchEvidenceCheck }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/70 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="rounded-full border border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 px-3 py-1 text-xs font-semibold text-[var(--mymedlife-badge-background)]">
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

function EnvironmentReadinessCard({
  item,
}: {
  item: ProductionEnvironmentReadinessItem;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/70 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="rounded-full border border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 px-3 py-1 text-xs font-semibold text-[var(--mymedlife-badge-background)]">
            {item.status.replaceAll("_", " ")}
          </span>
          <h4 className="mt-3 text-base font-semibold text-white">
            {item.label}
          </h4>
          <p className="mt-1 text-xs leading-5 text-white/46">
            {item.ownerLane}
          </p>
        </div>
        <MiniToken label="Secrets" value={`${item.secretsShown}`} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Checklist title="Required evidence" items={item.requiredEvidence} />
        <Checklist title="Safe defaults" items={item.safeDefaults} />
      </div>

      {item.envVarManifest ? (
        <div className="mt-3 rounded-2xl bg-white/[0.05] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">
            Env-var manifest
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {item.envVarManifest.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-white/58">
                  {group.label}
                </p>
                <ul className="mt-2 grid gap-1">
                  {group.names.map((name) => (
                    <li
                      key={name}
                      className="font-mono text-[0.72rem] leading-5 text-white/62"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-xs leading-5 text-white/58">
        Blocked until: {item.blockedUntil}
      </p>
    </div>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-white/[0.05] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">
        {title}
      </p>
      <ul className="mt-2 grid gap-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-white/62">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 px-3 py-2">
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
      ? "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 text-[var(--mymedlife-badge-background)]"
      : "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 text-[var(--mymedlife-badge-background)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
