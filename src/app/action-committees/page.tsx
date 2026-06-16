import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  getActionCommittees,
  getChapterEventPlans,
  getCommitteeOperatingSummary,
  getEventPlansForCommittee,
} from "@/services/campaign-ops-service";
import { canReadChapterData } from "@/services/role-visibility";

export const dynamic = "force-dynamic";

export default async function ActionCommitteesPage() {
  const actor = await getLocalActorContext();
  const committees = getActionCommittees();
  const eventPlans = getChapterEventPlans();
  const mockLinkedEvents = eventPlans.filter(
    (eventPlan) => eventPlan.lumaStatus === "mock_linked",
  );

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
          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
              Action committees
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              The chapter should be doing things, not just holding meetings.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
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

          <section className="grid gap-3 lg:grid-cols-2">
            {committees.map((committee) => {
              const committeeEvents = getEventPlansForCommittee(committee.id);

              return (
                <article key={committee.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/70">
                    {committee.lane}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{committee.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/64">{committee.purpose}</p>
                  <p className="mt-3 rounded-2xl bg-black/20 p-3 text-sm leading-6 text-white/68">
                    {getCommitteeOperatingSummary(committee)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {committee.sampleMonthlyActions.map((action) => (
                      <span
                        key={action}
                        className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/68"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                  {committeeEvents[0] ? (
                    <Link
                      href={`/campaigns/${committeeEvents[0].campaignSlug}`}
                      className="mt-4 inline-flex text-sm font-semibold text-emerald-100"
                    >
                      Open related campaign
                    </Link>
                  ) : null}
                </article>
              );
            })}
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
            <h2 className="text-2xl font-semibold text-white">Event operating examples</h2>
            <div className="mt-4 grid gap-3">
              {eventPlans.map((eventPlan) => (
                <article key={eventPlan.id} className="rounded-2xl bg-black/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/70">
                        {eventPlan.timing} / {eventPlan.eventType.replaceAll("_", " ")}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{eventPlan.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/64">
                        {eventPlan.expectedStudentAction}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/68">
                      {eventPlan.lumaStatus.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-white/64 sm:grid-cols-2">
                    <p className="rounded-2xl bg-white/[0.04] p-3">
                      Feedback: {eventPlan.feedbackPlan}
                    </p>
                    <p className="rounded-2xl bg-white/[0.04] p-3">
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
