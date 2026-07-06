import type { ProofUploadIntakeWorkspace } from "@/services/proof-upload-intake";

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
      <section className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
              Upload readiness
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{workspace.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/68">
              {workspace.summary}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Stat label="Uploads" value="disabled" />
            <Stat label="Publishing" value="disabled" />
            <Stat label="Exports" value="disabled" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
            File limits
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Prepare the file safely before any upload lane opens.
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Stat label="Max size" value={`${workspace.maxFileSizeMb} MB`} />
            <Stat label="Formats" value={`${workspace.allowedMimeTypes.length}`} />
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold text-white">Allowed file types</p>
            <p className="mt-2 text-sm leading-6 text-white/64">
              {workspace.allowedMimeTypes.join(", ")}
            </p>
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
            Consent checklist
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            MEDLIFE review consent must be explicit.
          </h3>
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

      <section className="grid gap-4 lg:grid-cols-3">
        {workspace.blockedControls.map((control) => (
          <article
            key={control.label}
            className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4"
          >
            <p className="text-sm font-semibold text-amber-100">{control.label}</p>
            <p className="mt-2 text-sm leading-6 text-amber-50/76">{control.reason}</p>
          </article>
        ))}
      </section>

      {workspace.storagePacket ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
            Storage packet
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            {workspace.storagePacket.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-white/64">
            {workspace.storagePacket.readinessReason}
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <InfoList
              title="Required metadata"
              items={workspace.storagePacket.requiredMetadata}
            />
            <InfoList
              title="Blocked controls"
              items={workspace.storagePacket.blockedControls}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <InfoList
              title="Future structured records"
              items={workspace.futureStructuredEvents}
            />
            <InfoList
              title="Disabled outbox destinations"
              items={workspace.futureOutboxDestinations}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold text-white">Storage path preview</p>
            <p className="mt-2 break-all font-mono text-xs leading-6 text-white/58">
              {workspace.storagePacket.storagePathPreview}
            </p>
          </div>
        </section>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function InfoList({ items, title }: { items: readonly string[]; title: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/64"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
