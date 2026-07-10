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
    storyFilter?: string;
  }>;
};

function getProfileSource(source?: string): "home" | "points" | "stories" | null {
  if (source === "home" || source === "points" || source === "stories") {
    return source;
  }

  return null;
}

export default async function ProfilePage(props: ProfilePageProps) {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const resolvedSearchParams: { source?: string; event?: string; campaign?: string; storyFilter?: string } = await (
    props.searchParams ?? Promise.resolve({})
  );
  const profileSource = getProfileSource(resolvedSearchParams.source);
  const profileEventId = resolvedSearchParams.event ?? null;
  const profileCampaign = resolvedSearchParams.campaign ?? null;
  const profileStoryFilter = resolvedSearchParams.storyFilter ?? null;
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
              entryStoryFilter={profileStoryFilter}
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
            stories: buildProfileStoriesHref(profileSource, profileStoryFilter),
            events: buildProfileEventsHref(profileSource, profileEventId, profileCampaign, profileStoryFilter),
            points: buildProfilePointsHref(profileSource, profileEventId, profileCampaign, profileStoryFilter),
          }}
        />
      </div>
    </main>
  );
}

function buildProfileEventsHref(
  source: "home" | "points" | "stories" | null,
  eventId: string | null,
  campaign: string | null,
  storyFilter: string | null,
) {
  if (source === "stories") {
    const url = new URL(
      `https://mymedlife.local${eventId ? `/app/events/${eventId}?source=stories` : "/app/events?source=stories"}`,
    );

    if (campaign && campaign !== "All") {
      url.searchParams.set("campaign", campaign);
    }

    if (storyFilter) {
      url.searchParams.set("storyFilter", storyFilter);
    }

    return `${url.pathname}${url.search}`;
  }

  if (!eventId) {
    const url = new URL(
      `https://mymedlife.local/app/events?source=${source === "home" ? "home" : "profile"}`,
    );
    if (campaign && campaign !== "All") {
      url.searchParams.set("campaign", campaign);
    }
    return `${url.pathname}${url.search}`;
  }

  const url = new URL(
    `https://mymedlife.local/app/events/${eventId}?source=${source === "home" ? "home" : "profile"}`,
  );

  if (source === "points") {
    url.searchParams.set("profileSource", "points");
  }

  if (campaign && campaign !== "All") {
    url.searchParams.set("campaign", campaign);
  }

  return `${url.pathname}${url.search}`;
}

function buildProfilePointsHref(
  source: "home" | "points" | "stories" | null,
  eventId: string | null,
  campaign: string | null,
  storyFilter: string | null,
) {
  const url = new URL(
    `https://mymedlife.local${
      source === "points"
        ? "/app/points?source=points"
        : source === "home"
          ? "/app/points?source=home"
          : source === "stories"
            ? "/app/points?source=stories"
          : "/app/points?source=profile"
    }`,
  );

  if (eventId) {
    url.searchParams.set("event", eventId);
  }

  if (campaign && campaign !== "All") {
    url.searchParams.set("campaign", campaign);
  }

  if (source === "stories" && storyFilter) {
    url.searchParams.set("storyFilter", storyFilter);
  }

  return `${url.pathname}${url.search}`;
}

function buildProfileStoriesHref(
  source: "home" | "points" | "stories" | null,
  storyFilter: string | null,
) {
  if (source !== "stories") {
    return "/app/stories";
  }

  const url = new URL("https://mymedlife.local/app/stories");

  if (storyFilter) {
    url.searchParams.set("filter", storyFilter);
  }

  return `${url.pathname}${url.search}`;
}
