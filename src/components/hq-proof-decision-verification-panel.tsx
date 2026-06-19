import Link from "next/link";
import type {
  HqProofDecisionPacket,
  HqProofDecisionPacketStatus,
  HqProofDecisionReadbackStatus,
} from "@/services/hq-proof-decision-verification-packet";

type HqProofDecisionVerificationPanelProps = {
  packet: HqProofDecisionPacket;
};

export function HqProofDecisionVerificationPanel({
  packet,
}: HqProofDecisionVerificationPanelProps) {
  if (!packet.canReadPacket) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-teal-300/20 bg-teal-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-100/80">
            HQ proof decision packet
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
              href="/admin/proof-write"
              className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white/78"
            >
              Check proof metadata
            </Link>
            <Link
              href="/rush-month/review"
              className="rounded-full bg-teal-200 px-4 py-2 text-sm font-semibold text-[#06211d]"
            >
              Open HQ review
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
          <MiniStat label="Checks" value={`${packet.counts.checks}`} />
          <MiniStat label="Ready" value={`${packet.counts.passedChecks}`} />
          <MiniStat label="Readback" value={`${packet.counts.observedReadbackItems}`} />
          <MiniStat label="Shares" value={`${packet.counts.publicSharesExpected}`} />
          <MiniStat label="Sends" value={`${packet.counts.externalWritesExpected}`} />
        </div>
      </div>

      {packet.candidateEvidence ? (
        <article className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
            Candidate proof/testimonial
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {packet.candidateEvidence.summary}
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-5">
            <MiniStat label="Status" value={packet.candidateEvidence.status} />
            <MiniStat label="Proof" value={packet.candidateEvidence.proofTypeLabel} />
            <MiniStat
              label="Ready"
              value={packet.candidateEvidence.readyForHqDecision ? "yes" : "no"}
            />
            <MiniStat
              label="UUID"
              value={packet.candidateEvidence.usesSupabaseUuid ? "yes" : "no"}
            />
            <MiniStat
              label="Upload"
              value={packet.candidateEvidence.privateUploadStatusLabel}
            />
            <MiniStat label="Action" value={packet.candidateEvidence.route} />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#071d1a]/78 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                Upload guidance
              </p>
              <p className="mt-2 text-xs leading-5 text-white/58">
                {packet.candidateEvidence.privateUploadGuidance}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#071d1a]/78 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                Privacy boundary
              </p>
              <p className="mt-2 text-xs leading-5 text-white/58">
                {packet.candidateEvidence.privacyBoundary}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#071d1a]/78 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                Deletion / takedown
              </p>
              <p className="mt-2 text-xs leading-5 text-white/58">
                {packet.candidateEvidence.deletionBoundary}
              </p>
            </div>
          </div>
        </article>
      ) : (
        <article className="mt-5 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4">
          <h2 className="text-xl font-semibold text-white">
            No submitted proof found
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/64">
            Run the proof metadata packet against local Supabase before testing
            HQ proof-sharing decisions.
          </p>
        </article>
      )}

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
                  <p className="font-mono text-xs text-cyan-100/80">
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
            <p className="text-sm font-semibold text-white">Default HQ decision</p>
            <p className="mt-3 rounded-2xl border border-white/10 bg-[#071d1a]/78 p-3 font-mono text-xs text-cyan-100/80">
              decision={packet.defaultInput.decision}
            </p>
            <p className="mt-3 text-xs leading-5 text-white/56">
              {packet.defaultInput.note}
            </p>
            <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100/78">
              This packet records HQ sharing posture only. It must not publish
              proof, export proof, generate AI summaries, or send automation.
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

      <section className="mt-5 rounded-[2rem] border border-lime-300/20 bg-lime-300/10 p-4">
        <h2 className="text-2xl font-semibold text-white">
          Post-HQ decision readback evidence
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          After the local HQ decision test runs, this section should show
          observed proof status, event, integration, disabled outbox, and audit
          proof. It is read-only and does not trigger the write.
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

function StatusPill({ status }: { status: HqProofDecisionPacketStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${packetStatusClassName(status)}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function packetStatusClassName(status: HqProofDecisionPacketStatus): string {
  switch (status) {
    case "ready_for_local_hq_decision":
    case "evidence_observed":
      return "border border-emerald-300/30 bg-emerald-300/12 text-emerald-100";
    case "needs_manual_audit_check":
      return "border border-amber-300/30 bg-amber-300/12 text-amber-100";
    case "blocked_until_local_supabase":
    case "blocked_until_proof_metadata":
    case "blocked_until_flags":
    case "blocked_until_auth":
      return "border border-orange-300/30 bg-orange-300/12 text-orange-100";
    case "hidden":
      return "border border-white/10 bg-white/10 text-white/56";
  }
}

function readbackStatusClassName(status: HqProofDecisionReadbackStatus): string {
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
