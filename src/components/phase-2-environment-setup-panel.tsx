import type {
  Phase2EnvironmentExpectation,
  Phase2EnvironmentOwnerFollowUp,
  Phase2EnvironmentLane,
  Phase2EnvironmentSetupPacket,
  Phase2EnvironmentVariablePlan,
} from "@/services/phase-2-environment-setup";

export function Phase2EnvironmentSetupPanel({
  packet,
}: {
  packet: Phase2EnvironmentSetupPacket;
}) {
  return (
    <section className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
            MED-472 foundation
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{packet.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {packet.summary}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <MiniStat label="Envs" value={`${packet.counts.environments}`} />
          <MiniStat label="Hosted" value={`${packet.counts.hostedProjects}`} />
          <MiniStat label="Ready" value={`${packet.counts.readyForReview}`} />
          <MiniStat label="Owner input" value={`${packet.counts.ownerInputRequired}`} />
          <MiniStat label="Live" value="blocked" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ReviewBadge label="Read-only preview" />
        <ReviewBadge label="Blocked production writes" />
        <ReviewBadge label="Blocked external sends" />
        <ReviewBadge label="Source-backed setup review" />
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
            Selected topology
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            {packet.selectedTopology.label}
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/62">
            {packet.selectedTopology.plainEnglishSummary}
          </p>
          <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-cyan-100/78">
            {packet.selectedTopology.technicalSummary}
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
            Hosted Supabase state
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            Current connector readback
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/62">
            {packet.hostedSupabaseState.summary}
          </p>
          <div className="mt-4 grid gap-2">
            {packet.hostedSupabaseState.projects.map((project) => (
              <article
                key={project.ref}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
              >
                <p className="text-sm font-semibold text-white">{project.name}</p>
                <p className="mt-1 text-xs text-white/48">
                  {project.ref} / {project.region} / {project.status}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  Created {project.createdAt}. Environment role: {project.environmentRole}.
                </p>
              </article>
            ))}
          </div>
          <ul className="mt-4 grid gap-1">
            {packet.hostedSupabaseState.blockers.map((item) => (
              <li key={item} className="text-sm leading-6 text-white/58">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {packet.environments.map((environment) => (
          <EnvironmentCard key={environment.key} environment={environment} />
        ))}
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
            Environment variables
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            Browser and server-only key plan
          </h3>
          <div className="mt-4 grid gap-2">
            {packet.environmentVariables.map((item) => (
              <EnvironmentVariableCard key={item.name} item={item} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
            Owner expectations
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            What must be named before live work
          </h3>
          <div className="mt-4 grid gap-2">
            {packet.expectations.map((item) => (
              <ExpectationCard key={item.key} item={item} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
            Next owner actions
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            What Kiomi / DS needs to do next
          </h3>
          <div className="mt-4 grid gap-2">
            {packet.ownerFollowUp.map((item) => (
              <OwnerFollowUpCard key={item.key} item={item} />
            ))}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
            Blocked live actions
          </p>
          <ul className="mt-3 grid gap-2">
            {packet.blockedLiveActions.map((item) => (
              <li key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-white/62">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
            Official references
          </p>
          <div className="mt-3 grid gap-2">
            {packet.officialReferences.map((reference) => (
              <a
                key={reference.url}
                href={reference.url}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold text-white transition hover:border-cyan-200/40 hover:bg-white/[0.07]"
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

function EnvironmentCard({ environment }: { environment: Phase2EnvironmentLane }) {
  const tone =
    environment.status === "ready_for_review"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : "border-amber-300/30 bg-amber-300/15 text-amber-100";

  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/70">
            {environment.key}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">{environment.label}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
          {environment.status.replaceAll("_", " ")}
        </span>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-white/62">
        <p>Owners: {environment.owners.join(" / ")}</p>
        <p>App host: {environment.appHost}</p>
        <p>Auth callback: {environment.authCallback}</p>
        <p>Redirect pattern: {environment.redirectPattern}</p>
        <p>Supabase: {environment.supabaseProject}</p>
        <p>Vercel: {environment.vercelEnvironment}</p>
      </div>
      <ul className="mt-3 grid gap-1">
        {environment.notes.map((note) => (
          <li key={note} className="text-sm leading-6 text-white/58">
            {note}
          </li>
        ))}
      </ul>
    </article>
  );
}

function EnvironmentVariableCard({
  item,
}: {
  item: Phase2EnvironmentVariablePlan;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{item.name}</p>
          <p className="mt-1 text-xs text-white/48">{item.environments.join(" / ")}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/56">
          {item.scope.replace("_", " ")}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-white/62">{item.notes}</p>
      <p className="mt-2 text-xs text-cyan-100/72">{item.owners.join(" / ")}</p>
    </article>
  );
}

function ExpectationCard({ item }: { item: Phase2EnvironmentExpectation }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm font-semibold text-white">{item.label}</p>
        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/56">
          {item.owners.join(" / ")}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-white/62">
        {item.evidenceRequired}
      </p>
    </article>
  );
}

function OwnerFollowUpCard({ item }: { item: Phase2EnvironmentOwnerFollowUp }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm font-semibold text-white">{item.label}</p>
        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/56">
          {item.owners.join(" / ")}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-white/62">{item.nextAction}</p>
    </article>
  );
}

function ReviewBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-cyan-100/78">
      {label}
    </span>
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
