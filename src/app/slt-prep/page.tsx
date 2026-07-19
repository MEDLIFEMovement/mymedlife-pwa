import { renderSltPrepPage } from "@/app/slt-prep/render-page";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrep");
export const dynamic = "force-dynamic";

export default async function SltPrepPage() {
  return renderSltPrepPage();
}
