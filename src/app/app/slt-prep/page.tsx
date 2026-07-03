import { redirect } from "next/navigation";
import {
  isEventsPointsLaunchLaneEnabled,
} from "@/services/launch-lane-product-focus";
import SltPrepPage, {
  metadata,
  dynamic,
} from "../../slt-prep/page";

type AppSltPrepAliasPageProps = Parameters<typeof SltPrepPage>[0];

export { metadata, dynamic };

export default async function AppSltPrepAliasPage(
  props: AppSltPrepAliasPageProps,
) {
  if (isEventsPointsLaunchLaneEnabled()) {
    redirect("/app");
  }

  return SltPrepPage(props);
}
