import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("app");
export const dynamic = "force-dynamic";
export { default } from "../page";
