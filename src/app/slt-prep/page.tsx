import { renderSltPrepPage } from "@/app/slt-prep/render-page";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrep");
export const dynamic = "force-dynamic";

type SltPrepPageProps = {
  searchParams?: Promise<{ traveler?: string }>;
};

export default async function SltPrepPage({ searchParams }: SltPrepPageProps) {
  const search = await (searchParams ?? Promise.resolve<{ traveler?: string }>({}));
  return renderSltPrepPage("/slt-prep", "standalone", null, search.traveler);
}
