import type {
  Phase2AuthFoundationPacket,
  Phase2OwnerDecision,
  Phase2ProfileRule,
  Phase2RoleRoute,
} from "@/services/phase-2-auth-onboarding-foundation";

export function Phase2AuthOnboardingPanel({
  packet,
}: {
  packet: Phase2AuthFoundationPacket;
}) {
  return (
    <section className="rounded-[2rem] border border-indigo-300/20 bg-indigo-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-100/80">
            MED-473 foundation
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{packet.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {packet.summary}
          </p>
          <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-indigo-50/80">
            Identity source of truth: {packet.identitySourceOfTruth}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <MiniStat label="Routes" value={`${packet.counts.roleRoutes}`} />
          <MiniStat label="Ready" value={`${packet.counts.readyForReview}`} />
          <MiniStat label="Owner input" value={`${packet.counts.ownerInputRequired}`} />
          <MiniStat label="Live auth" value="blocked" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100/70">
            Role routing
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            Where each signed-in role should land
          </h3>
          <div className="mt-4 grid gap-2">
            {packet.roleRoutes.map((item) => (
              <RoleRouteCard key={item.audience} item={item} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100/70">
            Profile rules
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            Identity, duplicate, and authorization rules
          </h3>
          <div className="mt-4 grid gap-2">
            {packet.profileRules.map((item) => (
              <ProfileRuleCard key={item.key} item={item} />
            ))}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100/70">
            Owner decisions
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            Join, approval, role, coach, and rollback ownership
          </h3>
          <div className="mt-4 grid gap-2">
            {packet.ownerDecisions.map((item) => (
              <OwnerDecisionCard key={item.key} item={item} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100/70">
            Blocked live actions
          </p>
          <ul className="mt-3 grid gap-2">
            {packet.blockedLiveActions.map((item) => (
              <li key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-white/62">
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-sm font-semibold text-white">Callback route</p>
          <p className="mt-1 text-sm leading-6 text-white/62">{packet.callbackRoute}</p>

          <div className="mt-4 grid gap-2">
            {packet.officialReferences.map((reference) => (
              <a
                key={reference.url}
                href={reference.url}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold text-white transition hover:border-indigo-200/40 hover:bg-white/[0.07]"
              >
                {reference.label}
              </a>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function RoleRouteCard({ item }: { item: Phase2RoleRoute }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-sm font-semibold text-white">{item.audience.replaceAll("_", " ")}</p>
      <p className="mt-2 text-sm leading-6 text-white/62">
        Preferred route: {item.preferredRoute}
      </p>
      <p className="text-sm leading-6 text-white/62">
        Fallback route: {item.fallbackRoute}
      </p>
      <p className="mt-2 text-xs leading-5 text-indigo-50/72">{item.reason}</p>
    </article>
  );
}

function ProfileRuleCard({ item }: { item: Phase2ProfileRule }) {
  const tone =
    item.status === "ready_for_review"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : "border-amber-300/30 bg-amber-300/15 text-amber-100";

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-white">{item.label}</p>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
          {item.status.replaceAll("_", " ")}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-white/62">{item.rule}</p>
    </article>
  );
}

function OwnerDecisionCard({ item }: { item: Phase2OwnerDecision }) {
  const tone =
    item.status === "ready_for_review"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : "border-amber-300/30 bg-amber-300/15 text-amber-100";

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{item.label}</p>
          <p className="mt-1 text-xs text-white/48">{item.owners.join(" / ")}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
          {item.status.replaceAll("_", " ")}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-white/62">{item.decision}</p>
    </article>
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
