import Link from "next/link";
import type {
  NickMvpReviewPacket,
  NickMvpReviewStatus,
} from "@/services/nick-mvp-review";

type NickMvpReviewPanelProps = {
  packet: NickMvpReviewPacket;
};

export function NickMvpReviewPanel({ packet }: NickMvpReviewPanelProps) {
  if (!packet.canReadPacket) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
            Final local review
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{packet.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {packet.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Writes" value={`${packet.browserWritesExpected}`} />
          <MiniStat label="Sends" value={`${packet.externalWritesExpected}`} />
          <MiniStat label="Invites" value={`${packet.studentInvitationsExpected}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {packet.reviewItems.map((item) => (
          <article key={item.key} className="rounded-2xl bg-black/20 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill status={item.status} />
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
                    {item.ownerLane}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  {item.plainEnglish}
                </p>
              </div>
              <Link
                href={item.route}
                className="w-fit shrink-0 rounded-full bg-cyan-200 px-3 py-2 text-sm font-semibold text-[#06211d]"
              >
                Open {item.route}
              </Link>
            </div>
            <p className="mt-3 break-words font-mono text-xs text-cyan-100/72">
              MYMEDLIFE_LOCAL_ACTOR_EMAIL={item.reviewerActorEmail}
            </p>
            <p className="mt-3 rounded-xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/54">
              Pass signal: {item.passSignal}
            </p>
            <p className="mt-2 text-xs leading-5 text-white/46">
              Boundary: {item.launchBoundary}
            </p>
          </article>
        ))}
      </div>

      <article className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white">Nick decision prompts</p>
        <ul className="mt-3 grid gap-2">
          {packet.finalDecisionPrompts.map((prompt) => (
            <li key={prompt} className="text-sm leading-6 text-white/64">
              {prompt}
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
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: NickMvpReviewStatus }) {
  const className =
    status === "ready_for_nick_review"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : "border-rose-300/30 bg-rose-300/15 text-rose-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
