import { renderMemberMobileShellPage } from "@/app/app/member-mobile-shell-page";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("appStories");
export const dynamic = "force-dynamic";

type AppStoriesPageProps = {
  searchParams?: Promise<{
    filter?: string;
    story?: string;
  }>;
};

export default async function AppStoriesPage(props: AppStoriesPageProps) {
  const query = (await props.searchParams) ?? {};

  return renderMemberMobileShellPage({
    initialScreen: "stories",
    redirectPath: "/app/stories",
    initialStoriesFilter: query.filter ?? null,
    initialStoryId: query.story ?? null,
  });
}
