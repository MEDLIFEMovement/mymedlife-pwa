import { renderSltPrepPage } from "@/app/slt-prep/page";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrep");
export const dynamic = "force-dynamic";

export default async function MemberSltPrepAliasPage() {
  return renderSltPrepPage("/app/slt-prep");
}
