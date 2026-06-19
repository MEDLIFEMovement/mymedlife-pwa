import { redirect } from "next/navigation";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonth");
export const dynamic = "force-dynamic";

export default function RushMonthPage() {
  redirect("/rush-month/dashboard");
}
