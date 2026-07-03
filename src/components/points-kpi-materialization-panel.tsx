import Link from "next/link";
import type {
  PointsKpiMaterializationPacket,
  PointsKpiMaterializationPacketStatus,
  PointsKpiMaterializationReadbackStatus,
} from "@/services/points-kpi-materialization-packet";

type PointsKpiMaterializationPanelProps = {
  packet: PointsKpiMaterializationPacket;
};

export function PointsKpiMaterializationPanel({
  packet,
}: PointsKpiMaterializationPanelProps) {
  if (!packet.canReadPacket) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
            Points and KPI packet
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{packet.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
            {packet.plainEnglishSummary}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill status={packet.status} />
            <Link
              href="/admin/hq-proof-write"
              className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white/78"
            >
              Check HQ packet
            </Link>
            <Link
              href={packet.candidate?.reviewRoute ?? "/rush-month/review"}
              className="rounded-full bg-sky-200 px-4 py-2 text-sm font-semibold text-[#062136]"
            >
              Open proof review
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
          <MiniStat label="Checks" value={`${packet.counts.checks}`} />
          <MiniStat label="Ready" value={`${packet.counts.passedChecks}`} />
          <MiniStat
            label="Readback"
            value={`${packet.counts.observedReadbackItems}`}
          />
          <MiniStat
            label="Duplicates"
            value={`${packet.counts.duplicateRowsDetected}`}
          />
          <MiniStat label="Sends" value={`${packet.counts.externalWritesExpected}`} />
        </div>
      </div>

      {packet.candidate ? (
        <article className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
            Candidate approval path
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {packet.candidate.assignmentTitle}
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-5">
            <MiniStat label="Assignment" value={packet.candidate.assignmentStatus} />
            <MiniStat label="Proof" value={packet.candidate.evidenceStatus} />
            <MiniStat
              label="Points rows"
              value={`${packet.candidate.pointsRowCount}`}
            />
            <MiniStat label="KPI rows" value={`${packet.candidate.kpiRowCount}`} />
            <MiniStat
              label="UUIDs"
              value={packet.candidate.usesSupabaseUuids ? "yes" : "no"}
            />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#071d1a]/78 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                Product rules
              </p>
              <p className="mt-2 text-xs leading-5 text-white/58">
                {packet.candidate.pointsConfigured} point(s) and KPI{" "}
                <span className="font-mono">{packet.candidate.kpiConfigured}</span>{" "}
                are expected from the approved assignment.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#071d1a]/78 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                Row totals
              </p>
              <p className="mt-2 text-xs leading-5 text-white/58">
                Points total: {packet.candidate.pointsTotal}. KPI total:{" "}
                {packet.candidate.kpiTotal}.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#071d1a]/78 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                Duplicate posture
              </p>
              <p className="mt-2 text-xs leading-5 text-white/58">
                {packet.candidate.duplicateMaterializationDetected
                  ? "More than one row was found for the same approval path."
                  : "One row per type is visible for the approved assignment."}
              </p>
            </div>
          </div>
        </article>
      ) : (
        <article className="mt-5 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4">
          <h2 className="text-xl font-semibold text-white">
            No approved assignment is ready yet
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/64">
            Run the leader proof review and HQ proof packet against local
            Supabase before checking points and KPI materialization.
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
            <p className="text-sm font-semibold text-white">Operator chain</p>
            <div className="mt-3 grid gap-2">
              {packet.verificationPacket.fakeOperatorChain.map((operator) => (
                <div
                  key={`${operator.roleLabel}-${operator.email}`}
                  className="rounded-2xl border border-white/10 bg-[#071d1a]/78 p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/80">
                    {operator.roleLabel}
                  </p>
                  <p className="mt-1 font-mono text-xs text-white/72">
                    {operator.email}
                  </p>
                  <p className="mt-1 text-xs text-white/52">{operator.route}</p>
                </div>
              ))}
            </div>
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
        <h2 className="text-2xl font-semibold text-white">Readback evidence</h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          This section stays read-only. It exists so reviewers can connect the
          approved proof decision to the resulting points row, KPI row, disabled
          outbox posture, and audit proof.
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

      {packet.candidate ? (
        <section className="mt-5 rounded-[2rem] border border-fuchsia-300/20 bg-fuchsia-300/10 p-4">
          <h2 className="text-2xl font-semibold text-white">Role read scopes</h2>
          <p className="mt-2 text-sm leading-6 text-white/62">
            These routes show how the same recognition state is visible
            differently to members, leaders, coaches, and staff.
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {packet.candidate.roleReadScopes.map((scope) => (
              <article
                key={`${scope.roleLabel}-${scope.route}`}
                className="rounded-3xl border border-white/10 bg-[#071d1a]/80 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fuchsia-100/80">
                      {scope.roleLabel}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/62">
                      {scope.detail}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/12 bg-black/20 px-3 py-1 text-xs font-semibold text-white/72">
                    {scope.canInspectRawRows ? "Raw rows" : "Summary only"}
                  </span>
                </div>
                <Link
                  href={scope.route}
                  className="mt-3 inline-flex rounded-full border border-white/12 bg-black/20 px-3 py-2 text-xs font-semibold text-white/72"
                >
                  Open {scope.route}
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function StatusPill({ status }: { status: PointsKpiMaterializationPacketStatus }) {
  return (
    <span className={packetStatusClassName(status)}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/42">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function packetStatusClassName(status: PointsKpiMaterializationPacketStatus) {
  switch (status) {
    case "evidence_observed":
      return "inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-100";
    case "needs_manual_audit_check":
    case "duplicate_materialization_detected":
      return "inline-flex rounded-full border border-amber-300/30 bg-amber-300/15 px-3 py-1 text-xs font-semibold text-amber-100";
    case "hidden":
      return "inline-flex rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs font-semibold text-white/70";
    default:
      return "inline-flex rounded-full border border-sky-300/30 bg-sky-300/15 px-3 py-1 text-xs font-semibold text-sky-100";
  }
}

function readbackStatusClassName(status: PointsKpiMaterializationReadbackStatus) {
  switch (status) {
    case "observed":
      return "text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100";
    case "manual_check_needed":
      return "text-xs font-semibold uppercase tracking-[0.18em] text-amber-100";
    case "blocked":
      return "text-xs font-semibold uppercase tracking-[0.18em] text-white/60";
    default:
      return "text-xs font-semibold uppercase tracking-[0.18em] text-rose-100";
  }
}
