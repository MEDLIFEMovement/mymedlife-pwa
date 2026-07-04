import { StudentAppShell } from "@/components/student-app-shell";
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
import { redirect } from "next/navigation";

export const metadata = getStaticRouteMetadata("profile");
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
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
      {studentHome && recognition ? (
        <MemberProfilePanel
          chapterName={studentHome.chapterName}
          displayName={actor.user.displayName}
          workspace={workspace}
          studentHome={studentHome}
          recognition={recognition}
        />
      ) : null}
    </StudentAppShell>
  );
}
