import { AppShell } from "@/components/app-shell";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { RestrictedState } from "@/components/restricted-state";
import { getLandingRouteForActor } from "@/services/landing-route";
import { StaffCommandCenterPanel } from "@/components/staff-command-center-panel";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getStaffCommandCenter } from "@/services/staff-command-center";

export const metadata = getStaticRouteMetadata("staff");
export const dynamic = "force-dynamic";

type StaffPageProps = {
  searchParams?: Promise<{
    bestPractice?: string;
    campaign?: string;
    campaignRisk?: string;
    chapter?: string;
    coach?: string;
    country?: string;
    decision?: string;
    portfolioCampaign?: string;
    proof?: string;
    proofQueue?: string;
    proofType?: string;
    feedAudience?: string;
    feedDraft?: string;
    feedPost?: string;
    hubspotChapter?: string;
    practiceCampaign?: string;
    practiceCountry?: string;
    feedRole?: string;
    q?: string;
    risk?: string;
    source?: string;
    view?: string;
  }>;
};

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const emptySearchParams: {
    bestPractice?: string;
    campaign?: string;
    campaignRisk?: string;
    chapter?: string;
    coach?: string;
    country?: string;
    decision?: string;
    portfolioCampaign?: string;
    proof?: string;
    proofQueue?: string;
    proofType?: string;
    feedAudience?: string;
    feedDraft?: string;
    feedPost?: string;
    hubspotChapter?: string;
    practiceCampaign?: string;
    practiceCountry?: string;
    feedRole?: string;
    q?: string;
    risk?: string;
    source?: string;
    view?: string;
  } = {};
  const [data, actor, search] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const commandCenter = getStaffCommandCenter(actor, data, {
    routeBase: "/staff",
    campaign: search.campaign,
    campaignRisk: search.campaignRisk,
    bestPractice: search.bestPractice,
    chapterId: search.chapter,
    coach: search.coach,
    country: search.country,
    decision: search.decision,
    portfolioCampaign: search.portfolioCampaign,
    proof: search.proof,
    proofQueue: search.proofQueue,
    proofType: search.proofType,
    feedAudience: search.feedAudience,
    feedDraft: search.feedDraft,
    feedPost: search.feedPost,
    hubspotChapter: search.hubspotChapter,
    practiceCampaign: search.practiceCampaign,
    practiceCountry: search.practiceCountry,
    feedRole: search.feedRole,
    query: search.q,
    risk: search.risk,
    source: search.source,
    view: search.view,
  });
  const surfaceFamily = getActorSurfaceFamily(actor);
  const restrictedNextHref = getLandingRouteForActor(actor);
  const restrictedNextLabel =
    surfaceFamily === "ds_admin"
      ? "Open admin safety review"
      : surfaceFamily === "leader"
        ? "Open chapter home"
        : surfaceFamily === "member"
          ? "Open student home"
          : "Open your owned surface";

  return (
    <AppShell
      actor={actor}
      hideTopHeader={commandCenter.canReadCommandCenter}
      showDebugTools={!commandCenter.canReadCommandCenter}
    >
      {commandCenter.canReadCommandCenter ? (
        <>
          <StaffCommandCenterPanel commandCenter={commandCenter} />

          {commandCenter.selectedView === "admin" &&
          commandCenter.canReadDetailedOutbox ? (
            <EventOutboxLog
              events={data.integrationEvents}
              outboxItems={data.outboxItems}
            />
          ) : null}
        </>
      ) : (
        <>
          <RestrictedState
            title="This staff command center is not visible to this role."
            message="Members and chapter leaders should use their student or chapter operating routes. DS Admin should keep using the admin safety lanes for integration and outbox review."
            nextHref={restrictedNextHref}
            nextLabel={restrictedNextLabel}
          />
        </>
      )}
    </AppShell>
  );
}
