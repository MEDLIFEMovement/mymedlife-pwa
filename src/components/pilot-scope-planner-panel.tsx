import Link from "next/link";
import type {
  MinimumPilotPath,
  PilotScopeCandidateStatus,
  PilotScopeDecisionStatus,
  PilotScopePlanner,
} from "@/services/pilot-scope-planner";

type PilotScopePlannerPanelProps = {
  planner: PilotScopePlanner;
};

export function PilotScopePlannerPanel({ planner }: PilotScopePlannerPanelProps) {
  if (!planner.canReadPlanner) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
            First pilot scope
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{planner.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
            {planner.plainEnglishSummary}
          </p>
          <p className="mt-3 max-w-3xl rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-sky-50/78">
            Recommended scope: {planner.recommendedScope}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin/staff-dry-run"
              className="rounded-full bg-sky-200 px-4 py-2 text-sm font-semibold text-[#061b2b]"
            >
              Open staff dry run
            </Link>
            <Link
              href="/rush-month/loop"
              className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white/78"
            >
              Open Rush Month loop
            </Link>
            <Link
              href="/admin/first-write"
              className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white/78"
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

      <section className="mt-5 rounded-[2rem] border border-white/10 bg-black/20 p-4">
        <h2 className="text-2xl font-semibold text-white">Phase 2 closeout defaults</h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          These are the recommended defaults for closing Phase 2 at controlled live
          pilot readiness. They are defaults, not final approvals.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {planner.closeoutDefaults.map((item) => (
            <article
              key={item.key}
              className="rounded-3xl border border-white/10 bg-[#071d1a]/78 p-4"
            >
              <DecisionPill
                status={
                  item.status === "recorded_final" ? "staff_ready" : "needs_decision"
                }
              />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/72">
                {item.label}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                {item.recommendedDefault}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/62">
                {item.whyThisIsDefault}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-[2rem] border border-white/10 bg-black/20 p-4">
        <h2 className="text-2xl font-semibold text-white">Named owner slots</h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          Phase 2 is not finished until these human owners are named. The app can
          recommend the slots, but the team still needs to confirm the actual people.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {planner.ownerSlots.map((slot) => (
            <article
              key={slot.key}
              className="rounded-3xl border border-white/10 bg-white/[0.05] p-4"
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
                  <h3 className="mt-3 text-lg font-semibold text-white">
                    {slot.label}
                  </h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/60">
                    Confirm with: {slot.confirmationNeededFrom}
                  </p>
                </div>
                <p className="font-mono text-xs text-white/42">{slot.key}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/66">
                Recommended default: {slot.recommendedDefault}
              </p>
              <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/54">
                Why it matters: {slot.whyItMatters}
              </p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {planner.candidates.map((candidate) => (
          <article
            key={candidate.key}
            className="rounded-3xl border border-white/10 bg-[#071d1a]/78 p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <StatusPill status={candidate.status} />
                <h2 className="mt-3 text-xl font-semibold text-white">
                  {candidate.recommendedOrder}. {candidate.label}
                </h2>
              </div>
              <p className="font-mono text-xs text-white/42">{candidate.key}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/66">
              {candidate.plainEnglish}
            </p>
            <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/58">
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

      <section className="mt-5 rounded-[2rem] border border-white/10 bg-black/20 p-4">
        <h2 className="text-2xl font-semibold text-white">
          Minimum pilot path
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
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
            className="rounded-3xl border border-white/10 bg-white/[0.05] p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <DecisionPill status={decision.status} />
                <h2 className="mt-3 text-lg font-semibold text-white">
                  {decision.label}
                </h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/60">
                  Owner: {decision.owner}
                </p>
              </div>
              <p className="font-mono text-xs text-white/42">{decision.key}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/66">
              Recommendation: {decision.recommendation}
            </p>
            <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/54">
              Why it matters: {decision.whyItMatters}
            </p>
          </article>
        ))}
      </div>

      <section className="mt-5 rounded-[2rem] border border-rose-300/20 bg-rose-300/10 p-4">
        <h2 className="text-2xl font-semibold text-white">Safety rules</h2>
        <ul className="mt-4 grid gap-2">
          {planner.safetyRules.map((rule) => (
            <li key={rule} className="text-sm leading-6 text-white/66">
              {rule}
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <MiniStat label="Browser writes" value={`${planner.counts.browserWritesExpected}`} />
          <MiniStat label="External sends" value={`${planner.counts.externalWritesExpected}`} />
        </div>
      </section>

      <section className="mt-5 rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-4">
        <h2 className="text-2xl font-semibold text-white">How to approve this</h2>
        <ul className="mt-4 grid gap-2">
          {planner.approvalReplyGuide.map((line) => (
            <li key={line} className="text-sm leading-6 text-white/66">
              {line}
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            Copy-paste reply block
          </p>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-sky-50/82">
            {planner.approvalReplyBlock.join("\n")}
          </pre>
        </div>
      </section>
    </section>
  );
}

function PilotPathCard({ step }: { step: MinimumPilotPath }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#071d1a]/80 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/66">
            {step.pilotMode.replaceAll("_", " ")}
          </span>
          <h3 className="mt-3 text-lg font-semibold text-white">{step.label}</h3>
        </div>
        <Link
          href={step.route === "/rush-month/actions/[assignmentId]" ? "/rush-month/actions/member-push" : step.route}
          className="rounded-full border border-white/12 bg-black/20 px-3 py-2 text-xs font-semibold text-white/72"
        >
          Open {step.route}
        </Link>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/64">{step.whatMustWork}</p>
      <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 font-mono text-xs text-sky-100/76">
        MYMEDLIFE_LOCAL_ACTOR_EMAIL={step.localActorEmail}
      </p>
      <TagList label="Structured events" values={step.structuredEvents} mono />
      <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/54">
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
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={`${label}-${value}`}
            className={`rounded-full border border-sky-200/15 bg-sky-200/10 px-3 py-1 text-xs text-sky-100/80 ${mono ? "font-mono" : "font-semibold"}`}
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
    <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <ul className="mt-2 grid gap-1">
        {values.map((value) => (
          <li key={`${label}-${value}`} className="text-xs leading-5 text-white/58">
            {value}
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
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: PilotScopeCandidateStatus }) {
  const className =
    status === "ready_for_staff_only"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : status === "recommended_after_gates"
        ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
        : status === "later"
          ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
          : "border-rose-300/30 bg-rose-300/15 text-rose-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function DecisionPill({ status }: { status: PilotScopeDecisionStatus }) {
  const className =
    status === "staff_ready"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : status === "needs_decision"
        ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
        : "border-amber-300/30 bg-amber-300/15 text-amber-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
