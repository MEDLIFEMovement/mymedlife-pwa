import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { LocalActorNotice } from "@/components/local-actor-notice";
import { MetricCard } from "@/components/metric-card";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";

export default async function ChapterPage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const progress = getProgressCounts(data.assignments);

  return (
    <AppShell>
      <DataSourceNotice source={data.source} />
      <LocalActorNotice actor={actor} />

      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          Chapter home
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{data.chapter.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
          {data.chapter.campus} in the {data.chapter.region} region. Coach:
          {" "}
          {data.chapter.coachName}. This page is the chapter front door for the
          current campaign and action loop.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Current campaign" value={data.campaign.name} note={data.campaign.weekLabel} />
        <MetricCard
          label="Progress"
          value={`${progress.approved}/${progress.total}`}
          note="Approved actions this week"
        />
        <MetricCard
          label="Points"
          value={`${data.pointsSummary.earned}/${data.pointsSummary.available}`}
          note="Mock points from completed actions"
        />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
        <h2 className="text-2xl font-semibold text-white">Start here</h2>
        <p className="mt-2 text-sm leading-6 text-white/66">
          Rush Month is active. Leaders assign work, members submit action
          updates and testimonial/proof notes, and coaches review the advance /
          hold / intervene state.
        </p>
        <Link
          href="/rush-month"
          className="mt-4 inline-flex rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
        >
          Open Rush Month
        </Link>
      </section>
    </AppShell>
  );
}

function getProgressCounts(assignments: { status: string }[]) {
  const approved = assignments.filter((assignment) => assignment.status === "approved");
  const pendingReview = assignments.filter((assignment) => assignment.status === "submitted");
  const needsWork = assignments.filter(
    (assignment) =>
      assignment.status === "not_started" ||
      assignment.status === "in_progress" ||
      assignment.status === "changes_requested",
  );

  return {
    approved: approved.length,
    pendingReview: pendingReview.length,
    needsWork: needsWork.length,
    total: assignments.length,
  };
}
