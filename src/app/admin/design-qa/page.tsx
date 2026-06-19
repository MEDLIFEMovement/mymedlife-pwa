import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { DesignQaReadinessPanel } from "@/components/design-qa-readiness-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getDesignQaReadiness } from "@/services/design-qa-readiness";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminDesignQa");
export const dynamic = "force-dynamic";

export default async function AdminDesignQaPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const readiness = getDesignQaReadiness(actor);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      {!readiness.canReadReadiness ? (
        <RestrictedState
          title={readiness.title}
          message={readiness.summary}
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lime-100">
                  Figma and mobile QA
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">
                  {readiness.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
                  Compare the local app to the Figma direction, phone viewport,
                  accessibility baseline, role complexity, and pilot-safety copy
                  before anyone calls the PWA launch-ready.
                </p>
              </div>
              <Link
                href="/admin/system-health"
                className="w-fit rounded-full bg-lime-300 px-4 py-2 text-sm font-semibold text-[#13230b]"
              >
                Open system health
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <MiniStat label="Items" value={`${readiness.counts.total}`} />
            <MiniStat
              label="Ready"
              value={`${readiness.counts.readyForLocalReview}`}
            />
            <MiniStat
              label="Review"
              value={`${readiness.counts.needsVisualReview}`}
            />
            <MiniStat
              label="Blocked"
              value={`${readiness.counts.blockedBeforeLaunch}`}
            />
            <MiniStat
              label="Mobile checks"
              value={`${readiness.counts.mobileSmokeChecks}`}
            />
            <MiniStat
              label="A11y checks"
              value={`${readiness.counts.accessibilitySmokeChecks}`}
            />
            <MiniStat
              label="Device checks"
              value={`${readiness.counts.devicePwaSmokeChecks}`}
            />
            <MiniStat
              label="Writes"
              value={`${readiness.counts.browserWritesExpected}`}
            />
          </section>

          <DesignQaReadinessPanel readiness={readiness} />
        </>
      )}
    </AppShell>
  );
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
