import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CampaignCloseoutReadinessPanel } from "@/components/campaign-closeout-readiness-panel";
import { DataSourceNotice } from "@/components/data-source-notice";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { MetricCard } from "@/components/metric-card";
import { RestrictedState } from "@/components/restricted-state";
import { RoleNextActionPanel } from "@/components/role-next-action-panel";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import {
  getEventPlansForCampaign,
  getProofLibraryItemsForCampaign,
} from "@/services/campaign-ops-service";
import { getCampaignCloseoutReadiness } from "@/services/campaign-closeout-readiness";
import { getRoleNextActionBrief } from "@/services/role-next-actions";
import {
  canReadChapterData,
  canReadIntegrationOutbox,
  getVisibleAssignmentsForActor,
  getVisibleRiskFlagsForActor,
} from "@/services/role-visibility";

export const dynamic = "force-dynamic";

export default async function RushMonthPage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const visibleAssignments = getVisibleAssignmentsForActor(actor, data.assignments);
  const visibleRisks = getVisibleRiskFlagsForActor(actor, data.riskFlags);
  const rushEventPlans = getEventPlansForCampaign("rush-month");
  const rushProofItems = getProofLibraryItemsForCampaign("rush-month");
  const nextActionBrief = getRoleNextActionBrief(actor, data);
  const closeout = getCampaignCloseoutReadiness(actor, data);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <RoleNextActionPanel brief={nextActionBrief} />

      {!canReadChapterData(actor) ? (
        <RestrictedState
          title="DS Admin can inspect automation posture, not campaign truth."
          message="Rush Month progress, assignments, points, and KPIs stay owned by the app and chapter roles. DS Admin can use the admin page to inspect disabled/mock outbox rows."
          nextHref="/admin"
          nextLabel="Open integration outbox"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
              Active campaign
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-white">{data.campaign.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
              {data.campaign.objective}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/rush-month/dashboard"
                className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
              >
                Open Rush dashboard
              </Link>
              <Link
                href="/rush-month/actions"
                className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white"
              >
                See visible actions
              </Link>
              <Link
                href="/rush-month/review"
                className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white"
              >
                Open role-aware follow-up
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Visible actions"
              value={`${visibleAssignments.length}`}
              note={`${actor.audienceLabel} read scope`}
            />
            <MetricCard
              label="Proof pending"
              value={`${visibleAssignments.filter((item) => item.status === "submitted" || item.status === "changes_requested").length}`}
              note="Visible testimonials/proof to route"
            />
            <MetricCard
              label="Coach read"
              value={data.kpiSummary.coachDecision}
              note="Mock decision state only"
            />
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Campaign lanes"
              value={`${data.campaignRoleAssignments.length}`}
              note="Read-only officer/action lanes"
            />
            <MetricCard
              label="Readiness reviews"
              value={`${data.readinessReviews.length}`}
              note="Local Supabase-ready gate records"
            />
            <MetricCard
              label="Visible risk flags"
              value={`${visibleRisks.length}`}
              note="Filtered by role boundary"
            />
          </section>

          <CampaignCloseoutReadinessPanel closeout={closeout} />

          <section className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-2xl font-semibold text-white">Rush Month events</h2>
              <p className="mt-2 text-sm leading-6 text-white/66">
                Action committees should create real student moments during
                Rush Month: socials, Med Talks, invite pushes, and follow-up.
              </p>
              <div className="mt-4 grid gap-3">
                {rushEventPlans.map((eventPlan) => (
                  <div key={eventPlan.id} className="rounded-2xl bg-black/20 p-3">
                    <p className="text-sm font-semibold text-white">{eventPlan.title}</p>
                    <p className="mt-1 text-xs text-white/54">
                      {eventPlan.timing} / {eventPlan.lumaStatus.replaceAll("_", " ")}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-2xl font-semibold text-white">Rush Month proof</h2>
              <p className="mt-2 text-sm leading-6 text-white/66">
                Proof should answer the fear underneath the action: Will I fit
                in? Is this worth my time? Can my chapter really do this?
              </p>
              <div className="mt-4 grid gap-3">
                {rushProofItems.map((proofItem) => (
                  <div key={proofItem.id} className="rounded-2xl bg-black/20 p-3">
                    <p className="text-sm font-semibold text-white">{proofItem.sourceLabel}</p>
                    <p className="mt-1 text-xs text-white/54">
                      Addresses: {proofItem.hesitationAddressed}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
            <h2 className="text-2xl font-semibold text-white">This week operating path</h2>
            <ol className="mt-4 grid gap-3">
              {[
                "Leader opens Rush Month and assigns the first outreach owners.",
                "Members run the invite push and submit action updates or testimonial/proof notes.",
                "Leaders track completion while HQ decides what testimonial/proof should be shared later.",
                "Points and KPI summaries update from approved action events.",
                "Coach reads advance / hold / intervene before the next push.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3 rounded-2xl bg-black/20 p-3 text-sm text-white/72">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-300/15 font-semibold text-emerald-100">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </>
      )}

      {canReadIntegrationOutbox(actor) ? (
        <EventOutboxLog events={data.integrationEvents} outboxItems={data.outboxItems} />
      ) : (
        <RestrictedState
          eyebrow="Automation visibility"
          title="Integration outbox hidden for this role."
          message="Only DS Admin and Super Admin can inspect disabled/mock outbox records in this local proof. Real external writes remain off for every role."
        />
      )}
    </AppShell>
  );
}
