import Link from "next/link";
import type {
  CoachDecisionCoverageStatus,
  CoachDecisionPacket,
  CoachDecisionPacketStatus,
  CoachDecisionReadbackStatus,
} from "@/services/coach-decision-verification-packet";

type CoachDecisionVerificationPanelProps = {
  packet: CoachDecisionPacket;
};

export function CoachDecisionVerificationPanel({
  packet,
}: CoachDecisionVerificationPanelProps) {
  if (!packet.canReadPacket) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
            Coach decision packet
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            {packet.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
            {packet.plainEnglishSummary}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill status={packet.status} />
            <Link
              href="/admin/assignment-write"
              className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white/78"
            >
              Check assignment packet
            </Link>
            <Link
              href="/coach"
              className="rounded-full bg-sky-200 px-4 py-2 text-sm font-semibold text-[#06211d]"
            >
              Open coach dashboard
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
          <MiniStat label="Checks" value={`${packet.counts.checks}`} />
          <MiniStat label="Ready" value={`${packet.counts.passedChecks}`} />
          <MiniStat label="Readback" value={`${packet.counts.observedReadbackItems}`} />
          <MiniStat label="Escalations" value={`${packet.counts.escalationPacketsExpected}`} />
          <MiniStat label="Sends" value={`${packet.counts.externalWritesExpected}`} />
        </div>
      </div>

      <article className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
          Default local coach decision
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          {packet.defaultInput.decision}
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          {packet.defaultInput.note}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <MiniStat label="Chapter" value={packet.chapterId} />
          <MiniStat label="Campaign" value={packet.campaignId} />
          <MiniStat label="Phase" value={packet.phaseId} />
        </div>
        <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100/78">
          Blocker summary: {packet.defaultInput.blockerSummary}. This packet
          must not send n8n escalation packets, reminder emails, SMS, HubSpot
          notes, Luma writes, warehouse exports, Power BI updates, or AI
          summaries.
        </p>
      </article>

      <section className="mt-5 rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
              Operator packet
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {packet.verificationPacket.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/64">
              {packet.verificationPacket.plainEnglishDecision}
            </p>
          </div>
          <span className={packetStatusClassName(packet.verificationPacket.status)}>
            {packet.verificationPacket.status.replaceAll("_", " ")}
          </span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
          <article className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold text-white">
              Required local env settings
            </p>
            <div className="mt-3 grid gap-2">
              {packet.verificationPacket.envSettings.map((setting) => (
                <div
                  key={setting.key}
                  className="rounded-2xl border border-white/10 bg-[#071d1a]/78 p-3"
                >
                  <p className="font-mono text-xs text-sky-100/80">
                    {setting.key}={setting.value}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/52">
                    {setting.reason}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold text-white">Coach proof</p>
            <p className="mt-3 rounded-2xl border border-white/10 bg-[#071d1a]/78 p-3 font-mono text-xs text-sky-100/80">
              email={packet.verificationPacket.fakeCoachCredential.email}
              <br />
              route={packet.verificationPacket.fakeCoachCredential.route}
            </p>
            <p className="mt-3 text-xs leading-5 text-white/56">
              Password label: {packet.verificationPacket.fakeCoachCredential.passwordLabel}.
              Use only fake local seed users for this packet.
            </p>
          </article>
        </div>

        <div className="mt-4 grid gap-3">
          {packet.verificationPacket.operatorSequence.map((step, index) => (
            <article
              key={`${step.label}-${step.route}`}
              className="rounded-3xl border border-white/10 bg-[#071d1a]/78 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
                    Packet step {index + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {step.label}
                  </h3>
                </div>
                <Link
                  href={step.route}
                  className="rounded-full border border-white/12 bg-black/20 px-3 py-2 text-xs font-semibold text-white/72"
                >
                  Open {step.route}
                </Link>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/62">
                {step.expectedProof}
              </p>
            </article>
          ))}
        </div>

        <article className="mt-4 rounded-3xl border border-orange-300/20 bg-orange-300/10 p-4">
          <p className="text-sm font-semibold text-white">Stop conditions</p>
          <ul className="mt-3 grid gap-2">
            {packet.verificationPacket.safetyStops.map((stop) => (
              <li key={stop} className="text-xs leading-5 text-white/62">
                {stop}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[2rem] border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
            Role and ownership rules
          </p>
          <div className="mt-4 grid gap-3">
            {packet.verificationPacket.roleCoverage.map((rule) => (
              <article
                key={rule.role}
                className="rounded-3xl border border-white/10 bg-[#071d1a]/78 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{rule.role}</h2>
                    <p className="mt-1 text-xs leading-5 text-white/52">
                      {rule.packetAccess}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
                    {rule.decisionAccess}
                  </span>
                </div>
                <dl className="mt-3 grid gap-3 text-sm leading-6 text-white/64 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                      Notes
                    </dt>
                    <dd>{rule.noteVisibility}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                      Ownership
                    </dt>
                    <dd>{rule.truthOwnership}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs leading-5 text-cyan-100/72">
                  Audit: {rule.auditExpectation}
                </p>
              </article>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
            Coach note visibility
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {packet.verificationPacket.supportNotesSummary.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/66">
            {packet.verificationPacket.supportNotesSummary.summary}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <MiniStat
              label="Visible"
              value={`${packet.verificationPacket.supportNotesSummary.visibleNotes}`}
            />
            <MiniStat
              label="Coach-private"
              value={`${packet.verificationPacket.supportNotesSummary.coachPrivate}`}
            />
            <MiniStat
              label="HQ"
              value={`${packet.verificationPacket.supportNotesSummary.hqSupport}`}
            />
            <MiniStat
              label="Chapter"
              value={`${packet.verificationPacket.supportNotesSummary.chapterFollowUp}`}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {packet.verificationPacket.supportNotesSummary.blockedControls.map((control) => (
              <span
                key={control}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/58"
              >
                Locked {control}
              </span>
            ))}
          </div>
        </article>
      </section>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {packet.checks.map((check) => (
          <article
            key={check.key}
            className="rounded-3xl border border-white/10 bg-[#071d1a]/78 p-4"
          >
            <p
              className={
                check.passed
                  ? "text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100"
                  : "text-xs font-semibold uppercase tracking-[0.18em] text-amber-100"
              }
            >
              {check.passed ? "Ready" : "Blocked"}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">{check.label}</h2>
            <p className="mt-2 text-sm leading-6 text-white/62">{check.detail}</p>
          </article>
        ))}
      </div>

      <section className="mt-5 rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-4">
        <h2 className="text-2xl font-semibold text-white">
          Post-coach-decision readback evidence
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          After the local coach decision test runs, this section should show
          observed readiness review, event, integration, disabled outbox, and
          audit proof. It is read-only and does not trigger the write.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {packet.readbackEvidence.map((item) => (
            <article
              key={item.key}
              className="rounded-3xl border border-white/10 bg-[#071d1a]/80 p-4"
            >
              <p className={readbackStatusClassName(item.status)}>
                {item.status.replaceAll("_", " ")}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                {item.label}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/62">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-[2rem] border border-violet-300/20 bg-violet-300/10 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-100/80">
              Coverage and rollback
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              What this path proves
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
              These checks explain what is covered in the coach/staff path right now,
              what stays locked, and how corrections must be handled.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {packet.verificationPacket.coverageChecklist.map((item) => (
            <article
              key={item.key}
              className="rounded-3xl border border-white/10 bg-[#071d1a]/78 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className={coverageStatusClassName(item.status)}>
                    {item.status.replaceAll("_", " ")}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {item.label}
                  </h3>
                </div>
                <Link
                  href={item.route}
                  className="rounded-full border border-white/12 bg-black/20 px-3 py-2 text-xs font-semibold text-white/72"
                >
                  Open {item.route}
                </Link>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/62">{item.detail}</p>
            </article>
          ))}
        </div>

        <article className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-semibold text-white">Correction rules</p>
          <ul className="mt-3 grid gap-2">
            {packet.verificationPacket.rollbackPlan.map((item) => (
              <li key={item} className="text-xs leading-5 text-white/62">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <article className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white">Evidence to collect</p>
        <ul className="mt-3 grid gap-2">
          {packet.proofToCollect.map((proof) => (
            <li key={proof} className="text-xs leading-5 text-white/62">
              {proof}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 break-words text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: CoachDecisionPacketStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${packetStatusClassName(status)}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function packetStatusClassName(status: CoachDecisionPacketStatus): string {
  switch (status) {
    case "ready_for_local_coach_decision":
    case "evidence_observed":
      return "border border-emerald-300/30 bg-emerald-300/12 text-emerald-100";
    case "needs_manual_audit_check":
      return "border border-amber-300/30 bg-amber-300/12 text-amber-100";
    case "blocked_until_local_supabase":
    case "blocked_until_assignment":
    case "blocked_until_phase":
    case "blocked_until_flags":
    case "blocked_until_auth":
      return "border border-orange-300/30 bg-orange-300/12 text-orange-100";
    case "hidden":
      return "border border-white/10 bg-white/10 text-white/56";
  }
}

function readbackStatusClassName(status: CoachDecisionReadbackStatus): string {
  switch (status) {
    case "observed":
    case "disabled_outbox_observed":
      return "text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100";
    case "manual_check_needed":
      return "text-xs font-semibold uppercase tracking-[0.18em] text-amber-100";
    case "missing":
    case "blocked":
      return "text-xs font-semibold uppercase tracking-[0.18em] text-white/42";
  }
}

function coverageStatusClassName(status: CoachDecisionCoverageStatus): string {
  switch (status) {
    case "covered":
      return "text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100";
    case "locked":
      return "text-xs font-semibold uppercase tracking-[0.18em] text-amber-100";
  }
}
