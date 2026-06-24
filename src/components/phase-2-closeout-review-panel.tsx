import Link from "next/link";
import type {
  Phase2DoneCriterion,
  Phase2DoneCriterionStatus,
  Phase2CloseoutLane,
  Phase2CloseoutLaneStatus,
  Phase2CloseoutReview,
} from "@/services/phase-2-closeout-review";

type Phase2CloseoutReviewPanelProps = {
  review: Phase2CloseoutReview;
};

export function Phase2CloseoutReviewPanel({
  review,
}: Phase2CloseoutReviewPanelProps) {
  if (!review.canReadReview) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
            Phase 2 closeout
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{review.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {review.summary}
          </p>
          <p className="mt-2 text-xs leading-5 text-white/50">
            {review.packetPath}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
          <MiniStat label="Lanes" value={`${review.counts.lanes}`} />
          <MiniStat label="Review now" value={`${review.counts.reviewNow}`} />
          <MiniStat
            label="Confirm"
            value={`${review.counts.awaitingHumanConfirmation}`}
          />
          <MiniStat
            label="Blocked"
            value={`${review.counts.blockedBeforePilot}`}
          />
          <MiniStat
            label="Sends"
            value={`${review.counts.externalWritesExpected}`}
          />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white">How to use this packet</p>
        <p className="mt-2 text-sm leading-6 text-white/62">{review.reviewerAction}</p>
        <p className="mt-3 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/54">
          {review.approvalReplyHint}
        </p>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Definition of done audit</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
              These are the actual Phase 2 finish conditions, split between what is already review-ready in repo, what still needs human signoff, and what still needs hosted staging proof.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat
              label="Repo ready"
              value={`${review.counts.criteriaReviewReadyInRepo}`}
            />
            <MiniStat
              label="Need signoff"
              value={`${review.counts.criteriaAwaitingHumanConfirmation}`}
            />
            <MiniStat
              label="Need proof"
              value={`${review.counts.criteriaAwaitingHostedProof}`}
            />
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {review.doneCriteria.map((criterion) => (
            <DoneCriterionCard key={criterion.key} criterion={criterion} />
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {review.lanes.map((lane) => (
          <LaneCard key={lane.key} lane={lane} />
        ))}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <ChecklistCard
          title="Human decisions still needed"
          items={review.requiredHumanDecisions}
        />
        <ChecklistCard
          title="Blocked scope stays off"
          items={review.blockedScope}
        />
      </div>

      {review.recordedAnswers.length > 0 ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <ChecklistCard
            title="Recorded answers"
            items={review.recordedAnswers}
          />
          <article className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <h3 className="text-lg font-semibold text-white">Copy-paste approval reply</h3>
            <pre className="mt-4 whitespace-pre-wrap text-sm leading-6 text-sky-50/82">
              {review.approvalReplyBlock.join("\n")}
            </pre>
          </article>
        </div>
      ) : null}
    </section>
  );
}

function DoneCriterionCard({ criterion }: { criterion: Phase2DoneCriterion }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#07121d]/80 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h4 className="max-w-2xl text-sm font-semibold leading-6 text-white">
          {criterion.label}
        </h4>
        <CriterionStatusPill status={criterion.status} />
      </div>
      <ul className="mt-4 grid gap-2">
        {criterion.evidence.map((item) => (
          <li key={`${criterion.key}-${item}`} className="text-sm leading-6 text-white/58">
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function LaneCard({ lane }: { lane: Phase2CloseoutLane }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusPill status={lane.status} />
          <h3 className="mt-3 text-lg font-semibold text-white">{lane.label}</h3>
        </div>
        <Link
          href={lane.href}
          className="w-fit rounded-full border border-white/12 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white/76"
        >
          Open route
        </Link>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/66">{lane.summary}</p>
      <ul className="mt-4 grid gap-2">
        {lane.evidence.map((item) => (
          <li key={`${lane.key}-${item}`} className="text-sm leading-6 text-white/58">
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function ChecklistCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <ul className="mt-4 grid gap-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-white/60">
            {item}
          </li>
        ))}
      </ul>
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

function CriterionStatusPill({ status }: { status: Phase2DoneCriterionStatus }) {
  const className =
    status === "review_ready_in_repo"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : status === "awaiting_human_confirmation"
        ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
        : "border-amber-300/30 bg-amber-300/15 text-amber-100";
  const label =
    status === "review_ready_in_repo"
      ? "repo ready"
      : status === "awaiting_human_confirmation"
        ? "need signoff"
        : "need hosted proof";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function StatusPill({ status }: { status: Phase2CloseoutLaneStatus }) {
  const className =
    status === "review_now"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : status === "awaiting_human_confirmation"
        ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
        : "border-amber-300/30 bg-amber-300/15 text-amber-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
