import Link from "next/link";
import type {
  FirstWriteActivationDrill,
  FirstWriteDrillStatus,
} from "@/services/first-write-activation-drill";

type FirstWriteActivationDrillPanelProps = {
  drill: FirstWriteActivationDrill;
};

export function FirstWriteActivationDrillPanel({
  drill,
}: FirstWriteActivationDrillPanelProps) {
  if (!drill.canReadDrill) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
            First write drill
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{drill.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
            {drill.plainEnglishSummary}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusPill status={drill.status} />
            {drill.candidateAssignment ? (
              <Link
                href={drill.candidateAssignment.route}
                className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
              >
                Open candidate action
              </Link>
            ) : null}
            <Link
              href="/login"
              className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white/78"
            >
              Open local sign-in
            </Link>
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
        <article className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
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
        <article className="mt-5 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4">
          <h2 className="text-xl font-semibold text-white">
            No candidate assignment found
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/64">
            Seed local Supabase data before running the first-write activation drill.
          </p>
        </article>
      )}

      <section className="mt-5 rounded-[2rem] border border-teal-300/20 bg-teal-300/10 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-100/80">
              Operator packet
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {drill.verificationPacket.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/64">
              {drill.verificationPacket.plainEnglishDecision}
            </p>
          </div>
          <span className={verificationStatusClassName(drill.verificationPacket.status)}>
            {drill.verificationPacket.status.replaceAll("_", " ")}
          </span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
          <article className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold text-white">
              Required local env settings
            </p>
            <div className="mt-3 grid gap-2">
              {drill.verificationPacket.envSettings.map((setting) => (
                <div
                  key={setting.key}
                  className="rounded-2xl border border-white/10 bg-[#071d1a]/78 p-3"
                >
                  <p className="font-mono text-xs text-emerald-100/80">
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
            <p className="text-sm font-semibold text-white">Fake member sign-in</p>
            <p className="mt-3 rounded-2xl border border-white/10 bg-[#071d1a]/78 p-3 font-mono text-xs text-emerald-100/80">
              {drill.verificationPacket.fakeMemberCredential.email}
            </p>
            <p className="mt-2 rounded-2xl border border-white/10 bg-[#071d1a]/78 p-3 font-mono text-xs text-emerald-100/80">
              password={drill.verificationPacket.fakeMemberCredential.passwordLabel}
            </p>
            <Link
              href={drill.verificationPacket.fakeMemberCredential.route}
              className="mt-3 inline-flex rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
            >
              Open local sign-in
            </Link>
            <p className="mt-3 text-xs leading-5 text-white/54">
              This fake credential is local seed data only. It is not a production
              account.
            </p>
          </article>
        </div>

        <div className="mt-4 grid gap-3">
          {drill.verificationPacket.operatorSequence.map((step, index) => (
            <article
              key={`${step.label}-${step.route}`}
              className="rounded-3xl border border-white/10 bg-[#071d1a]/78 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-100/70">
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
            {drill.verificationPacket.safetyStops.map((stop) => (
              <li key={stop} className="text-xs leading-5 text-white/62">
                {stop}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {drill.checks.map((check) => (
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
          Post-drill readback evidence
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          After the local action-start drill runs, this section should move from
          planned proof to observed proof. It is read-only and does not trigger
          the write.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {drill.readbackEvidence.map((item) => (
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

      <section className="mt-5 rounded-[2rem] border border-white/10 bg-black/20 p-4">
        <h2 className="text-2xl font-semibold text-white">
          Staff drill sequence
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          Follow these steps only in local Supabase. Stop if any step implies a
          production user, external send, proof upload, or broad launch.
        </p>
        <div className="mt-4 grid gap-3">
          {drill.steps.map((step, index) => (
            <article
              key={step.key}
              className="rounded-3xl border border-white/10 bg-[#071d1a]/80 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/70">
                    Step {index + 1}
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
              <p className="mt-3 text-sm leading-6 text-white/64">
                {step.plainEnglish}
              </p>
              <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 font-mono text-xs text-emerald-100/76">
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
                      className="rounded-full border border-emerald-200/15 bg-emerald-200/10 px-3 py-1 font-mono text-[0.68rem] text-emerald-100/80"
                    >
                      {eventName}
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/52">
                Safety: {step.safetyBoundary}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-4">
        <h2 className="text-2xl font-semibold text-white">Proof to collect</h2>
        <ul className="mt-4 grid gap-2">
          {drill.proofToCollect.map((proof) => (
            <li key={proof} className="text-sm leading-6 text-white/66">
              {proof}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 rounded-[2rem] border border-violet-300/20 bg-violet-300/10 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-100/80">
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
          <article className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold text-white">Required hosted readback</p>
            <ul className="mt-3 grid gap-2">
              {drill.hostedCloseout.requiredReadback.map((item) => (
                <li key={item} className="text-sm leading-6 text-white/62">
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold text-white">Review surfaces</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {drill.hostedCloseout.reviewSurfaces.map((route) => (
                <span
                  key={route}
                  className="rounded-full border border-violet-200/15 bg-violet-200/10 px-3 py-1 font-mono text-[0.68rem] text-violet-100/80"
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
              className="rounded-3xl border border-white/10 bg-[#071d1a]/78 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-100/72">
                {item.label}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {item.recommendedDefault}
              </p>
            </article>
          ))}
        </div>

        {drill.hostedCloseout.recordedOwnerAnswers.length > 0 ? (
          <article className="mt-4 rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4">
            <p className="text-sm font-semibold text-white">Recorded approval answers</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {drill.hostedCloseout.recordedOwnerAnswers.map((item) => (
                <div
                  key={item.key}
                  className="rounded-2xl border border-white/10 bg-black/20 p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/72">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        <article className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-semibold text-white">Copy-paste approval reply</p>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-violet-100/82">
            {drill.hostedCloseout.approvalReplyBlock.join("\n")}
          </pre>
        </article>

        <article className="mt-4 rounded-3xl border border-orange-300/20 bg-orange-300/10 p-4">
          <p className="text-sm font-semibold text-white">Still blocked in this step</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {drill.hostedCloseout.blockedScope.map((item) => (
              <span
                key={item}
                className="rounded-full border border-orange-200/15 bg-orange-200/10 px-3 py-1 text-xs font-semibold text-orange-100/80"
              >
                {item}
              </span>
            ))}
          </div>
        </article>
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

function StatusPill({ status }: { status: FirstWriteDrillStatus }) {
  const className =
    status === "ready_for_local_action_start"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : status === "blocked_until_local_supabase"
        ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
        : status === "blocked_until_flags"
          ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
          : status === "blocked_until_auth"
            ? "border-orange-300/30 bg-orange-300/15 text-orange-100"
            : "border-white/10 bg-white/10 text-white/70";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function readbackStatusClassName(status: string): string {
  const base = "text-xs font-semibold uppercase tracking-[0.18em]";

  switch (status) {
    case "observed":
    case "safe_zero":
      return `${base} text-emerald-100`;
    case "manual_check_needed":
      return `${base} text-sky-100`;
    case "missing":
      return `${base} text-amber-100`;
    case "blocked":
    default:
      return `${base} text-orange-100`;
  }
}

function verificationStatusClassName(status: string): string {
  const base = "rounded-full border px-3 py-1 text-xs font-semibold";

  switch (status) {
    case "evidence_observed":
      return `${base} border-emerald-300/30 bg-emerald-300/15 text-emerald-100`;
    case "ready_to_run_locally":
      return `${base} border-sky-300/30 bg-sky-300/15 text-sky-100`;
    case "needs_manual_audit_check":
      return `${base} border-amber-300/30 bg-amber-300/15 text-amber-100`;
    case "blocked":
    default:
      return `${base} border-orange-300/30 bg-orange-300/15 text-orange-100`;
  }
}
