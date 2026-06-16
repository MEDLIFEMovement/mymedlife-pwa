import type {
  ProofUploadIntakeCheck,
  ProofUploadIntakeWorkspace,
} from "@/services/proof-upload-intake";

type ProofUploadIntakePanelProps = {
  workspace: ProofUploadIntakeWorkspace;
};

export function ProofUploadIntakePanel({
  workspace,
}: ProofUploadIntakePanelProps) {
  if (!workspace.canReadWorkspace) {
    return null;
  }

  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
          Proof upload readiness
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          {workspace.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
          {workspace.summary}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Uploads" value={workspace.uploadsEnabled ? "on" : "off"} />
        <MiniStat
          label="Publishing"
          value={workspace.publicPublishingEnabled ? "on" : "off"}
        />
        <MiniStat
          label="External exports"
          value={workspace.externalExportsEnabled ? "on" : "off"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
            Example proof file
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            File is checked, but not uploaded.
          </h2>
          <div className="mt-4 grid gap-3">
            {workspace.checks.map((check) => (
              <ReadinessCheck key={check.key} check={check} />
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
            Consent and context
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Good proof answers a real hesitation.
          </h2>
          <ul className="mt-4 grid gap-3">
            {workspace.consentChecklist.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/66"
              >
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
            Disabled controls
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            These actions are intentionally locked.
          </h2>
          <div className="mt-4 grid gap-3">
            {workspace.blockedControls.map((control) => (
              <div key={control.label} className="rounded-2xl bg-black/20 p-3">
                <p className="font-semibold text-white">{control.label}</p>
                <p className="mt-1 text-sm leading-6 text-white/62">
                  {control.reason}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
            Future storage plan
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            What would happen after approval?
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniStat
              label="Max size"
              value={`${workspace.maxFileSizeMb} MB`}
            />
            <MiniStat
              label="Normalized name"
              value={workspace.disabledAttempt.normalizedFileName}
            />
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-sm font-semibold text-white">Allowed file types</p>
            <p className="mt-2 text-sm leading-6 text-white/62">
              {workspace.allowedMimeTypes.join(", ")}
            </p>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-sm font-semibold text-white">Future writes</p>
            <p className="mt-2 text-sm leading-6 text-white/62">
              {workspace.disabledAttempt.wouldWriteTables.join(", ")}
            </p>
          </div>
        </article>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
          Automation-ready, still disabled
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Future events are clear before any upload exists.
        </h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <EventList title="Structured events" items={workspace.futureStructuredEvents} />
          <EventList title="Disabled outbox destinations" items={workspace.futureOutboxDestinations} />
        </div>
      </section>
    </section>
  );
}

function ReadinessCheck({ check }: { check: ProofUploadIntakeCheck }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-white">{check.label}</p>
        <span
          className={[
            "rounded-full border px-2.5 py-1 text-xs font-semibold",
            check.passed
              ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
              : "border-rose-300/30 bg-rose-300/15 text-rose-100",
          ].join(" ")}
        >
          {check.passed ? "ready" : "blocked"}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-white/62">{check.helpText}</p>
    </div>
  );
}

function EventList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-3 grid gap-2">
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
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 break-words text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
