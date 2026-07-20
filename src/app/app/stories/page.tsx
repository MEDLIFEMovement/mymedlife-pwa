import { renderMemberMobileShellPage } from "@/app/app/member-mobile-shell-page";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("appStories");
export const dynamic = "force-dynamic";

type AppStoriesPageProps = {
  searchParams?: Promise<{
    filter?: string;
    story?: string;
    storyReactionResult?: string;
  }>;
};

export default async function AppStoriesPage(props: AppStoriesPageProps) {
  const query = (await props.searchParams) ?? {};
  const repaintKey = buildRouteKey("/app/stories", query);

  return renderMemberMobileShellPage({
    initialScreen: "stories",
    redirectPath: "/app/stories",
    initialStoriesFilter: query.filter ?? null,
    initialStoryId: query.story ?? null,
    initialStoryReactionResult: query.storyReactionResult ?? null,
    repaintKey,
  });
}

function buildRouteKey(
  pathname: string,
  params: { filter?: string; story?: string; storyReactionResult?: string },
) {
  const searchParams = new URLSearchParams();

  if (params.filter) {
    searchParams.set("filter", params.filter);
  }

  if (params.story) {
    searchParams.set("story", params.story);
  }

  if (params.storyReactionResult) {
    searchParams.set("storyReactionResult", params.storyReactionResult);
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
