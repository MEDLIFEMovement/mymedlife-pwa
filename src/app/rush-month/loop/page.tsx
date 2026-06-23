import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RushMonthOperatingPathPanel } from "@/components/rush-month-operating-path-panel";
import { RushMonthLocalLoopDemo } from "@/components/rush-month-local-loop-demo";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getRushMonthOperatingPathView } from "@/services/rush-month-operating-path";
import { getRoleNextActionBrief } from "@/services/role-next-actions";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthLoop");
export const dynamic = "force-dynamic";

export default async function RushMonthLoopPage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const nextActionBrief = getRoleNextActionBrief(actor, data);
  const operatingPath = getRushMonthOperatingPathView(actor, data);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#0a3b88_0%,#0b4f9b_58%,#081a3a_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.32)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d05e]">
          Rush Month operating loop
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          One operating path, end to end.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">
          Follow the same chapter workflow from assignment through action,
          proof, review, recognition, and coach support so every handoff stays
          visible in one place.
        </p>
      </section>

      <RushMonthOperatingPathPanel
        view={operatingPath}
        primaryAction={{
          href: nextActionBrief.primaryHref,
          label: nextActionBrief.primaryLabel,
        }}
        secondaryAction={
          nextActionBrief.secondaryHref && nextActionBrief.secondaryLabel
            ? {
                href: nextActionBrief.secondaryHref,
                label: nextActionBrief.secondaryLabel,
              }
            : undefined
        }
      />

      <RushMonthLocalLoopDemo />
    </AppShell>
  );
}
