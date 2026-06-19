import Link from "next/link";
import type { ReactNode } from "react";
import type {
  Phase2SafePrepPacket,
  Phase2StatusGroup,
  Phase2WriteGate,
} from "@/services/phase-2-safe-prep";

type Phase2ReviewSurfacePanelProps = {
  packet: Phase2SafePrepPacket;
};

export function Phase2ReviewSurfacePanel({
  packet,
}: Phase2ReviewSurfacePanelProps) {
  return (
    <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
            Safe Phase 2 review
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{packet.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {packet.summary}
          </p>
          <p className="mt-3 max-w-3xl rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-sky-50/80">
            Stack decision: {packet.stackDecision}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
          <MiniStat label="Issues" value={`${packet.counts.linearIssues}`} />
          <MiniStat label="Prep" value={`${packet.counts.prepReady}`} />
          <MiniStat label="Blocked" value={`${packet.counts.blockedPendingDsReview}`} />
          <MiniStat label="Writes" value={`${packet.counts.writeGates}`} />
          <MiniStat
            label="Live"
            value={`${packet.counts.liveImplementationNotAuthorized}`}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MiniToken label="In review" value={`${packet.counts.inReview}`} />
        <MiniToken label="Backlog" value={`${packet.counts.backlog}`} />
        <MiniToken label="Writes" value={`${packet.counts.externalWritesExpected}`} />
        <MiniToken label="Sends" value={`${packet.counts.externalWritesExpected}`} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {packet.statusGroups.map((group) => (
          <StatusGroupCard key={group.key} group={group} />
        ))}
      </div>

      <SectionCard
        title="Reviewer checklist"
        eyebrow="PR #94 first, then PR #95"
        summary="This is the shortest path for Nick, Kiomi, DS, and Renato to review the current packets without drifting into Phase 3 or live implementation."
      >
        <div className="grid gap-2">
          {packet.reviewerChecklist.map((step, index) => (
            <article
              key={step.key}
              className="rounded-2xl border border-white/10 bg-black/20 p-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-100/70">
                    Step {index + 1}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">{step.label}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/56">
                  {step.owners}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/62">
                Review target: {step.reviewTarget}
              </p>
              <p className="mt-2 rounded-2xl bg-white/[0.05] p-3 text-xs leading-5 text-sky-50/72">
                Success signal: {step.successSignal}
              </p>
            </article>
          ))}
        </div>
      </SectionCard>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/70">
            Issue map
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            MED-471 through MED-486
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/62">
            The prep lane stays readable because the packet breaks the work into
            a reviewable umbrella item, foundation items, gated writes, and a
            pilot runbook.
          </p>

          <div className="mt-4 grid gap-2">
            {packet.linearIssues.map((issue) => (
              <div
                key={issue.id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill status={issue.status} />
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/58">
                        {issue.type.replaceAll("_", " ")}
                      </span>
                    </div>
                    <h4 className="mt-2 text-sm font-semibold text-white">
                      {issue.id} - {issue.title}
                    </h4>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/56">
                    {issue.owner.join(" / ")}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-white/58">
                  {issue.purpose}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/70">
            Mock-only boundary
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            What still stays off
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/62">
            This surface makes the current boundary explicit so review can happen
            without accidentally implying live implementation is approved.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {packet.mockOnlyBoundaries.map((boundary) => (
              <BoundaryChip key={boundary} label={boundary} />
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/56">
            Live work remains blocked until Kiomi/DS confirm the stack and
            environment path, then MED-472, MED-473, and MED-474 can start as a
            foundation lane.
          </div>
        </article>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <SectionCard
          title="Environment checklist"
          eyebrow="Local, staging, production"
          summary="The environment model names the ownership split, callback topics, secrets boundary, and backup posture."
        >
          <div className="grid gap-2">
            {packet.environmentChecklist.map((item) => (
              <div
                key={item.key}
                className="rounded-2xl border border-white/10 bg-black/20 p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.environment.toUpperCase()}
                    </p>
                    <p className="mt-1 text-xs text-white/48">
                      {item.owner.join(" / ")}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/56">
                    secrets blocked
                  </span>
                </div>
                <ul className="mt-2 grid gap-1">
                  {item.checklist.map((check) => (
                    <li key={check} className="text-sm leading-6 text-white/62">
                      {check}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Auth and onboarding"
          eyebrow="Sign-in through role routing"
          summary="The live path stays blocked until the auth, callback, profile, role, and rollback pieces are approved."
        >
          <div className="grid gap-2">
            {packet.authOnboardingPlan.map((step) => (
              <div
                key={step.order}
                className="rounded-2xl border border-white/10 bg-black/20 p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-100/70">
                      Step {step.order}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {step.label}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/56">
                    {step.owner.join(" / ")}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  {step.evidenceRequired}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <SectionCard
          title="Write promotion sequence"
          eyebrow="One write at a time"
          summary="Each write needs staging proof, permission tests, audit readback, duplicate/error handling, and rollback before the next gate opens."
        >
          <div className="grid gap-2">
            {packet.writePromotionSequence.map((write) => (
              <WriteGateCard key={write.issueId} gate={write} />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Next approval steps"
          eyebrow="What has to happen next"
          summary="These are the review gates that stand between the prep packet and any live implementation work."
        >
          <div className="grid gap-2">
            {packet.nextApprovalSteps.map((step) => (
              <div
                key={step.key}
                className="rounded-2xl border border-white/10 bg-black/20 p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {step.label}
                    </p>
                    <p className="mt-1 text-xs text-white/48">
                      {step.owner.join(" / ")}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/56">
                    approval step
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/62">{step.reason}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <SectionCard
          title="Owner responsibilities"
          eyebrow="Nick, Kiomi / DS, Codex"
          summary="The split stays simple: people own the platform, Codex owns the safe prep packet, and Nick owns the launch decision."
        >
          <div className="grid gap-2">
            {Object.entries(packet.ownerResponsibilities).map(([owner, items]) => (
              <div
                key={owner}
                className="rounded-2xl border border-white/10 bg-black/20 p-3"
              >
                <p className="text-sm font-semibold text-white">{owner}</p>
                <ul className="mt-2 grid gap-1">
                  {items.map((item) => (
                    <li key={item} className="text-sm leading-6 text-white/62">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Supporting review links"
          eyebrow="Audit, health, launch, security, ops"
          summary="These routes hold the supporting evidence that sits around the Phase 2 review surface."
        >
          <div className="grid gap-2">
            {packet.reviewLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-white/10 bg-black/20 p-3 text-left transition hover:border-sky-200/40 hover:bg-white/[0.07]"
              >
                <p className="text-sm font-semibold text-white">{link.label}</p>
                <p className="mt-1 text-sm leading-6 text-white/62">
                  {link.summary}
                </p>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </section>
  );
}

function StatusGroupCard({ group }: { group: Phase2StatusGroup }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <StatusTonePill group={group} />
      <h3 className="mt-3 text-lg font-semibold text-white">{group.label}</h3>
      <p className="mt-2 text-sm leading-6 text-white/64">{group.summary}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {group.issueIds.map((issueId) => (
          <span
            key={issueId}
            className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/58"
          >
            {issueId}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-sky-100/72">{group.note}</p>
    </article>
  );
}

function WriteGateCard({ gate }: { gate: Phase2WriteGate }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-100/70">
            {gate.issueId} · step {gate.order}
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{gate.label}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/56">
          {gate.owner.join(" / ")}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-white/62">{gate.blockedUntil}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {gate.gateChecklist.map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/56"
          >
            {item}
          </span>
        ))}
      </div>
    </article>
  );
}

function SectionCard({
  title,
  eyebrow,
  summary,
  children,
}: {
  title: string;
  eyebrow: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/70">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/62">{summary}</p>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function StatusPill({ status }: { status: "Backlog" | "In Review" }) {
  const className =
    status === "In Review"
      ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
      : "border-amber-300/30 bg-amber-300/15 text-amber-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

function StatusTonePill({ group }: { group: Phase2StatusGroup }) {
  const className =
    group.key === "prep_ready"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : group.key === "blocked_pending_ds_review"
        ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
        : "border-rose-300/30 bg-rose-300/15 text-rose-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {group.label}
    </span>
  );
}

function BoundaryChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
      {label}
    </span>
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

function MiniToken({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/62">
      {label} {value}
    </span>
  );
}
