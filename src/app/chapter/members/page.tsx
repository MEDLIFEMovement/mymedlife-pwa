import { redirect } from "next/navigation";

import { getLocalActorContext } from "@/services/local-actor-context";
import { getChapterMembersRouteRedirectHref } from "@/services/owned-route-redirect";
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
  searchParams: _searchParams,
}: ChapterMembersPageProps) {
  const actor = await getLocalActorContext();
  redirect(getChapterMembersRouteRedirectHref(actor));
}
