import Link from "next/link";
import type {
  PilotSupportPacket,
  PilotSupportPacketCheck,
  PilotSupportPacketOwner,
  PilotSupportPacketStatus,
  PilotSupportPacketStopRule,
} from "@/services/pilot-support-packet";

type PilotSupportPacketPanelProps = {
  packet: PilotSupportPacket;
};

export function PilotSupportPacketPanel({
  packet,
}: PilotSupportPacketPanelProps) {
  if (!packet.canReadPacket) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
            Pilot support packet
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{packet.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/68">
            {packet.summary}
          </p>
          <p className="mt-3 max-w-3xl rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-cyan-50/78">
            Recommended next move: {packet.recommendedNextMove}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <PreviewToken>Read-only preview</PreviewToken>
            <PreviewToken>Blocked production writes</PreviewToken>
            <PreviewToken>Blocked external sends</PreviewToken>
            <PreviewToken>Source-backed owner handoffs</PreviewToken>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin/staff-dry-run"
              className="rounded-full bg-cyan-200 px-4 py-2 text-sm font-semibold text-[#062028]"
            >
              Open staff dry run review
            </Link>
            <Link
              href="/admin/pilot-scope"
              className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white/78"
            >
              Open pilot scope review
            </Link>
            <Link
              href="/admin/launch-gate"
              className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white/78"
            >
              Open launch gate review
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <MiniStat label="Owners" value={`${packet.counts.owners}`} />
          <MiniStat label="Checks" value={`${packet.counts.checks}`} />
          <MiniStat label="Ready" value={`${packet.counts.reviewReady}`} />
          <MiniStat label="Blocked" value={`${packet.counts.blockedBeforeLive}`} />
        </div>
      </div>

      <section className="mt-5 rounded-[2rem] border border-white/10 bg-black/20 p-4">
        <h3 className="text-xl font-semibold text-white">Pilot constraints</h3>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {packet.pilotConstraints.map((constraint) => (
            <li key={constraint} className="text-sm leading-6 text-white/64">
              {constraint}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {packet.ownerChecklist.map((item) => (
          <OwnerCard key={item.key} item={item} />
        ))}
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {packet.readinessChecks.map((item) => (
          <CheckCard key={item.key} item={item} />
        ))}
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {packet.stopRules.map((rule) => (
          <StopRuleCard key={rule.key} rule={rule} />
        ))}
      </div>

      <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#071d1a]/70 p-4">
        <h3 className="text-xl font-semibold text-white">
          Student communications policy
        </h3>
        <ul className="mt-3 grid gap-2">
          {packet.studentCommsPolicy.map((item) => (
            <li key={item} className="text-sm leading-6 text-white/64">
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <MiniStat
            label="Browser writes"
            value={`${packet.counts.browserWritesExpected}`}
          />
          <MiniStat
            label="External sends"
            value={`${packet.counts.externalWritesExpected}`}
          />
        </div>
      </section>
    </section>
  );
}

function OwnerCard({ item }: { item: PilotSupportPacketOwner }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusPill status={item.status} />
          <h3 className="mt-3 text-lg font-semibold text-white">{item.label}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/60">
            Owner lane: {item.ownerLane}
          </p>
        </div>
        <p className="font-mono text-xs text-white/42">{item.key}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/66">{item.expectation}</p>
      <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-xs leading-5 text-white/56">
        Current posture: {item.currentPosture}
      </p>
      <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-cyan-100/72">
        Next step: {item.nextStep}
      </p>
    </article>
  );
}

function CheckCard({ item }: { item: PilotSupportPacketCheck }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#071d1a]/78 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusPill status={item.status} />
          <h3 className="mt-3 text-lg font-semibold text-white">{item.label}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/60">
            Owner lane: {item.ownerLane}
          </p>
        </div>
        <p className="font-mono text-xs text-white/42">{item.key}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/66">{item.currentPosture}</p>
      <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/56">
        Missing approval: {item.missingApproval}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.reviewRoutes.map((route) => (
          <span
            key={`${item.key}-${route}`}
            className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/60"
          >
            {route}
          </span>
        ))}
      </div>
    </article>
  );
}

function StopRuleCard({ rule }: { rule: PilotSupportPacketStopRule }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{rule.label}</h3>
        </div>
        <p className="font-mono text-xs text-white/42">{rule.key}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/64">Why it matters: {rule.reason}</p>
      <p className="mt-3 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-cyan-100/72">
        Response: {rule.response}
      </p>
    </article>
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

function PreviewToken({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-xs font-semibold text-cyan-100/80">
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: PilotSupportPacketStatus }) {
  const className =
    status === "review_ready"
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
