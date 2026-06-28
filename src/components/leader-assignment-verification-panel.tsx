import type {
  LeaderAssignmentPacket,
  LeaderAssignmentPacketStatus,
  LeaderAssignmentReadbackStatus,
} from "@/services/leader-assignment-verification-packet";
import { PanelButton, StatusPill, SurfacePanel } from "@/components/visual-primitives";

type LeaderAssignmentVerificationPanelProps = {
  packet: LeaderAssignmentPacket;
};

export function LeaderAssignmentVerificationPanel({
  packet,
}: LeaderAssignmentVerificationPanelProps) {
  if (!packet.canReadPacket) {
    return null;
  }

  return (
    <SurfacePanel as="section" className="rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--background)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
            Leader assignment packet
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            {packet.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
            {packet.plainEnglishSummary}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill tone={packetStatusTone(packet.status)}>
              {packet.status.replaceAll("_", " ")}
            </StatusPill>
            <PanelButton
              href="/admin/hq-proof-write"
              className="border-white/12 bg-[var(--mymedlife-border)]/40 text-white/78"
            >
              Check HQ packet
            </PanelButton>
            <PanelButton
              href="/rush-month/actions"
              className="bg-[var(--mymedlife-primary-button)] text-[var(--foreground)]"
            >
              Open assignments
            </PanelButton>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
          <MiniStat label="Checks" value={`${packet.counts.checks}`} />
          <MiniStat label="Ready" value={`${packet.counts.passedChecks}`} />
          <MiniStat label="Readback" value={`${packet.counts.observedReadbackItems}`} />
          <MiniStat label="Reminders" value={`${packet.counts.remindersExpected}`} />
          <MiniStat label="Sends" value={`${packet.counts.externalWritesExpected}`} />
        </div>
      </div>

      <SurfacePanel as="article" className="mt-5 rounded-3xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
          Default local assignment
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          {packet.defaultInput.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          {packet.defaultInput.instructions}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <MiniStat label="Owner" value={packet.defaultInput.ownerRole} />
          <MiniStat label="Points" value={`${packet.defaultInput.points}`} />
          <MiniStat label="KPI" value={packet.defaultInput.kpi} />
          <MiniStat label="Due" value={packet.defaultInput.dueLabel} />
        </div>
      </SurfacePanel>

      <SurfacePanel as="section" className="mt-5 rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
          Leader responsibility map
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Review who owns approval, handoff, and coordination before opening the write.
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/64">
          Staff should verify the role split before this packet is allowed to
          create one local assignment. The map is read-only and does not grant
          permissions to any chapter role.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {packet.roleResponsibilities.map((item) => (
            <SurfacePanel
              as="article"
              key={item.roleLabel}
              className="rounded-3xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/70">
                {item.responsibility}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                {item.roleLabel}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/62">
                {item.reviewPrompt}
              </p>
              <p className="mt-3 rounded-2xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/78 p-3 text-xs leading-5 text-white/54">
                {item.safetyBoundary}
              </p>
              <PanelButton
                href={item.route}
                variant="secondary"
                className="mt-3 border-white/12 bg-[var(--mymedlife-border)]/40 text-white/72"
              >
                Open {item.route}
              </PanelButton>
            </SurfacePanel>
          ))}
        </div>
      </SurfacePanel>

      <SurfacePanel as="section" className="mt-5 rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
              Operator packet
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {packet.verificationPacket.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/64">
              {packet.verificationPacket.plainEnglishDecision}
            </p>
          </div>
          <StatusPill tone={verificationPacketStatusTone(packet.verificationPacket.status)}>
            {packet.verificationPacket.status.replaceAll("_", " ")}
          </StatusPill>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
          <SurfacePanel as="article" className="rounded-3xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
            <p className="text-sm font-semibold text-white">
              Required local env settings
            </p>
            <div className="mt-3 grid gap-2">
              {packet.verificationPacket.envSettings.map((setting) => (
                <div
                  key={setting.key}
                  className="rounded-2xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/78 p-3"
                >
                  <p className="font-mono text-xs text-[var(--mymedlife-badge-background)]/80">
                    {setting.key}={setting.value}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/52">
                    {setting.reason}
                  </p>
                </div>
              ))}
            </div>
          </SurfacePanel>

          <SurfacePanel as="article" className="rounded-3xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
            <p className="text-sm font-semibold text-white">Assignment proof</p>
              <p className="mt-3 rounded-2xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/78 p-3 font-mono text-xs text-[var(--mymedlife-badge-background)]/80">
              chapter={packet.chapterId}
              <br />
              campaign={packet.campaignId}
            </p>
            <p className="mt-3 text-xs leading-5 text-white/56">
              Proof required: {packet.defaultInput.evidenceRequired}
            </p>
            <p className="mt-3 rounded-2xl border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-3 text-xs leading-5 text-[var(--mymedlife-badge-background)]/78">
              This packet must not send reminder emails, SMS, HubSpot handoffs,
              n8n workflows, Luma writes, or any external automation.
            </p>
          </SurfacePanel>
        </div>

        <div className="mt-4 grid gap-3">
          {packet.verificationPacket.operatorSequence.map((step, index) => (
            <SurfacePanel
              as="article"
              key={`${step.label}-${step.route}`}
              className="rounded-3xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/78 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/70">
                    Packet step {index + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {step.label}
                  </h3>
                </div>
              <PanelButton
                href={step.route}
                variant="secondary"
                className="border-white/12 bg-[var(--mymedlife-border)]/40 text-white/72"
              >
                Open {step.route}
              </PanelButton>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/62">
              {step.expectedProof}
            </p>
            </SurfacePanel>
          ))}
        </div>

        <SurfacePanel as="article" className="mt-4 rounded-3xl border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-4">
          <p className="text-sm font-semibold text-white">Stop conditions</p>
          <ul className="mt-3 grid gap-2">
            {packet.verificationPacket.safetyStops.map((stop) => (
              <li key={stop} className="text-xs leading-5 text-white/62">
                {stop}
              </li>
            ))}
          </ul>
        </SurfacePanel>
      </SurfacePanel>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {packet.checks.map((check) => (
          <SurfacePanel
            as="article"
            key={check.key}
            className="rounded-3xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/78 p-4"
          >
            <p
              className={
                check.passed
                  ? "text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]"
                  : "text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]"
              }
            >
              {check.passed ? "Ready" : "Blocked"}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">{check.label}</h2>
            <p className="mt-2 text-sm leading-6 text-white/62">{check.detail}</p>
          </SurfacePanel>
        ))}
      </div>

      <SurfacePanel as="section" className="mt-5 rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--background)] p-4">
        <h2 className="text-2xl font-semibold text-white">
          Post-assignment readback evidence
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          After the local assignment-create test runs, this section should show
          observed assignment, event, integration, disabled outbox, and audit
          proof. It is read-only and does not trigger the write.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {packet.readbackEvidence.map((item) => (
            <SurfacePanel
              as="article"
              key={item.key}
              className="rounded-3xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/80 p-4"
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
            </SurfacePanel>
          ))}
        </div>
      </SurfacePanel>
    </SurfacePanel>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 break-words text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function packetStatusTone(status: LeaderAssignmentPacketStatus): "blue" | "amber" | "white" {
  switch (status) {
    case "ready_for_local_assignment_create":
    case "evidence_observed":
      return "blue";
    case "needs_manual_audit_check":
      return "amber";
    case "blocked_until_local_supabase":
    case "blocked_until_hq_decision":
    case "blocked_until_flags":
    case "blocked_until_auth":
    case "hidden":
      return "white";
  }
}

function verificationPacketStatusTone(
  status: LeaderAssignmentPacketStatus,
): "yellow" | "blue" | "white" {
  switch (status) {
    case "ready_for_local_assignment_create":
    case "evidence_observed":
      return "blue";
    case "needs_manual_audit_check":
      return "yellow";
    case "hidden":
      return "white";
    case "blocked_until_local_supabase":
    case "blocked_until_hq_decision":
    case "blocked_until_flags":
    case "blocked_until_auth":
    default:
      return "blue";
  }
}

function readbackStatusClassName(status: LeaderAssignmentReadbackStatus): string {
  switch (status) {
    case "observed":
    case "disabled_outbox_observed":
      return "text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]";
    case "manual_check_needed":
      return "text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]";
    case "missing":
    case "blocked":
      return "text-xs font-semibold uppercase tracking-[0.18em] text-white/42";
  }
}
