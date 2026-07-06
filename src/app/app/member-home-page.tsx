import { renderMemberMobileShellPage } from "./member-mobile-shell-page";

type MemberHomePageProps = {
  searchParams?: Promise<{
    lumaResult?: string;
    lumaMessage?: string;
  }>;
};

export default async function MemberHomePage(props: MemberHomePageProps) {
  const emptySearchParams: { lumaResult?: string; lumaMessage?: string } = {};
  await (props.searchParams ?? Promise.resolve(emptySearchParams));
  return renderMemberMobileShellPage({ redirectPath: "/app" });
}
