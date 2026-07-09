import { MemberBottomNav } from "@/components/member-bottom-nav";
import { MemberProfilePanel } from "@/components/member-profile-panel";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import { getMvpMemberHome } from "@/services/mvp-event-tracking-workspace";
import { getProfileWorkspace } from "@/services/profile-workspace";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { canAccessMemberWorkspace } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { isPreviewWorkspaceAccess } from "@/services/workspace-access";
import { redirect } from "next/navigation";

export const metadata = getStaticRouteMetadata("profile");
export const dynamic = "force-dynamic";

type ProfilePageProps = {
  searchParams?: Promise<{
    source?: string;
    event?: string;
    campaign?: string;
  }>;
};

function getProfileSource(source?: string): "home" | "points" | null {
  if (source === "home" || source === "points") {
    return source;
  }

  return null;
}

export default async function ProfilePage(props: ProfilePageProps) {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const resolvedSearchParams: { source?: string; event?: string; campaign?: string } = await (
    props.searchParams ?? Promise.resolve({})
  );
  const profileSource = getProfileSource(resolvedSearchParams.source);
  const profileEventId = resolvedSearchParams.event ?? null;
  const profileCampaign = resolvedSearchParams.campaign ?? null;
  const workspace = getProfileWorkspace(actor, data);
  const isMemberProfile = canAccessMemberWorkspace(actor);
  const studentHome = isMemberProfile
    ? getMvpMemberHome(actor, data)
    : null;
  const recognition = isMemberProfile
    ? getMemberRecognitionSummary(actor, data)
    : null;

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/profile"));
  }

  if (!isMemberProfile) {
    redirect(getLandingRouteForActor(actor));
  }

  return (
    <main className="min-h-screen bg-[#d6e0f0] px-0 py-0 text-[#10223f] md:px-4 md:py-8">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-white md:min-h-0 md:rounded-[44px] md:border-4 md:border-white/40 md:shadow-2xl">
        <div className="flex-1 overflow-y-auto pb-24">
          {studentHome && recognition ? (
            <MemberProfilePanel
              chapterName={studentHome.chapterName}
              displayName={actor.user.displayName}
              entrySource={profileSource}
              entryEventId={profileEventId}
              entryCampaign={profileCampaign}
              isPreviewMode={isPreviewWorkspaceAccess(actor, "student_app")}
              workspace={workspace}
              studentHome={studentHome}
              recognition={recognition}
            />
          ) : null}
        </div>
        <MemberBottomNav
          activeTab="profile"
          hrefOverrides={{
            events: buildProfileEventsHref(profileSource, profileEventId, profileCampaign),
            points: buildProfilePointsHref(profileSource, profileEventId, profileCampaign),
          }}
        />
      </div>
    </main>
  );
}

function buildProfileEventsHref(
  source: "home" | "points" | null,
  eventId: string | null,
  campaign: string | null,
) {
  const url = new URL(
    `https://mymedlife.local${
      eventId
        ? `/app/events/${eventId}?source=${source === "home" ? "home" : "profile"}`
        : "/app/events?source=profile"
    }`,
  );

  if (source === "points") {
    url.searchParams.set("profileSource", "points");
  }

  if (campaign) {
    url.searchParams.set("campaign", campaign);
  }

  return `${url.pathname}${url.search}`;
}

function buildProfilePointsHref(
  source: "home" | "points" | null,
  eventId: string | null,
  campaign: string | null,
) {
  const url = new URL(
    `https://mymedlife.local${
      source === "points"
        ? "/app/points?source=points"
        : source === "home"
          ? "/app/points?source=home"
          : "/app/points?source=profile"
    }`,
  );

  if (eventId) {
    url.searchParams.set("event", eventId);
  }

  if (campaign) {
    url.searchParams.set("campaign", campaign);
  }

  return `${url.pathname}${url.search}`;
}
