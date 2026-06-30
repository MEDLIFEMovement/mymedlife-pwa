import Link from "next/link";
import { recordPilotScopePacketAction } from "@/app/admin/pilot-scope/actions";
import { ControlReviewSnapshotSection } from "@/components/control-review-snapshot-section";
import { ReviewPacketHistorySection } from "@/components/review-packet-history-section";
import type {
  MinimumPilotPath,
  PilotScopeCandidateStatus,
  PilotScopeDecisionStatus,
  PilotScopePlanner,
} from "@/services/pilot-scope-planner";

type PilotScopePlannerPanelProps = {
  planner: PilotScopePlanner;
  packetResult?: string;
  packetMessage?: string;
};

export function PilotScopePlannerPanel({
  planner,
  packetResult,
  packetMessage,
}: PilotScopePlannerPanelProps) {
  if (!planner.canReadPlanner) {
    return null;
  }

  return (
    <section className="app-surface-info rounded-[2rem] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
            First pilot scope
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{planner.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            {planner.plainEnglishSummary}
          </p>
          <p className="mt-3 max-w-3xl rounded-2xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">
            Packet source:{" "}
            <span className="font-semibold text-slate-950">
              {planner.packetSource.mode === "supabase"
                ? "Supabase review records"
                : "env/default fallback"}
            </span>
            {" · "}
            {planner.packetSource.recordCount} recorded row
            {planner.packetSource.recordCount === 1 ? "" : "s"}
            {" · "}
            {planner.packetSource.reason}
          </p>
          <p className="mt-3 max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
            Recommended scope: {planner.recommendedScope}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin/staff-dry-run"
              className="rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-info)]"
            >
              Open staff dry run
            </Link>
            <Link
              href="/rush-month/loop"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Open Rush Month loop
            </Link>
            <Link
              href="/admin/first-write"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Open first-write drill
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <MiniStat label="Scopes" value={`${planner.counts.candidates}`} />
          <MiniStat label="Recommended" value={`${planner.counts.recommendedCandidates}`} />
          <MiniStat label="Decisions" value={`${planner.counts.decisionsNeeded}`} />
          <MiniStat label="Owners" value={`${planner.counts.pendingNamedOwners}`} />
        </div>
      </div>

      {packetMessage ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            packetResult === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {packetMessage}
        </div>
      ) : null}

      <section className="mt-5 rounded-[2rem] border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-2xl font-semibold text-slate-950">Phase 2 closeout defaults</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          These are the recommended defaults for closing Phase 2 at controlled live
          pilot readiness. They are defaults, not final approvals.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {planner.closeoutDefaults.map((item) => (
            <article
              key={item.key}
              className="rounded-3xl border border-slate-200 bg-white p-4"
            >
              <DecisionPill
                status={
                  item.status === "recorded_final" ? "staff_ready" : "needs_decision"
                }
              />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-primary-button)]">
                {item.label}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">
                {item.recommendedDefault}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.whyThisIsDefault}
              </p>
              <ReviewPacketValueForm
                recordKey={item.recordKey}
                value={item.recommendedDefault}
                label={item.label}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-[2rem] border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-2xl font-semibold text-slate-950">Named owner slots</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Phase 2 is not finished until these human owners are named. The app can
          recommend the slots, but the team still needs to confirm the actual people.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {planner.ownerSlots.map((slot) => (
            <article
              key={slot.key}
              className="rounded-3xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                  <DecisionPill
                    status={
                      slot.status === "recorded_owner"
                        ? "staff_ready"
                        : "needs_decision"
                    }
                  />
                  <h3 className="mt-3 text-lg font-semibold text-slate-950">
                    {slot.label}
                  </h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Confirm with: {slot.confirmationNeededFrom}
                  </p>
                </div>
                <p className="font-mono text-xs text-slate-500">{slot.key}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Recommended default: {slot.recommendedDefault}
              </p>
              <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                Why it matters: {slot.whyItMatters}
              </p>
              <ReviewPacketValueForm
                recordKey={slot.recordKey}
                value={slot.recommendedDefault}
                label={slot.label}
              />
            </article>
          ))}
        </div>
      </section>

      <ControlReviewSnapshotSection
        title="Pilot readiness"
        description="Use this snapshot to separate what is already recorded in the pilot packet from the defaults, owners, and decisions that still block the smallest safe live pilot."
        recordedNow={planner.reviewSnapshot.recordedNow}
        stillBlocked={planner.reviewSnapshot.stillMissing}
      />

      <section className="mt-5">
        <ReviewPacketHistorySection
          title="Recent pilot packet updates"
          description="Use this to verify the latest durable pilot-scope answers, who recorded them, and why they were added to the packet."
          emptyMessage="No durable pilot-scope packet rows have been recorded yet."
          records={planner.packetRecords}
        />
      </section>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {planner.candidates.map((candidate) => (
          <article
            key={candidate.key}
            className="rounded-3xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <StatusPill status={candidate.status} />
                <h2 className="mt-3 text-xl font-semibold text-slate-950">
                  {candidate.recommendedOrder}. {candidate.label}
                </h2>
              </div>
              <p className="font-mono text-xs text-slate-500">{candidate.key}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {candidate.plainEnglish}
            </p>
            <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              Expected people: {candidate.expectedPeople}
            </p>
            <TagList label="Roles" values={candidate.includedRoles} />
            <TagList label="Routes" values={candidate.routeEvidence} mono />
            <Checklist label="Required approvals" values={candidate.requiredApprovals} />
            <Checklist
              label="Must stay manual or disabled"
              values={candidate.mustStayManualOrDisabled}
            />
          </article>
        ))}
      </div>

      <section className="mt-5 rounded-[2rem] border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-2xl font-semibold text-slate-950">
          Minimum pilot path
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This is the smallest Rush Month path that should be reviewed before
          any real student invitation. It keeps student screens simple and pushes
          risky operations into manual or blocked posture.
        </p>
        <div className="mt-4 grid gap-3">
          {planner.minimumPilotPath.map((step) => (
            <PilotPathCard key={step.key} step={step} />
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {planner.decisions.map((decision) => (
          <article
            key={decision.key}
            className="rounded-3xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <DecisionPill status={decision.status} />
                <h2 className="mt-3 text-lg font-semibold text-slate-950">
                  {decision.label}
                </h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Owner: {decision.owner}
                </p>
              </div>
              <p className="font-mono text-xs text-slate-500">{decision.key}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Recommendation: {decision.recommendation}
            </p>
            <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              Why it matters: {decision.whyItMatters}
            </p>
          </article>
        ))}
      </div>

      <section className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-4">
        <h2 className="text-2xl font-semibold text-slate-950">Safety rules</h2>
        <ul className="mt-4 grid gap-2">
          {planner.safetyRules.map((rule) => (
            <li key={rule} className="text-sm leading-6 text-slate-600">
              {rule}
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <MiniStat label="Browser writes" value={`${planner.counts.browserWritesExpected}`} />
          <MiniStat label="External sends" value={`${planner.counts.externalWritesExpected}`} />
        </div>
      </section>

      <section className="mt-5 rounded-[2rem] border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-2xl font-semibold text-slate-950">How to approve this</h2>
        <ul className="mt-4 grid gap-2">
          {planner.approvalReplyGuide.map((line) => (
            <li key={line} className="text-sm leading-6 text-slate-600">
              {line}
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--mymedlife-primary-button)]">
            Copy-paste reply block
          </p>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {planner.approvalReplyBlock.join("\n")}
          </pre>
        </div>
      </section>
    </section>
  );
}

function ReviewPacketValueForm({
  recordKey,
  value,
  label,
}: {
  recordKey: string;
  value: string;
  label: string;
}) {
  const multiline = value.length > 60;

  return (
    <form
      action={recordPilotScopePacketAction}
      className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3"
    >
      <input type="hidden" name="recordKey" value={recordKey} />
      <input type="hidden" name="returnTo" value="/admin/pilot-scope" />
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Record/update this answer
      </p>
      <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </label>
      {multiline ? (
        <textarea
          name="value"
          defaultValue={value}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        />
      ) : (
        <input
          type="text"
          name="value"
          defaultValue={value}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        />
      )}
      <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        Reason
      </label>
      <textarea
        name="reason"
        rows={2}
        placeholder={`Why is this the right recorded answer for ${label.toLowerCase()}?`}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
      />
      <button
        type="submit"
        className="mt-3 rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-info)]"
      >
        Save packet value
      </button>
    </form>
  );
}

function PilotPathCard({ step }: { step: MinimumPilotPath }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {step.pilotMode.replaceAll("_", " ")}
          </span>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">{step.label}</h3>
        </div>
        <Link
          href={step.route === "/rush-month/actions/[assignmentId]" ? "/rush-month/actions/member-push" : step.route}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
        >
          Open {step.route}
        </Link>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{step.whatMustWork}</p>
      <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-600">
        MYMEDLIFE_LOCAL_ACTOR_EMAIL={step.localActorEmail}
      </p>
      <TagList label="Structured events" values={step.structuredEvents} mono />
      <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
        Safety: {step.safetyBoundary}
      </p>
    </article>
  );
}

function TagList({
  label,
  values,
  mono = false,
}: {
  label: string;
  values: string[];
  mono?: boolean;
}) {
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={`${label}-${value}`}
            className={`rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 ${mono ? "font-mono" : "font-semibold"}`}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function Checklist({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <ul className="mt-2 grid gap-1">
        {values.map((value) => (
          <li key={`${label}-${value}`} className="text-xs leading-5 text-slate-600">
            {value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--mymedlife-primary-button)]">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: PilotScopeCandidateStatus }) {
  const className =
    status === "ready_for_staff_only"
      ? "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]"
      : status === "recommended_after_gates"
        ? "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]"
        : status === "later"
          ? "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]"
          : "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function DecisionPill({ status }: { status: PilotScopeDecisionStatus }) {
  const className =
    status === "staff_ready"
      ? "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]"
      : status === "needs_decision"
        ? "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]"
        : "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
