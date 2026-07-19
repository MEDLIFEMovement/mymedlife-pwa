import Link from "next/link";
import { redirect, notFound } from "next/navigation";

import { CampaignCloseoutReadinessPanel } from "@/components/campaign-closeout-readiness-panel";
import { ChapterEngagementCampaignPanel } from "@/components/chapter-engagement-campaign-panel";
import { GrowTheMovementCampaignPanel } from "@/components/grow-the-movement-campaign-panel";
import { LeadershipTransitionCampaignPanel } from "@/components/leadership-transition-campaign-panel";
import { MovingMountainsCampaignPanel } from "@/components/moving-mountains-campaign-panel";
import { PlanningGoalSettingCampaignPanel } from "@/components/planning-goal-setting-campaign-panel";
import { SltPromotionCampaignPanel } from "@/components/slt-promotion-campaign-panel";
import { StartAChapterCampaignPanel } from "@/components/start-a-chapter-campaign-panel";
import { getCampaignCloseoutReadiness } from "@/services/campaign-closeout-readiness";
import { getCampaignShellBySlug } from "@/services/campaign-ops-service";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getChapterEngagementCampaignPlan } from "@/services/chapter-engagement-campaign";
import { getGrowTheMovementCampaignPlan } from "@/services/grow-the-movement-campaign";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getLeadershipTransitionCampaignPlan } from "@/services/leadership-transition-campaign";
import { getMovingMountainsCampaignPlan } from "@/services/moving-mountains-campaign";
import { getCampaignsRouteRedirectHref } from "@/services/owned-route-redirect";
import { getPlanningGoalSettingCampaignPlan } from "@/services/planning-goal-setting-campaign";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import { getSltPromotionCampaignPlan } from "@/services/slt-promotion-campaign";
import { getStartAChapterCampaignPlan } from "@/services/start-a-chapter-campaign";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import type { CampaignShell } from "@/shared/types/campaigns";

export const metadata = getStaticRouteMetadata("campaigns");
export const dynamic = "force-dynamic";

type CampaignPageProps = {
  params: Promise<{
    campaignSlug: string;
  }>;
};

export default async function CampaignPage({ params }: CampaignPageProps) {
  const [{ campaignSlug }, actor] = await Promise.all([
    params,
    getLocalActorContext(),
  ]);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref(`/campaigns/${campaignSlug}`));
  }

  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "member") {
    if (campaignSlug === "rush-month") {
      redirect("/rush-month");
    }

    redirect("/campaigns");
  }

  if (surfaceFamily === "ds_admin") {
    redirect(getLandingRouteForActor(actor));
  }

  const shell = getCampaignShellBySlug(campaignSlug);

  if (!shell) {
    notFound();
  }

  if (campaignSlug === "rush-month") {
    const data = await getReadOnlyAppData({ actorUserId: actor.user.id });
    const closeout = getCampaignCloseoutReadiness(actor, data, campaignSlug);

    return (
      <CampaignDetailShell
        campaign={shell}
        backHref="/campaigns"
        eyebrow="Rush Month review"
        summary="This page keeps the Rush Month shell visible while event, proof, coach, and points handoffs stay preview-safe."
        actionLinks={[
          {
            href: "/rush-month/events",
            label: "Open event loop",
            detail: "RSVP, attendance, and event context stay route-backed.",
          },
          {
            href: "/rush-month/actions",
            label: "Open action flow",
            detail: "Assignments stay visible while writes remain approval-gated.",
          },
          {
            href: "/rush-month/leaderboard",
            label: "Open points readback",
            detail: "Leaderboard movement stays read-only until production proof exists.",
          },
          {
            href: "/proof-library",
            label: "Open proof posture",
            detail: "Stories, consent, and HQ review posture stay visible without public publishing.",
          },
          {
            href: "/proof-library/upload",
            label: "Preview proof upload rules",
            detail: "Inspect storage and consent requirements while uploads remain disabled.",
          },
        ]}
      >
        <CampaignCloseoutReadinessPanel closeout={closeout} />
      </CampaignDetailShell>
    );
  }

  const detailPanel = getCampaignDetailPanel(campaignSlug, actor);

  return (
    <CampaignDetailShell
      campaign={shell}
      backHref="/campaigns"
      eyebrow="Starter campaign review"
      summary="This page keeps the starter campaign visible for planning and review while writes, sends, and provider syncs remain blocked."
    >
      {detailPanel ?? <CampaignPreviewOnlyNotice campaign={shell} />}
    </CampaignDetailShell>
  );
}

function getCampaignDetailPanel(campaignSlug: string, actor: Awaited<ReturnType<typeof getLocalActorContext>>) {
  switch (campaignSlug) {
    case "planning-goal-setting":
      return (
        <PlanningGoalSettingCampaignPanel
          plan={getPlanningGoalSettingCampaignPlan(actor)}
        />
      );
    case "chapter-engagement":
      return (
        <ChapterEngagementCampaignPanel
          plan={getChapterEngagementCampaignPlan(actor)}
        />
      );
    case "slt-promotion":
      return (
        <SltPromotionCampaignPanel
          plan={getSltPromotionCampaignPlan(actor)}
        />
      );
    case "moving-mountains":
      return (
        <MovingMountainsCampaignPanel
          plan={getMovingMountainsCampaignPlan(actor)}
        />
      );
    case "leadership-transition":
      return (
        <LeadershipTransitionCampaignPanel
          plan={getLeadershipTransitionCampaignPlan(actor)}
        />
      );
    case "grow-the-movement":
      return (
        <GrowTheMovementCampaignPanel
          plan={getGrowTheMovementCampaignPlan(actor)}
        />
      );
    case "start-a-chapter":
      return (
        <StartAChapterCampaignPanel
          plan={getStartAChapterCampaignPlan(actor)}
        />
      );
    default:
      return null;
  }
}

function CampaignDetailShell({
  campaign,
  backHref,
  eyebrow,
  summary,
  actionLinks = [],
  children,
}: {
  campaign: CampaignShell;
  backHref: string;
  eyebrow: string;
  summary: string;
  actionLinks?: Array<{
    href: string;
    label: string;
    detail: string;
  }>;
  children: React.ReactNode;
}) {
  return (
    <main
      className="min-h-screen bg-[#08131f] px-4 py-8 text-white sm:px-6"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-6xl">
        <Link
          href={backHref}
          className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/72"
        >
          Back to campaigns
        </Link>

        <div className="mt-6 rounded-[2rem] border border-white/10 bg-black/20 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/70">
            {eyebrow}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/62">
              {campaign.status.replaceAll("_", " ")}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/62">
              {campaign.family.replaceAll("_", " ")}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-white">{campaign.name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/64">{summary}</p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <InfoCard title="Student promise" body={campaign.studentPromise} />
            <InfoCard title="Operating rhythm" body={campaign.operatingRhythm} />
            <InfoCard title="Proof use" body={campaign.proofUse} />
            <InfoCard title="Coach focus" body={campaign.coachFocus} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                Campaign KPIs
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {campaign.primaryKpis.map((kpi) => (
                  <span
                    key={kpi}
                    className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/58"
                  >
                    {kpi.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            </div>
            <InfoCard title="Integration posture" body={campaign.integrationPosture} />
          </div>
        </div>

        {actionLinks.length > 0 ? (
          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {actionLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4"
              >
                <p className="text-sm font-semibold text-white">{link.label}</p>
                <p className="mt-2 text-sm leading-6 text-white/62">{link.detail}</p>
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {title}
      </p>
      <p className="mt-3 text-sm leading-6 text-white/64">{body}</p>
    </div>
  );
}

function CampaignPreviewOnlyNotice({ campaign }: { campaign: CampaignShell }) {
  return (
    <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
        Preview-only campaign shell
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        {campaign.name} stays visible, but the deeper workflow is still future-wired
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/64">
        This campaign shell is available for review and navigation context. Live publishing,
        sync, proof ingestion, invites, exports, and points movement remain blocked until a
        dedicated build slice is approved.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <InfoCard title="Current summary" body={campaign.summary} />
        <InfoCard title="Safe posture" body={campaign.integrationPosture} />
      </div>
    </section>
  );
}
