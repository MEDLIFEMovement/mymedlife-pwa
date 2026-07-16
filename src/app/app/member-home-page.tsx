import { renderMemberMobileShellPage } from "./member-mobile-shell-page";

type MemberHomePageProps = {
  searchParams?: Promise<{
    lumaResult?: string;
    lumaMessage?: string;
  }>;
};

export default async function MemberHomePage(props: MemberHomePageProps) {
  const emptySearchParams: { lumaResult?: string; lumaMessage?: string } = {};
  const resolvedSearchParams = await (props.searchParams ?? Promise.resolve(emptySearchParams));
  const repaintKey = buildRouteKey("/app", resolvedSearchParams);

  return renderMemberMobileShellPage({
    redirectPath: "/app",
    repaintKey,
  });
}

function buildRouteKey(pathname: string, params: { lumaResult?: string; lumaMessage?: string }) {
  const searchParams = new URLSearchParams();

  if (params.lumaResult) {
    searchParams.set("lumaResult", params.lumaResult);
  }

  if (params.lumaMessage) {
    searchParams.set("lumaMessage", params.lumaMessage);
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
