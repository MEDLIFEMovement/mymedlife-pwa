import { FigmaAdminPanel } from "@/components/figma-admin-panel";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("admin");
export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <FigmaAdminPanel />;
}
