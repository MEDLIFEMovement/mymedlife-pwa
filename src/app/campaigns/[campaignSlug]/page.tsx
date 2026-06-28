import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StudentAppShell } from "@/components/student-app-shell";
import { ChapterEngagementCampaignPanel } from "@/components/chapter-engagement-campaign-panel";
import { GrowTheMovementCampaignPanel } from "@/components/grow-the-movement-campaign-panel";
import { LeadershipTransitionCampaignPanel } from "@/components/leadership-transition-campaign-panel";
import { MetricCard } from "@/components/metric-card";
import { MovingMountainsCampaignPanel } from "@/components/moving-mountains-campaign-panel";
import { PlanningGoalSettingCampaignPanel } from "@/components/planning-goal-setting-campaign-panel";
import { RestrictedState } from "@/components/restricted-state";
import { SltPromotionCampaignPanel } from "@/components/slt-promotion-campaign-panel";
import { StartAChapterCampaignPanel } from "@/components/start-a-chapter-campaign-panel";
import { getChapterEngagementCampaignPlan } from "@/services/chapter-engagement-campaign";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  getCampaignIntegrationPosture,
  getCampaignShellBySlug,
  getEventPlansForCampaign,
  getProofLibraryItemsForCampaign,
  getVisibleCampaignShellsForActor,
} from "@/services/campaign-ops-service";
import { getGrowTheMovementCampaignPlan } from "@/services/grow-the-movement-campaign";
import { getLeadershipTransitionCampaignPlan } from "@/services/leadership-transition-campaign";
import { getMovingMountainsCampaignPlan } from "@/services/moving-mountains-campaign";
import { getCampaignsRouteRedirectHref } from "@/services/owned-route-redirect";
import { getPlanningGoalSettingCampaignPlan } from "@/services/planning-goal-setting-campaign";
import { getSltPromotionCampaignPlan } from "@/services/slt-promotion-campaign";
import { getStartAChapterCampaignPlan } from "@/services/start-a-chapter-campaign";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("campaignDetail");
export const dynamic = "force-dynamic";

type CampaignDetailPageProps = {
  params: Promise<{
    campaignSlug: string;
  }>;
};

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { campaignSlug } = await params;
  const [actor, campaign] = await Promise.all([
    getLocalActorContext(),
    Promise.resolve(getCampaignShellBySlug(campaignSlug)),
  ]);

  if (!campaign) {
    notFound();
  }

  const redirectHref = getCampaignsRouteRedirectHref(actor, {
    campaignSlug: campaign.slug,
  });

  if (redirectHref) {
    redirect(redirectHref);
  }

  const visibleCampaigns = getVisibleCampaignShellsForActor(actor);
  const canReadCampaign = visibleCampaigns.some((item) => item.slug === campaign.slug);
  const eventPlans = getEventPlansForCampaign(campaign.slug);
  const proofItems = getProofLibraryItemsForCampaign(campaign.slug);
  const integrationPosture = getCampaignIntegrationPosture(campaign.slug);
  const planningGoalSettingPlan =
    campaign.slug === "planning-goal-setting"
      ? getPlanningGoalSettingCampaignPlan(actor)
      : null;
  const chapterEngagementPlan =
    campaign.slug === "chapter-engagement"
      ? getChapterEngagementCampaignPlan(actor)
      : null;
  const sltPromotionPlan =
    campaign.slug === "slt-promotion" ? getSltPromotionCampaignPlan(actor) : null;
  const movingMountainsPlan =
    campaign.slug === "moving-mountains"
      ? getMovingMountainsCampaignPlan(actor)
      : null;
  const leadershipTransitionPlan =
    campaign.slug === "leadership-transition"
      ? getLeadershipTransitionCampaignPlan(actor)
      : null;
  const growTheMovementPlan =
    campaign.slug === "grow-the-movement"
      ? getGrowTheMovementCampaignPlan(actor)
      : null;
  const startAChapterPlan =
    campaign.slug === "start-a-chapter" ? getStartAChapterCampaignPlan(actor) : null;

  return (
    <StudentAppShell actor={actor}>
      {!canReadCampaign ? (
        <RestrictedState
          title="This campaign shell is hidden for the selected local role."
          message="Members see the active campaign only. DS Admin sees integration posture through the admin page, not campaign truth."
          nextHref="/campaigns"
          nextLabel="Back to campaigns"
        />
      ) : (
        <>
          <section className="app-surface-info overflow-hidden rounded-[2rem] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mymedlife-primary-button)]">
              {campaign.status} campaign
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">{campaign.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {campaign.summary}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {campaign.slug === "rush-month" ? (
                <Link
                  href="/rush-month"
                  className="rounded-full bg-[var(--mymedlife-badge-background)] px-4 py-2 text-sm font-semibold text-[var(--mymedlife-badge-text)]"
                >
                  Open active Rush Month loop
                </Link>
              ) : null}
              <Link
                href="/action-committees"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)] hover:text-slate-950"
              >
                See action committees
              </Link>
              <Link
                href="/proof-library"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)] hover:text-slate-950"
              >
                See proof library
              </Link>
            </div>
          </section>

          <div className="grid gap-4 rounded-[2rem] bg-[var(--mymedlife-panel-tint)] p-4 shadow-[0_18px_50px_rgb(var(--mymedlife-deep-rgb)/0.12)]">
            <section className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="Action lanes"
                value={`${campaign.actionCommitteeLanes.length}`}
                note={campaign.actionCommitteeLanes.join(", ")}
              />
              <MetricCard
                label="Event plans"
                value={`${eventPlans.length}`}
                note="Chapter-ready examples"
              />
              <MetricCard
                label="Proof items"
                value={`${proofItems.length}`}
                note="Story and proof follow-through"
              />
            </section>

            <section className="grid gap-3 lg:grid-cols-2">
              <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
                <h2 className="text-2xl font-semibold text-slate-950">Why students care</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {campaign.studentPromise}
                </p>
                <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Operating rhythm
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {campaign.operatingRhythm}
                </p>
              </article>

              <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
                <h2 className="text-2xl font-semibold text-slate-950">Proof and coaching</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{campaign.proofUse}</p>
                <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Coach focus
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{campaign.coachFocus}</p>
              </article>
            </section>

            {planningGoalSettingPlan ? (
              <PlanningGoalSettingCampaignPanel plan={planningGoalSettingPlan} />
            ) : null}

            {chapterEngagementPlan ? (
              <ChapterEngagementCampaignPanel plan={chapterEngagementPlan} />
            ) : null}

            {sltPromotionPlan ? (
              <SltPromotionCampaignPanel plan={sltPromotionPlan} />
            ) : null}

            {movingMountainsPlan ? (
              <MovingMountainsCampaignPanel plan={movingMountainsPlan} />
            ) : null}

            {leadershipTransitionPlan ? (
              <LeadershipTransitionCampaignPanel plan={leadershipTransitionPlan} />
            ) : null}

            {growTheMovementPlan ? (
              <GrowTheMovementCampaignPanel plan={growTheMovementPlan} />
            ) : null}

            {startAChapterPlan ? (
              <StartAChapterCampaignPanel plan={startAChapterPlan} />
            ) : null}

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
              <h2 className="text-2xl font-semibold text-slate-950">Primary KPIs</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {campaign.primaryKpis.map((kpi) => (
                  <span
                    key={kpi}
                    className="rounded-full border border-[var(--mymedlife-primary-button)]/30 bg-[var(--mymedlife-badge-background)] px-3 py-1 text-sm text-[var(--mymedlife-info)]"
                  >
                    {kpi.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
              <h2 className="text-2xl font-semibold text-slate-950">Chapter event examples</h2>
              <div className="mt-4 grid gap-3">
                {eventPlans.map((eventPlan) => (
                  <article
                    key={eventPlan.id}
                    className="rounded-2xl border border-slate-200 bg-[var(--mymedlife-badge-background)] p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-primary-button)]">
                      {eventPlan.eventType.replaceAll("_", " ")} / {eventPlan.lumaStatus.replaceAll("_", " ")}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">
                      {eventPlan.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {eventPlan.expectedStudentAction}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Proof prompt: {eventPlan.proofPrompt}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-[var(--mymedlife-info-surface)] p-5 shadow-[0_10px_30px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
                Ecosystem boundaries
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Keep broader routing on hold for this campaign.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {campaign.integrationPosture} Broader routing posture:{" "}
                {integrationPosture.safeToSendExternally ? "open" : "held for later"}.
              </p>
              <div className="mt-4 grid gap-3">
                {integrationPosture.events.slice(0, 4).map((event) => (
                  <article
                    key={event.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{event.title}</p>
                        <p className="mt-1 font-mono text-xs text-[var(--mymedlife-info)]">
                          {event.eventType} / {event.destination}
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-[var(--mymedlife-badge-background)] px-2 py-1 text-xs text-slate-600">
                        {event.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{event.detail}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </StudentAppShell>
  );
}
