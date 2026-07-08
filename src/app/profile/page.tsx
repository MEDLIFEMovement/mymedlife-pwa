import { MemberBottomNav } from "@/components/member-bottom-nav";
import { StudentAppShell } from "@/components/student-app-shell";
import { MemberProfilePanel } from "@/components/member-profile-panel";
import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { WorkspacePreviewBanner } from "@/components/workspace-preview-banner";
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
  }>;
};

function getProfileSource(source?: string): "home" | null {
  return source === "home" ? "home" : null;
}

export default async function ProfilePage(props: ProfilePageProps) {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const resolvedSearchParams: { source?: string } = await (
    props.searchParams ?? Promise.resolve({})
  );
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
    <StudentAppShell
      actor={actor}
      hideTopHeader
      showMobileQuickItemHelpers={false}
      showDebugTools={false}
    >
      <div className="pb-24">
        <WorkspaceAccountMenu actor={actor} currentWorkspace="student_app" />
        {isPreviewWorkspaceAccess(actor, "student_app") ? (
          <WorkspacePreviewBanner workspaceLabel="the General Student App" />
        ) : null}
        {studentHome && recognition ? (
          <MemberProfilePanel
            chapterName={studentHome.chapterName}
            displayName={actor.user.displayName}
            entrySource={getProfileSource(resolvedSearchParams.source)}
            workspace={workspace}
            studentHome={studentHome}
            recognition={recognition}
          />
        ) : null}
      </div>
      <MemberBottomNav activeTab="profile" />
    </StudentAppShell>
  );
}
