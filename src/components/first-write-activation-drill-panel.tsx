import type {
  FirstWriteActivationDrill,
  FirstWriteDrillStatus,
} from "@/services/first-write-activation-drill";
import { PanelButton, SurfacePanel, StatusPill } from "@/components/visual-primitives";

type FirstWriteActivationDrillPanelProps = {
  drill: FirstWriteActivationDrill;
};

export function FirstWriteActivationDrillPanel({
  drill,
}: FirstWriteActivationDrillPanelProps) {
  if (!drill.canReadDrill) {
    return null;
  }

  const isHostedStaging = drill.verificationPacket.envSettings.some((setting) => {
    return setting.key === "MYMEDLIFE_AUTH_MODE" && setting.value === "staging_supabase";
  });
  const signInLabel = isHostedStaging ? "Open staging sign-in" : "Open local sign-in";
  const settingsLabel = isHostedStaging
    ? "Required staging review settings"
    : "Required local env settings";
  const credentialNote = isHostedStaging
    ? "This seeded review credential is for approved staging proof only. It is not a production account."
    : "This fake credential is local seed data only. It is not a production account.";
  const readbackIntro = isHostedStaging
    ? "After the hosted action-start proof runs, this section should move from planned proof to observed proof. It is read-only and does not trigger the write."
    : "After the local action-start drill runs, this section should move from planned proof to observed proof. It is read-only and does not trigger the write.";
  const sequenceIntro = isHostedStaging
    ? "Follow these steps only in the approved staging review window. Stop if any step implies a production user, external send, proof upload, or broad launch."
    : "Follow these steps only in local Supabase. Stop if any step implies a production user, external send, proof upload, or broad launch.";

  return (
    <SurfacePanel
      as="section"
      className="rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
            First write drill
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{drill.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
            {drill.plainEnglishSummary}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusPill tone={drillStatusTone(drill.status)}>
              {drill.status.replaceAll("_", " ")}
            </StatusPill>
            {drill.candidateAssignment ? (
              <PanelButton
                href={drill.candidateAssignment.route}
                className="bg-[var(--mymedlife-focus-blue)] text-[var(--foreground)]"
              >
                Open candidate action
              </PanelButton>
            ) : null}
            <PanelButton
              href="/login"
              variant="secondary"
              className="border-white/12 bg-[var(--mymedlife-border)]/40 text-white/78"
            >
              {signInLabel}
            </PanelButton>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
          <MiniStat label="Checks" value={`${drill.counts.checks}`} />
          <MiniStat label="Ready" value={`${drill.counts.passedChecks}`} />
          <MiniStat label="Readback" value={`${drill.counts.observedReadbackItems}`} />
          <MiniStat label="Writes" value={`${drill.counts.browserWritesExpected}`} />
          <MiniStat label="Sends" value={`${drill.counts.externalWritesExpected}`} />
        </div>
      </div>

      {drill.candidateAssignment ? (
        <article className="mt-5 rounded-3xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
            Candidate action
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {drill.candidateAssignment.title}
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <MiniStat label="Status" value={drill.candidateAssignment.status} />
            <MiniStat
              label="UUID"
              value={drill.candidateAssignment.usesSupabaseUuid ? "yes" : "no"}
            />
            <MiniStat label="Route" value={drill.candidateAssignment.route} />
          </div>
        </article>
      ) : (
        <article className="mt-5 rounded-3xl border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-4">
          <h2 className="text-xl font-semibold text-white">
            No candidate assignment found
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/64">
            Seed local Supabase data before running the first-write activation drill.
          </p>
        </article>
      )}

      <SurfacePanel
        as="section"
        className="mt-5 rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em]  text-[var(--mymedlife-badge-background)]/80">
              Operator packet
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {drill.verificationPacket.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/64">
              {drill.verificationPacket.plainEnglishDecision}
            </p>
          </div>
          <StatusPill tone={verificationStatusTone(drill.verificationPacket.status)}>
            {drill.verificationPacket.status.replaceAll("_", " ")}
          </StatusPill>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
          <article className="rounded-3xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
            <p className="text-sm font-semibold text-white">
              {settingsLabel}
            </p>
            <div className="mt-3 grid gap-2">
              {drill.verificationPacket.envSettings.map((setting) => (
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
          </article>

          <article className="rounded-3xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
            <p className="text-sm font-semibold text-white">Fake member sign-in</p>
            <p className="mt-3 rounded-2xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/78 p-3 font-mono text-xs text-[var(--mymedlife-badge-background)]/80">
              {drill.verificationPacket.fakeMemberCredential.email}
            </p>
            <p className="mt-2 rounded-2xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/78 p-3 font-mono text-xs text-[var(--mymedlife-badge-background)]/80">
              password={drill.verificationPacket.fakeMemberCredential.passwordLabel}
            </p>
            <PanelButton
              href={drill.verificationPacket.fakeMemberCredential.route}
              className="mt-3 bg-[var(--mymedlife-focus-blue)] text-[var(--foreground)]"
            >
              {signInLabel}
            </PanelButton>
            <p className="mt-3 text-xs leading-5 text-white/54">
              {credentialNote}
            </p>
          </article>
        </div>

        <div className="mt-4 grid gap-3">
          {drill.verificationPacket.operatorSequence.map((step, index) => (
            <article
              key={`${step.label}-${step.route}`}
              className="rounded-3xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/78 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]  text-[var(--mymedlife-badge-background)]/70">
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
            </article>
          ))}
        </div>

        <article className="mt-4 rounded-3xl border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-4">
          <p className="text-sm font-semibold text-white">Stop conditions</p>
          <ul className="mt-3 grid gap-2">
            {drill.verificationPacket.safetyStops.map((stop) => (
              <li key={stop} className="text-xs leading-5 text-white/62">
                {stop}
              </li>
            ))}
          </ul>
        </article>
      </SurfacePanel>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {drill.checks.map((check) => (
          <article
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
          </article>
        ))}
      </div>

      <SurfacePanel
        as="section"
        className="mt-5 rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-4"
      >
        <h2 className="text-2xl font-semibold text-white">
          Post-drill readback evidence
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          {readbackIntro}
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {drill.readbackEvidence.map((item) => (
            <article
              key={item.key}
              className="rounded-3xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/80 p-4"
            >
              <StatusPill tone={readbackStatusTone(item.status)}>
                {item.status.replaceAll("_", " ")}
              </StatusPill>
              <h3 className="mt-2 text-lg font-semibold text-white">
                {item.label}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/62">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </SurfacePanel>

      <SurfacePanel
        as="section"
        className="mt-5 rounded-[2rem] border border-white/10 bg-[var(--mymedlife-border)]/40 p-4"
      >
        <h2 className="text-2xl font-semibold text-white">
          Staff drill sequence
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          {sequenceIntro}
        </p>
        <div className="mt-4 grid gap-3">
          {drill.steps.map((step, index) => (
            <article
              key={step.key}
              className="rounded-3xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/80 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/70">
                    Step {index + 1}
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
              <p className="mt-3 text-sm leading-6 text-white/64">
                {step.plainEnglish}
              </p>
              <p className="mt-3 rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-3 font-mono text-xs text-[var(--mymedlife-badge-background)]/76">
                MYMEDLIFE_LOCAL_ACTOR_EMAIL={step.localActorEmail}
              </p>
              <p className="mt-3 text-xs leading-5 text-white/56">
                Expected: {step.expectedResult}
              </p>
              {step.structuredEvents.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {step.structuredEvents.map((eventName) => (
                    <span
                      key={`${step.key}-${eventName}`}
                      className="rounded-full border border-[var(--mymedlife-border)]/15 bg-[var(--mymedlife-border)]/10 px-3 py-1 font-mono text-[0.68rem] text-[var(--mymedlife-badge-background)]/80"
                    >
                      {eventName}
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="mt-3 rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-3 text-xs leading-5 text-white/52">
                Safety: {step.safetyBoundary}
              </p>
            </article>
          ))}
        </div>
      </SurfacePanel>

      <SurfacePanel
        as="section"
        className="mt-5 rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-4"
      >
        <h2 className="text-2xl font-semibold text-white">Proof to collect</h2>
        <ul className="mt-4 grid gap-2">
          {drill.proofToCollect.map((proof) => (
            <li key={proof} className="text-sm leading-6 text-white/66">
              {proof}
            </li>
          ))}
        </ul>
      </SurfacePanel>

      <SurfacePanel
        as="section"
        className="mt-5 rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
              Phase 2 closeout
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {drill.hostedCloseout.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/64">
              {drill.hostedCloseout.hostedDecision}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <MiniStat label="Target" value={drill.hostedCloseout.stagingTarget} />
            <MiniStat label="Write" value={drill.hostedCloseout.recommendedHostedWrite} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
            <p className="text-sm font-semibold text-white">Required hosted readback</p>
            <ul className="mt-3 grid gap-2">
              {drill.hostedCloseout.requiredReadback.map((item) => (
                <li key={item} className="text-sm leading-6 text-white/62">
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
            <p className="text-sm font-semibold text-white">Review surfaces</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {drill.hostedCloseout.reviewSurfaces.map((route) => (
                <span
                  key={route}
                  className="rounded-full border border-[var(--mymedlife-border)]/15 bg-[var(--mymedlife-border)]/10 px-3 py-1 font-mono text-[0.68rem] text-[var(--mymedlife-badge-background)]/80"
                >
                  {route}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-white/54">
              {drill.hostedCloseout.externalHoldPosture}
            </p>
          </article>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {drill.hostedCloseout.namedOwnersStillNeeded.map((item) => (
            <article
              key={item.key}
              className="rounded-3xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/78 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/72">
                {item.label}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {item.recommendedDefault}
              </p>
            </article>
          ))}
        </div>

        {drill.hostedCloseout.recordedOwnerAnswers.length > 0 ? (
          <article className="mt-4 rounded-3xl border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-4">
            <p className="text-sm font-semibold text-white">Recorded approval answers</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {drill.hostedCloseout.recordedOwnerAnswers.map((item) => (
                <div
                  key={item.key}
                  className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--mymedlife-badge-background)]/72">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        <article className="mt-4 rounded-3xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
          <p className="text-sm font-semibold text-white">Copy-paste approval reply</p>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--mymedlife-badge-background)]/82">
            {drill.hostedCloseout.approvalReplyBlock.join("\n")}
          </pre>
        </article>

        <article className="mt-4 rounded-3xl border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-4">
          <p className="text-sm font-semibold text-white">Still blocked in this step</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {drill.hostedCloseout.blockedScope.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--mymedlife-border)]/15 bg-[var(--mymedlife-border)]/10 px-3 py-1 text-xs font-semibold text-[var(--mymedlife-badge-background)]/80"
              >
                {item}
              </span>
            ))}
          </div>
        </article>
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

function readbackStatusTone(status: string): "blue" | "amber" | "white" | "yellow" {
  switch (status) {
    case "observed":
    case "safe_zero":
      return "blue";
    case "manual_check_needed":
      return "blue";
    case "missing":
      return "amber";
    case "blocked":
    default:
      return "white";
  }
}

function verificationStatusTone(
  status: string,
): "blue" | "yellow" | "white" | "amber" {
  switch (status) {
    case "evidence_observed":
      return "blue";
    case "ready_to_run_locally":
      return "blue";
    case "needs_manual_audit_check":
      return "yellow";
    case "blocked":
    default:
      return "white";
  }
}

function drillStatusTone(status: FirstWriteDrillStatus): "amber" | "blue" | "white" | "yellow" {
  switch (status) {
    case "ready_for_local_action_start":
      return "blue";
    case "evidence_recorded":
      return "white";
    case "blocked_until_local_supabase":
      return "amber";
    case "blocked_until_flags":
      return "blue";
    case "blocked_until_auth":
      return "yellow";
    default:
      return "white";
  }
}
