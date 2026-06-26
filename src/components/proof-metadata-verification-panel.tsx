import Link from "next/link";
import type {
  ProofMetadataPacket,
  ProofMetadataPacketStatus,
  ProofMetadataReadbackStatus,
} from "@/services/proof-metadata-verification-packet";

type ProofMetadataVerificationPanelProps = {
  packet: ProofMetadataPacket;
};

export function ProofMetadataVerificationPanel({
  packet,
}: ProofMetadataVerificationPanelProps) {
  if (!packet.canReadPacket) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-blue-300/20 bg-blue-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/80">
            Proof metadata packet
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
              href="/admin/first-write"
              className="rounded-full border border-white/12 bg-[#bfdbfe]/40 px-4 py-2 text-sm font-semibold text-white/78"
            >
              Check first write
            </Link>
            {packet.candidateAssignment ? (
              <Link
                href={packet.candidateAssignment.route}
                className="rounded-full bg-blue-200 px-4 py-2 text-sm font-semibold text-[#08224c]"
              >
                Open candidate action
              </Link>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
          <MiniStat label="Checks" value={`${packet.counts.checks}`} />
          <MiniStat label="Ready" value={`${packet.counts.passedChecks}`} />
          <MiniStat label="Readback" value={`${packet.counts.observedReadbackItems}`} />
          <MiniStat label="Uploads" value={`${packet.counts.uploadsExpected}`} />
          <MiniStat label="Sends" value={`${packet.counts.externalWritesExpected}`} />
        </div>
      </div>

      {packet.candidateAssignment ? (
        <article className="mt-5 rounded-3xl border border-white/10 bg-[#bfdbfe]/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
            Candidate proof action
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {packet.candidateAssignment.title}
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <MiniStat label="Status" value={packet.candidateAssignment.status} />
            <MiniStat
              label="Ready"
              value={packet.candidateAssignment.readyForProof ? "yes" : "no"}
            />
            <MiniStat
              label="UUID"
              value={packet.candidateAssignment.usesSupabaseUuid ? "yes" : "no"}
            />
            <MiniStat label="Route" value={packet.candidateAssignment.route} />
          </div>
        </article>
      ) : (
        <article className="mt-5 rounded-3xl border border-blue-300/20 bg-blue-300/10 p-4">
          <h2 className="text-xl font-semibold text-white">
            No proof-ready assignment found
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/64">
            Run the first action-start drill against local Supabase before testing
            proof metadata.
          </p>
        </article>
      )}

      <section className="mt-5 rounded-[2rem] border border-blue-300/20 bg-blue-300/10 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/80">
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
          <article className="rounded-3xl border border-white/10 bg-[#bfdbfe]/40 p-4">
            <p className="text-sm font-semibold text-white">
              Required local env settings
            </p>
            <div className="mt-3 grid gap-2">
              {packet.verificationPacket.envSettings.map((setting) => (
                <div
                  key={setting.key}
                  className="rounded-2xl border border-white/10 bg-[#0b66cc]/78 p-3"
                >
                  <p className="font-mono text-xs text-blue-100/80">
                    {setting.key}={setting.value}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/52">
                    {setting.reason}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-[#bfdbfe]/40 p-4">
            <p className="text-sm font-semibold text-white">Metadata-only input</p>
            <p className="mt-3 rounded-2xl border border-white/10 bg-[#0b66cc]/78 p-3 font-mono text-xs text-blue-100/80">
              evidenceType={packet.defaultInput.evidenceType}
            </p>
            <p className="mt-3 text-xs leading-5 text-white/56">
              {packet.defaultInput.summary}
            </p>
            <p className="mt-3 rounded-2xl border border-blue-300/20 bg-blue-300/10 p-3 text-xs leading-5 text-blue-100/78">
              This packet must not upload files, create storage objects, publish
              proof, or send automation.
            </p>
          </article>
        </div>

        <div className="mt-4 grid gap-3">
          {packet.verificationPacket.operatorSequence.map((step, index) => (
            <article
              key={`${step.label}-${step.route}`}
              className="rounded-3xl border border-white/10 bg-[#0b66cc]/78 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/70">
                    Packet step {index + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {step.label}
                  </h3>
                </div>
                <Link
                  href={step.route}
                  className="rounded-full border border-white/12 bg-[#bfdbfe]/40 px-3 py-2 text-xs font-semibold text-white/72"
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

        <article className="mt-4 rounded-3xl border border-blue-300/20 bg-blue-300/10 p-4">
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
            className="rounded-3xl border border-white/10 bg-[#0b66cc]/78 p-4"
          >
            <p
              className={
                check.passed
                  ? "text-xs font-semibold uppercase tracking-[0.18em] text-blue-100"
                  : "text-xs font-semibold uppercase tracking-[0.18em] text-blue-100"
              }
            >
              {check.passed ? "Ready" : "Blocked"}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">{check.label}</h2>
            <p className="mt-2 text-sm leading-6 text-white/62">{check.detail}</p>
          </article>
        ))}
      </div>

      <section className="mt-5 rounded-[2rem] border border-blue-300/20 bg-blue-300/10 p-4">
        <h2 className="text-2xl font-semibold text-white">
          Post-proof readback evidence
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          After the local proof metadata test runs, this section should show
          observed assignment, evidence, event, integration, disabled outbox, and
          audit proof. It is read-only and does not trigger the write.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {packet.readbackEvidence.map((item) => (
            <article
              key={item.key}
              className="rounded-3xl border border-white/10 bg-[#0b66cc]/80 p-4"
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

      <section className="mt-5 rounded-[2rem] border border-blue-300/20 bg-blue-300/10 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/80">
              Phase 2 closeout
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {packet.hostedCloseout.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/64">
              {packet.hostedCloseout.hostedDecision}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 text-sm text-white/72 sm:grid-cols-2">
            <MiniStat label="Target" value={packet.hostedCloseout.stagingTarget} />
            <MiniStat
              label="Proof loop"
              value={packet.hostedCloseout.recommendedProofLoop}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-[#bfdbfe]/40 p-4">
            <p className="text-sm font-semibold text-white">Required hosted readback</p>
            <ul className="mt-3 grid gap-2">
              {packet.hostedCloseout.requiredReadback.map((item) => (
                <li key={item} className="text-xs leading-5 text-white/62">
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-white/10 bg-[#bfdbfe]/40 p-4">
            <p className="text-sm font-semibold text-white">Review surfaces</p>
            <div className="mt-3 grid gap-2">
              {packet.hostedCloseout.reviewSurfaces.map((route) => (
                <Link
                  key={route}
                  href={route}
                  className="rounded-2xl border border-white/10 bg-[#0b66cc]/78 px-3 py-2 font-mono text-xs text-blue-100/80"
                >
                  {route}
                </Link>
              ))}
            </div>
          </article>
        </div>

        {packet.hostedCloseout.recordedOwnerAnswers.length > 0 ? (
          <article className="mt-4 rounded-3xl border border-blue-300/20 bg-blue-300/10 p-4">
            <p className="text-sm font-semibold text-white">Recorded owner answers</p>
            <ul className="mt-3 grid gap-2">
              {packet.hostedCloseout.recordedOwnerAnswers.map((owner) => (
                <li key={owner.key} className="text-xs leading-5 text-white/68">
                  {owner.label}: {owner.value}
                </li>
              ))}
            </ul>
          </article>
        ) : null}

        {packet.hostedCloseout.namedOwnersStillNeeded.length > 0 ? (
          <article className="mt-4 rounded-3xl border border-blue-300/20 bg-blue-300/10 p-4">
            <p className="text-sm font-semibold text-white">Still needs named owners</p>
            <ul className="mt-3 grid gap-2">
              {packet.hostedCloseout.namedOwnersStillNeeded.map((owner) => (
                <li key={owner.key} className="text-xs leading-5 text-white/68">
                  {owner.label}: {owner.recommendedDefault}
                </li>
              ))}
            </ul>
          </article>
        ) : null}

        <article className="mt-4 rounded-3xl border border-blue-300/20 bg-blue-300/10 p-4">
          <p className="text-sm font-semibold text-white">Still blocked in this loop</p>
          <ul className="mt-3 grid gap-2">
            {packet.hostedCloseout.blockedScope.map((item) => (
              <li key={item} className="text-xs leading-5 text-white/62">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-white/58">
            {packet.hostedCloseout.externalHoldPosture}
          </p>
        </article>
      </section>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#bfdbfe]/40 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 break-words text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: ProofMetadataPacketStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${packetStatusClassName(status)}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function packetStatusClassName(status: ProofMetadataPacketStatus): string {
  switch (status) {
    case "ready_for_local_proof_metadata":
    case "evidence_observed":
      return "bg-blue-300/20 text-blue-100";
    case "needs_manual_audit_check":
      return "bg-blue-300/20 text-blue-100";
    case "blocked_until_local_supabase":
    case "blocked_until_first_write":
    case "blocked_until_flags":
    case "blocked_until_auth":
      return "bg-blue-300/20 text-blue-100";
    case "hidden":
      return "bg-white/10 text-white/60";
  }
}

function readbackStatusClassName(status: ProofMetadataReadbackStatus): string {
  switch (status) {
    case "observed":
    case "disabled_outbox_observed":
      return "text-xs font-semibold uppercase tracking-[0.18em] text-blue-100";
    case "manual_check_needed":
      return "text-xs font-semibold uppercase tracking-[0.18em] text-blue-100";
    case "missing":
    case "blocked":
      return "text-xs font-semibold uppercase tracking-[0.18em] text-white/42";
  }
}
