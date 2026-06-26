import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import ChapterPage from "../chapter/page";

export const metadata = getStaticRouteMetadata("leader");
export const dynamic = "force-dynamic";

export default function LeaderPage(
  props: Parameters<typeof ChapterPage>[0],
) {
  return ChapterPage(props);
}
