import type {
  ProofUploadIntakeCheck,
  ProofUploadStoragePacket,
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
      <section className="app-surface-info rounded-[2rem] p-5">
        <p className="app-eyebrow app-eyebrow-blue">
          Proof preparation
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">{workspace.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{workspace.summary}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Uploads" value={workspace.uploadsEnabled ? "open" : "later"} />
        <MiniStat
          label="Sharing"
          value={workspace.publicPublishingEnabled ? "open" : "later"}
        />
        <MiniStat
          label="Handoffs"
          value={workspace.externalExportsEnabled ? "open" : "later"}
        />
      </section>

      {workspace.storagePacket ? (
        <ProofUploadStoragePacketPanel packet={workspace.storagePacket} />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="app-surface rounded-[2rem] p-5">
          <p className="app-eyebrow app-eyebrow-slate">
            Example proof file
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            File is prepared, but not saved yet.
          </h2>
          <div className="mt-4 grid gap-3">
            {workspace.checks.map((check) => (
              <ReadinessCheck key={check.key} check={check} />
            ))}
          </div>
        </article>

        <article className="app-surface-info rounded-[2rem] p-5">
          <p className="app-eyebrow app-eyebrow-blue">
            Consent and context
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Good proof answers a real hesitation.
          </h2>
          <ul className="mt-4 grid gap-3">
            {workspace.consentChecklist.map((item) => (
              <li
                key={item}
                className="app-surface rounded-[1.05rem] p-3 text-sm leading-6 text-slate-600"
              >
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="app-surface-warm rounded-[2rem] p-5">
          <p className="app-eyebrow app-eyebrow-warm">
            Held actions
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Broader proof actions stay paused.
          </h2>
          <div className="mt-4 grid gap-3">
            {workspace.blockedControls.map((control) => (
              <div key={control.label} className="app-surface rounded-[1.05rem] p-3">
                <p className="font-semibold text-slate-950">{control.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {control.reason}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="app-surface rounded-[2rem] p-5">
          <p className="app-eyebrow app-eyebrow-slate">
            Future proof path
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            What gets added later?
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
          <div className="app-surface-soft mt-4 rounded-[1.05rem] p-3">
            <p className="text-sm font-semibold text-slate-950">Allowed file types</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {workspace.allowedMimeTypes.join(", ")}
            </p>
          </div>
          <div className="app-surface-soft mt-4 rounded-[1.05rem] p-3">
            <p className="text-sm font-semibold text-slate-950">Future app records</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {workspace.disabledAttempt.wouldWriteTables.join(", ")}
            </p>
          </div>
        </article>
      </section>

      <section className="app-surface rounded-[2rem] p-5">
        <p className="app-eyebrow app-eyebrow-slate">
          Future handoffs stay paused
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          The app trail is clear before uploads open.
        </h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <EventList title="Future app events" items={workspace.futureStructuredEvents} />
          <EventList title="Held handoffs" items={workspace.futureOutboxDestinations} />
        </div>
      </section>
    </section>
  );
}

function ProofUploadStoragePacketPanel({
  packet,
}: {
  packet: ProofUploadStoragePacket;
}) {
  return (
    <section className="app-surface rounded-[2rem] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-blue">
            Storage preview
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{packet.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {packet.readinessReason}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-80">
          <PacketToken label="Now" value={packet.currentResultCode} />
          <PacketToken label="Future" value={packet.futureResultCode} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="app-surface-soft rounded-[1.25rem] p-4">
          <p className="text-sm font-semibold text-slate-950">Storage path</p>
          <div className="mt-3 grid gap-3">
            <PacketRow label="Save path" value={packet.futureFunction} />
            <PacketRow label="Private storage" value={packet.privateBucket} />
            <PacketRow label="Public library" value={packet.publicBucket} />
            <PacketRow label="Path" value={packet.storagePathPreview} />
            <PacketRow label="File" value={packet.normalizedFileName} />
          </div>
        </div>

        <div className="app-surface-soft rounded-[1.25rem] p-4">
          <p className="text-sm font-semibold text-slate-950">Access and visibility</p>
          <div className="mt-3 grid gap-3">
            <PacketRow
              label="Raw readers"
              value={packet.rawUploadReaders.join(", ")}
            />
            <PacketRow
              label="Public readers"
              value={packet.publicAssetReaders.join(", ")}
            />
            <PacketRow
              label="Required metadata"
              value={packet.requiredMetadata.join(", ")}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <PacketList
          title="Before uploads open"
          items={packet.readinessChecks.map((check) =>
            `${check.passed ? "ready" : "blocked"} ${check.label}`,
          )}
        />
        <PacketList
          title="What updates later"
          items={packet.futureRecords.map((record) => `${record.label}: ${record.value}`)}
        />
        <PacketList title="Moderation queue" items={packet.moderationQueue} />
      </div>

      <div className="app-surface-warm mt-4 rounded-[1.25rem] p-4">
        <p className="text-sm font-semibold text-slate-950">Held actions</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {packet.blockedControls.map((control) => (
            <span
              key={control}
              className="rounded-full border border-[var(--mymedlife-primary-button)]/28 bg-[var(--mymedlife-badge-background)] px-3 py-1 text-xs font-semibold text-[var(--mymedlife-info)]"
            >
              Held {control}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReadinessCheck({ check }: { check: ProofUploadIntakeCheck }) {
  return (
    <div className="app-surface rounded-[1.05rem] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-slate-950">{check.label}</p>
        <span
          className={[
            "rounded-full border px-2.5 py-1 text-xs font-semibold",
            check.passed
              ? "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]"
              : "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]",
          ].join(" ")}
        >
          {check.passed ? "ready" : "blocked"}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{check.helpText}</p>
    </div>
  );
}

function PacketList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="app-surface rounded-[1.05rem] p-3">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-slate-600">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PacketRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function PacketToken({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-surface-soft rounded-[1.05rem] px-3 py-2">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[var(--mymedlife-primary-button)]">
        {value}
      </p>
    </div>
  );
}

function EventList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="app-surface rounded-[1.05rem] p-3">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-slate-600">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-surface rounded-[1.05rem] px-3 py-2">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-1 break-words text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
