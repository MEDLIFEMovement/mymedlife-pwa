import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { LocalActorNotice } from "@/components/local-actor-notice";
import { LocalRoleSwitcher } from "@/components/local-role-switcher";
import { MetricCard } from "@/components/metric-card";
import { RestrictedState } from "@/components/restricted-state";
import { RoleNextActionPanel } from "@/components/role-next-action-panel";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getRoleNextActionBrief } from "@/services/role-next-actions";
import {
  canReadChapterData,
  getVisibleAssignmentsForActor,
} from "@/services/role-visibility";

export const dynamic = "force-dynamic";

export default async function ChapterPage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const visibleAssignments = getVisibleAssignmentsForActor(actor, data.assignments);
  const progress = getProgressCounts(visibleAssignments);
  const nextActionBrief = getRoleNextActionBrief(actor, data);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <LocalActorNotice actor={actor} />
      <LocalRoleSwitcher actor={actor} />
      <RoleNextActionPanel brief={nextActionBrief} />

      {!canReadChapterData(actor) ? (
        <RestrictedState
          title="DS Admin does not own chapter truth."
          message="This local role can inspect integration and outbox posture, but it should not read member assignments, points, or chapter operating KPIs."
          nextHref="/admin"
          nextLabel="Open integration outbox"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
              Chapter home
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{data.chapter.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
              {data.chapter.campus} in the {data.chapter.region} region. Coach:
              {" "}
              {data.chapter.coachName}. This read-only page shows the chapter
              context allowed for {actor.audienceLabel.toLowerCase()}.
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Current campaign" value={data.campaign.name} note={data.campaign.weekLabel} />
            <MetricCard
              label="Visible progress"
              value={`${progress.approved}/${progress.total}`}
              note={`${actor.audienceLabel} assignment view`}
            />
            <MetricCard
              label="Visible points"
              value={`${visibleAssignments.reduce((total, assignment) => total + assignment.points, 0)}`}
              note="Read-only points available in this role view"
            />
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
            <h2 className="text-2xl font-semibold text-white">Start here</h2>
            <p className="mt-2 text-sm leading-6 text-white/66">
              Rush Month is active. Members see their own next actions,
              leaders see team follow-up, coaches read readiness, and HQ staff
              see support context without turning on app writes.
            </p>
            <Link
              href="/rush-month"
              className="mt-4 inline-flex rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
            >
              Open Rush Month
            </Link>
          </section>

          <section className="grid gap-3 lg:grid-cols-3">
            {[
              {
                href: "/campaigns",
                title: "Campaigns",
                copy: "Review the operating shells that turn chapter SOPs into student action.",
              },
              {
                href: "/action-committees",
                title: "Action committees",
                copy: "See how committees organize events, assign owners, and collect feedback/proof.",
              },
              {
                href: "/proof-library",
                title: "Proof library",
                copy: "Preview how testimonials and bridge videos become belief-building assets after HQ review.",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 transition hover:border-emerald-300/30 hover:bg-emerald-300/10"
              >
                <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/64">{item.copy}</p>
              </Link>
            ))}
          </section>
        </>
      )}
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
