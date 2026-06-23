import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ChapterMembershipWorkspacePanel } from "@/components/chapter-membership-workspace-panel";
import { DataSourceNotice } from "@/components/data-source-notice";
import { MembershipApprovalServerActionPanel } from "@/components/membership-approval-server-action-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getChapterMemberRoleFocus } from "@/services/chapter-member-role-focus";
import { getChapterMembershipWorkspace } from "@/services/chapter-membership-workspace";
import { getLandingRouteForActor } from "@/services/landing-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import type { MembershipApprovalResultCode } from "@/services/membership-approval-result-states";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("chapterMembers");
export const dynamic = "force-dynamic";

type ChapterMembersPageProps = {
  searchParams?: Promise<ChapterMembersSearchParams>;
};

type ChapterMembersSearchParams = {
  membershipApprovalResult?: string;
  applicantEmail?: string;
  joinRequestId?: string;
};

export default async function ChapterMembersPage({
  searchParams,
}: ChapterMembersPageProps) {
  const emptySearchParams: ChapterMembersSearchParams = {};
  const [data, actor, search] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const workspace = getChapterMembershipWorkspace(actor, data);
  const memberRoleFocus = getChapterMemberRoleFocus(actor, workspace);
  const surfaceFamily = getActorSurfaceFamily(actor);
  const membershipApprovalResultCode = parseMembershipApprovalResultCode(
    search.membershipApprovalResult,
  );
  const scopedMembershipApprovalResultCode =
    workspace.membershipApprovalPacket?.joinRequestId === search.joinRequestId
      ? membershipApprovalResultCode
      : membershipApprovalResultCode;
  const restrictedNextHref = getLandingRouteForActor(actor);
  const restrictedNextLabel =
    surfaceFamily === "ds_admin"
      ? "Open integration safety"
      : surfaceFamily === "leader"
        ? "Open chapter home"
        : surfaceFamily === "member"
          ? "Open student home"
          : surfaceFamily === "coach"
            ? "Open coach dashboard"
            : "Open your owned surface";

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      {workspace.canReadWorkspace ? (
        <>
          {memberRoleFocus.canReadFocus ? (
            <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
                {memberRoleFocus.roleLabel}
              </p>
              <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    {memberRoleFocus.title}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-white/68">
                    {memberRoleFocus.summary}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={memberRoleFocus.primaryHref}
                    className="rounded-full bg-sky-200 px-4 py-2 text-sm font-semibold text-[#06211d]"
                  >
                    {memberRoleFocus.primaryLabel}
                  </Link>
                  <Link
                    href={memberRoleFocus.secondaryHref}
                    className="rounded-full border border-white/14 bg-black/20 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {memberRoleFocus.secondaryLabel}
                  </Link>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {memberRoleFocus.items.map((item) => (
                  <div key={item.label} className="rounded-2xl bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/58">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-2xl border border-white/10 bg-black/18 p-3 text-sm leading-6 text-white/62">
                {memberRoleFocus.safetyNote}
              </p>
            </section>
          ) : null}
          <MembershipApprovalServerActionPanel
            packet={workspace.membershipApprovalPacket}
            members={workspace.members}
            joinRequests={workspace.joinRequests}
            resultCode={scopedMembershipApprovalResultCode}
            applicantEmail={search.applicantEmail}
            joinRequestId={search.joinRequestId}
          />
          <ChapterMembershipWorkspacePanel workspace={workspace} />
        </>
      ) : (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={restrictedNextHref}
          nextLabel={restrictedNextLabel}
        />
      )}
    </AppShell>
  );
}

function parseMembershipApprovalResultCode(
  value: string | undefined,
): MembershipApprovalResultCode | undefined {
  switch (value) {
    case "membership_approved":
    case "audit_reason_required":
    case "crm_sync_disabled":
    case "duplicate_membership":
    case "join_request_not_found":
    case "missing_auth":
    case "permission_denied":
    case "profile_not_ready":
    case "role_assignment_invalid":
    case "server_error":
    case "welcome_disabled":
    case "write_disabled":
      return value;
    default:
      return undefined;
  }
}
