import { StudentAppShell } from "@/components/student-app-shell";
import { CampaignCard } from "@/components/campaign-card";
import { CampaignStarterShellReadinessPanel } from "@/components/campaign-starter-shell-readiness-panel";
import { MemberRushMonthCampaignPanel } from "@/components/member-rush-month-campaign-panel";
import { MetricCard } from "@/components/metric-card";
import { RestrictedState } from "@/components/restricted-state";
import { redirect } from "next/navigation";
import { getCampaignStarterShellReadiness } from "@/services/campaign-starter-shell-readiness";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getMemberRushMonthCampaignOverview } from "@/services/member-rush-month-campaign-overview";
import {
  getCampaignReadinessSummary,
  getVisibleCampaignShellsForActor,
} from "@/services/campaign-ops-service";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { isMemberSurfaceFamily } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getCampaignsRouteRedirectHref } from "@/services/owned-route-redirect";

export const metadata = getStaticRouteMetadata("campaigns");
export const dynamic = "force-dynamic";

type CampaignsPageProps = {
  searchParams?: Promise<{
    role?: string;
    source?: string;
  }>;
};

export default async function CampaignsPage({
  searchParams,
}: CampaignsPageProps) {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const isMemberCampaignSurface = isMemberSurfaceFamily(actor);
  const redirectHref = getCampaignsRouteRedirectHref(actor);

  if (redirectHref) {
    redirect(redirectHref);
  }

  const visibleCampaigns = getVisibleCampaignShellsForActor(actor);
  const summary = getCampaignReadinessSummary();
  const starterShellReadiness = getCampaignStarterShellReadiness(actor);
  const memberOverview = isMemberCampaignSurface
    ? getMemberRushMonthCampaignOverview(actor, data)
    : null;
  const memberCampaignSource = parseMemberCampaignSource(resolvedSearchParams?.source);

  return (
    <StudentAppShell
      actor={actor}
      hideTopHeader={isMemberCampaignSurface}
      showMobileQuickItemHelpers={!isMemberCampaignSurface}
      showDebugTools={!isMemberCampaignSurface}
    >
      {isMemberCampaignSurface && memberOverview ? (
        <>
          <MemberRushMonthCampaignPanel
            overview={memberOverview}
            selectedRoleId={resolvedSearchParams?.role}
            source={memberCampaignSource}
          />
        </>
      ) : (
        <>
          <section className="app-surface-info overflow-hidden rounded-[2rem] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mymedlife-primary-button)]">
              Campaign library
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">
              Campaigns turn chapter goals into student action.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              This library holds the chapter playbooks behind Rush Month and the
              next campaign lanes. Each campaign should clarify what students do,
              what action committees organize, what proof matters, which KPIs move,
              and what follow-through belongs later in the broader ecosystem.
            </p>
          </section>

          <div className="grid gap-4 rounded-[2rem] bg-[var(--mymedlife-panel-tint)] p-4 shadow-[0_18px_50px_rgb(var(--mymedlife-deep-rgb)/0.12)]">
            <section className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="Active"
                value={`${summary.activeCampaigns}`}
                note="Ready for the current chapter rhythm"
              />
              <MetricCard
                label="Planned"
                value={`${summary.plannedCampaigns}`}
                note="Next campaign lanes to shape"
              />
              <MetricCard
                label="Templates"
                value={`${summary.templateCampaigns}`}
                note="Reusable chapter playbooks"
              />
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="Events in motion"
                value={`${summary.linkedMockEvents}`}
                note="Connected to campaign plans"
              />
              <MetricCard
                label="Proof for review"
                value={`${summary.hqProofItems}`}
                note="Ready for sharing review"
              />
              <MetricCard
                label="Held handoffs"
                value={`${summary.disabledIntegrationEvents}`}
                note="Broader ecosystem stays paused"
              />
            </section>

            <CampaignStarterShellReadinessPanel readiness={starterShellReadiness} />

            {visibleCampaigns.length > 0 ? (
              <section className="grid gap-3 lg:grid-cols-2">
                {visibleCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.slug} campaign={campaign} />
                ))}
              </section>
            ) : (
              <RestrictedState
                title="Campaign truth is hidden for DS Admin."
                message="DS Admin can inspect disabled integration posture on the admin page, but does not own campaign status, student actions, proof, points, or KPIs."
                nextHref="/admin"
                nextLabel="Open integration posture"
              />
            )}
          </div>
        </>
      )}
    </StudentAppShell>
  );
}

function parseMemberCampaignSource(value: string | undefined) {
  switch (value) {
    case "home":
    case "campaigns":
    case "events":
    case "points":
    case "profile":
      return value;
    default:
      return null;
  }
}
