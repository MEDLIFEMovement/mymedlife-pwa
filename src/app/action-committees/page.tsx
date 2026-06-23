import Link from "next/link";
import { ActionCommitteeWorkspacePanel } from "@/components/action-committee-workspace-panel";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  getActionCommittees,
  getChapterEventPlans,
  getCommitteeWorkspaceForActor,
  getCommitteeOperatingSummary,
  getEventPlansForCommittee,
} from "@/services/campaign-ops-service";
import { canReadChapterData } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("actionCommittees");
export const dynamic = "force-dynamic";

type ActionCommitteesPageProps = {
  searchParams?: Promise<{
    returnTo?: string;
    source?: string;
  }>;
};

export default async function ActionCommitteesPage({
  searchParams,
}: ActionCommitteesPageProps) {
  const actor = await getLocalActorContext();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const chapterCommitteeContext = getChapterCommitteeSourceContext(
    resolvedSearchParams?.source,
    resolvedSearchParams?.returnTo,
  );
  const committees = getActionCommittees();
  const eventPlans = getChapterEventPlans();
  const mockLinkedEvents = eventPlans.filter(
    (eventPlan) => eventPlan.lumaStatus === "mock_linked",
  );
  const workspace = getCommitteeWorkspaceForActor(actor, committees, eventPlans);

  return (
    <AppShell actor={actor}>
      {!canReadChapterData(actor) ? (
        <RestrictedState
          title="Action committee truth is hidden for DS Admin."
          message="Committees own student action and chapter execution. DS Admin can inspect disabled integration posture, but does not own event, assignment, proof, or KPI truth."
          nextHref="/admin"
          nextLabel="Open integration outbox"
        />
      ) : (
        <>
          {chapterCommitteeContext ? (
            <section className="rounded-[2rem] border border-[#bfdbfe] bg-[#f8fbff] p-5">
              <p className="app-eyebrow app-eyebrow-blue">{chapterCommitteeContext.eyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {chapterCommitteeContext.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {chapterCommitteeContext.detail}
              </p>
              <a
                href={chapterCommitteeContext.href}
                className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
              >
                {chapterCommitteeContext.backLabel}
              </a>
            </section>
          ) : null}
          <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#0a3b88_0%,#0b4f9b_58%,#081a3a_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.32)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d05e]">
              Action committees
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              The chapter should be doing things, not just holding meetings.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78">
              Action committees turn campaign SOPs into concrete events:
              fundraisers, local volunteering, Med Talks, socials, SLT proof
              nights, and follow-up pushes. Each event should have an owner,
              a student action, feedback, proof, and a coach-readable outcome.
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Committees"
              value={`${committees.length}`}
              note="Reusable student action lanes"
            />
            <MetricCard
              label="Event plans"
              value={`${eventPlans.length}`}
              note="Mock-local chapter events"
            />
            <MetricCard
              label="Mock Luma links"
              value={`${mockLinkedEvents.length}`}
              note="No Luma API write"
            />
          </section>

          <ActionCommitteeWorkspacePanel summary={workspace} />

          <section className="grid gap-3 lg:grid-cols-2">
            {committees.map((committee) => {
              const committeeEvents = getEventPlansForCommittee(committee.id);

              return (
                <article
                  key={committee.id}
                  className="app-surface rounded-[1.7rem] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]"
                >
                  <p className="app-eyebrow app-eyebrow-blue">
                    {committee.lane}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-950">{committee.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{committee.purpose}</p>
                  <p className="app-surface-soft mt-3 rounded-[1.1rem] p-3 text-sm leading-6 text-slate-600">
                    {getCommitteeOperatingSummary(committee)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {committee.sampleMonthlyActions.map((action) => (
                      <span
                        key={action}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                  {committeeEvents[0] ? (
                    <Link
                      href={`/campaigns/${committeeEvents[0].campaignSlug}`}
                      className="mt-4 inline-flex text-sm font-semibold text-[#2563eb]"
                    >
                      Open related campaign
                    </Link>
                  ) : null}
                </article>
              );
            })}
          </section>

          <section className="app-surface rounded-[2rem] p-5">
            <h2 className="text-2xl font-semibold text-slate-950">Event operating examples</h2>
            <div className="mt-4 grid gap-3">
              {eventPlans.map((eventPlan) => (
                <article key={eventPlan.id} className="app-surface-soft rounded-[1.25rem] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="app-eyebrow app-eyebrow-blue">
                        {eventPlan.timing} / {eventPlan.eventType.replaceAll("_", " ")}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">{eventPlan.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {eventPlan.expectedStudentAction}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                      {eventPlan.lumaStatus.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p className="rounded-[1.05rem] bg-white p-3 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
                      Feedback: {eventPlan.feedbackPlan}
                    </p>
                    <p className="rounded-[1.05rem] bg-white p-3 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
                      Proof: {eventPlan.proofPrompt}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

function getChapterCommitteeSourceContext(
  source: string | undefined,
  returnTo: string | undefined,
) {
  if (source !== "chapter_add_committee") {
    return null;
  }

  return {
    eyebrow: "From chapter committees",
    title: "The committee health lane is still the review context.",
    detail:
      "Use the broader committee workspace without losing chapter-owned committee health, ownership, or operating posture from the command center.",
    href: normalizeChapterCommitteeReturnTo(returnTo),
    backLabel: "Back to chapter committees",
  };
}

function normalizeChapterCommitteeReturnTo(value: string | undefined) {
  if (!value) {
    return "/chapter?view=committees";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/chapter?view=committees";
  }

  return value;
}
