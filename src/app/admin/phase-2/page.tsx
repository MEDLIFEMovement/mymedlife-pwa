import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { Phase2ReviewSurfacePanel } from "@/components/phase-2-review-surface-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getPhase2SafePrepPacket } from "@/services/phase-2-safe-prep";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminPhase2Review");
export const dynamic = "force-dynamic";

export default async function AdminPhase2Page() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const packet = getPhase2SafePrepPacket();

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      {!canReadPhase2Review(actor.audience) ? (
        <RestrictedState
          title="Phase 2 review is hidden for this role."
          message="This surface is for admin, DS Admin, and Super Admin review only. Chapter, coach, and member roles should stay on their operating routes."
          nextHref="/admin"
          nextLabel="Return to Command Center"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-sky-300/20 bg-[#071d1a]/90 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-100">
                  Phase 2 review surface
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">
                  Read the next lane before we build it.
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
                  This route keeps MED-471 through MED-486 visible as a safe,
                  mock-only plan so Nick, Kiomi, and DS can see what is ready,
                  what is blocked, and what still needs approval.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/admin/launch-gate"
                  className="rounded-full bg-sky-200 px-4 py-2 text-sm font-semibold text-[#082136]"
                >
                  Launch gate
                </Link>
                <Link
                  href="/admin/database-security"
                  className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white/78"
                >
                  Database security
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <MiniStat label="Issues" value={`${packet.counts.linearIssues}`} />
            <MiniStat label="Prep" value={`${packet.counts.prepReady}`} />
            <MiniStat
              label="Blocked"
              value={`${packet.counts.blockedPendingDsReview}`}
            />
            <MiniStat label="Writes" value={`${packet.counts.writeGates}`} />
            <MiniStat label="In review" value={`${packet.counts.inReview}`} />
            <MiniStat label="No live" value="yes" />
          </section>

          <Phase2ReviewSurfacePanel packet={packet} />
        </>
      )}
    </AppShell>
  );
}

function canReadPhase2Review(audience: string) {
  return audience === "admin" || audience === "ds_admin" || audience === "super_admin";
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
