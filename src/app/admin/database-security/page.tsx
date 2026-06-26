import Link from "next/link";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminAppShell } from "@/components/admin-app-shell";
import { DatabaseSecurityDecisionPanel } from "@/components/database-security-decision-panel";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { getDatabaseSecurityDecisionPacket } from "@/services/database-security-decision";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadAdminIntegrationsSecurity,
  getActorSurfaceFamily,
} from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminDatabaseSecurity");
export const dynamic = "force-dynamic";

export default async function AdminDatabaseSecurityPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const packet = getDatabaseSecurityDecisionPacket(actor);
  const nextStep = getNextStep(actor);

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="database_security"
        showIntegrations={canReadAdminIntegrationsSecurity(actor)}
      />

      {!packet.canReadPacket ? (
        <RestrictedState
          title={packet.title}
          message={packet.summary}
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]">
                  Database security
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                  {packet.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Review why the MVP stays on Supabase Postgres/Auth/Storage,
                  what PlanetScale MySQL/Vitess would trade off, and which
                  DS/security approvals remain before production data is trusted.
                </p>
              </div>
              <Link
                href={nextStep.href}
                className="w-fit rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
              >
                {nextStep.label}
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MiniStat
              label="Reviewed"
              value={`${packet.counts.platformsReviewed}`}
            />
            <MiniStat
              label="Evidence"
              value={`${packet.counts.localEvidenceReady}`}
            />
            <MiniStat
              label="Approvals"
              value={`${packet.counts.approvalRequired}`}
            />
            <MiniStat label="Launch" value={packet.liveLaunchReady ? "yes" : "no"} />
            <MiniStat label="Writes" value={`${packet.browserWritesExpected}`} />
          </section>

          <DatabaseSecurityDecisionPanel packet={packet} />
        </>
      )}
    </AdminAppShell>
  );
}

function getNextStep(actor: LocalActorContext) {
  if (getActorSurfaceFamily(actor) === "ds_admin") {
    return {
      label: "Open operations runbook",
      href: "/admin/operations",
    };
  }

  return {
    label: "Open system health",
    href: "/admin/system-health",
  };
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563eb]">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
