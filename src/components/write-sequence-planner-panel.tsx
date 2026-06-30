import type {
  WriteSequenceOperation,
  WriteSequenceOperationStatus,
  WriteSequencePacketStatus,
  WriteSequencePlanner,
} from "@/services/write-sequence-planner";
import { PanelButton, SurfacePanel, StatusPill } from "@/components/visual-primitives";

type WriteSequencePlannerPanelProps = {
  planner: WriteSequencePlanner;
};

export function WriteSequencePlannerPanel({
  planner,
}: WriteSequencePlannerPanelProps) {
  if (!planner.canReadPlanner) {
    return null;
  }

  return (
    <SurfacePanel
      as="section"
      className="rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
            Write sequence planner
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            {planner.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
            {planner.summary}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
          <MiniStat label="Writes" value={`${planner.counts.operations}`} />
          <MiniStat label="Packets" value={`${planner.counts.packetReady}`} />
          <MiniStat label="Sends" value={`${planner.counts.externalWritesExpected}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <article className="rounded-3xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/70">
            Student journey
          </p>
          <p className="mt-2 text-sm leading-6 text-white/64">
            {planner.studentJourneySummary}
          </p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/70">
            Technical promotion order
          </p>
          <p className="mt-2 text-sm leading-6 text-white/64">
            {planner.promotionSummary}
          </p>
        </article>
      </div>

      <SurfacePanel
        as="section"
        className="mt-5 rounded-3xl border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--background)] p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Next safest move</p>
            <p className="mt-1 text-sm leading-6 text-white/58">
              First-write runtime status: {planner.firstWriteRuntimeStatus.replaceAll("_", " ")}.
            </p>
          </div>
          {planner.nextRecommendedOperation ? (
            <StatusPill tone="blue">{planner.nextRecommendedOperation.replaceAll("_", " ")}</StatusPill>
          ) : null}
        </div>
      </SurfacePanel>

      <div className="mt-5 grid gap-4">
        {planner.operations.map((operation) => (
          <OperationCard key={operation.key} operation={operation} />
        ))}
      </div>
    </SurfacePanel>
  );
}

function OperationCard({ operation }: { operation: WriteSequenceOperation }) {
  return (
    <SurfacePanel
      as="article"
      className="rounded-[1.75rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--background)] p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/70">
            Promote {operation.promotionOrder} / student step{" "}
            {operation.studentJourneyOrder}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {operation.label}
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/64">
            {operation.plainEnglish}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 lg:items-end">
          <StatusPill tone={operationStatusTone(operation.status)}>
            {operation.status.replaceAll("_", " ")}
          </StatusPill>
          <PanelButton
            href={operation.route}
            className="bg-[var(--mymedlife-focus-blue)] text-[var(--foreground)]"
          >
            Open route
          </PanelButton>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-3">
          <p className="text-sm font-semibold text-white">Local actor</p>
          <p className="mt-2 text-sm text-white/64">{operation.actorLabel}</p>
          <p className="mt-2 rounded-xl bg-[var(--mymedlife-border)]/40 p-3 font-mono text-xs text-[var(--mymedlife-badge-background)]/78">
            MYMEDLIFE_LOCAL_ACTOR_EMAIL={operation.localActorEmail}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--background)] p-3">
          <p className="text-sm font-semibold text-white">Role responsibility</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--mymedlife-badge-background)]/70">
            {operation.roleResponsibility.responsibility}
          </p>
          <p className="mt-2 text-sm leading-6 text-white/62">
            {operation.roleResponsibility.reviewPrompt}
          </p>
          <p className="mt-3 rounded-xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-3 text-xs leading-5 text-white/52">
            {operation.roleResponsibility.safetyBoundary}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-3">
          <p className="text-sm font-semibold text-white">Responsible role</p>
          <p className="mt-2 text-sm leading-6 text-white/64">
            {operation.roleResponsibility.roleLabel}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                {operation.packetStatus.label}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/58">
                {operation.packetStatus.plainEnglish}
              </p>
            </div>
            <StatusPill tone={packetStatusTone(operation.packetStatus.status)}>
              {operation.packetStatus.status.replaceAll("_", " ")}
            </StatusPill>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <MiniStat
              label="Readback"
              value={`${operation.packetStatus.observedReadbackItems}`}
            />
            <MiniStat
              label="Browser writes"
              value={`${operation.packetStatus.browserWritesExpected}`}
            />
            <MiniStat
              label="Staging"
              value={operation.packetStatus.canPromoteToStagingReview ? "Review" : "Blocked"}
            />
          </div>
          <PanelButton
            href={operation.packetStatus.route}
            variant="secondary"
            className="border-white/12 bg-[var(--mymedlife-border)]/40 text-white/72"
          >
            Open packet
          </PanelButton>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-3">
        <p className="text-sm font-semibold text-white">Expected tables</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {operation.expectedTables.map((table) => (
            <span
              key={`${operation.key}-${table}`}
              className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 font-mono text-[0.68rem] text-white/68"
            >
              {table}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <ChecklistCard
          title="Structured events"
          items={operation.structuredEvents}
        />
        <ChecklistCard title="Audit proof" items={operation.auditEvidence} />
        <article className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-3">
          <p className="text-sm font-semibold text-white">Outbox posture</p>
          <p className="mt-2 text-xs leading-5 text-white/58">
            {operation.outboxPosture}
          </p>
        </article>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-3">
          <p className="text-sm font-semibold text-white">Safety boundary</p>
          <p className="mt-2 text-xs leading-5 text-white/60">
            {operation.safetyBoundary}
          </p>
        </article>
        <article className="rounded-2xl border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-badge-background)] p-3">
          <p className="text-sm font-semibold text-white">Next gate</p>
          <p className="mt-2 text-xs leading-5 text-white/60">
            {operation.nextGate}
          </p>
        </article>
      </div>
    </SurfacePanel>
  );
}

function ChecklistCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-3">
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-2 grid gap-2">
        {items.map((item) => (
          <li key={item} className="text-xs leading-5 text-white/58">
            {item}
          </li>
        ))}
      </ul>
    </article>
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

function packetStatusTone(status: WriteSequencePacketStatus["status"]): "blue" | "amber" | "white" {
  switch (status) {
    case "packet_ready":
      return "blue";
    case "server_action_ready":
      return "blue";
    case "needs_operator_packet":
      return "amber";
    case "blocked_until_first_write":
      return "white";
    case "external_disabled":
      return "white";
    default:
      return "white";
  }
}

function operationStatusTone(status: WriteSequenceOperationStatus): "blue" | "amber" | "yellow" | "white" {
  switch (status) {
    case "packet_ready":
      return "blue";
    case "server_action_ready":
      return "blue";
    case "needs_operator_packet":
      return "yellow";
    case "blocked_until_first_write":
    case "external_disabled":
    default:
      return "white";
  }
}
