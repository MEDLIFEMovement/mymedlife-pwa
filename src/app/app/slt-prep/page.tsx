import { renderSltPrepPage } from "@/app/slt-prep/page";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrep");
export const dynamic = "force-dynamic";

type MemberSltPrepAliasPageProps = {
  searchParams?: Promise<{
    source?: string;
  }>;
};

export default async function MemberSltPrepAliasPage(
  props: MemberSltPrepAliasPageProps,
) {
  const query = (await props.searchParams) ?? {};

  return renderSltPrepPage(
    "/app/slt-prep",
    "member",
    query.source === "home" ? "home" : null,
  );
}
