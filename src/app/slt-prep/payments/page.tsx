import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import {
  SltPrepMiniStat,
  SltPrepSectionCard,
  SltPrepTonePill,
} from "@/components/slt-prep-primitives";
import { SltPrepSubnav } from "@/components/slt-prep-subnav";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import {
  getSltTripPrepWorkspace,
  sltTripPrepSubnavItems,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrepPayments");
export const dynamic = "force-dynamic";

export default async function SltPrepPaymentsPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const workspace = getSltTripPrepWorkspace(actor);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <SltPrepSubnav items={[...sltTripPrepSubnavItems]} />

      {!workspace.canReadWorkspace || !workspace.traveler ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref="/slt-prep"
          nextLabel="Back to trip prep"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
              Payment status
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Finance view for {workspace.traveler.firstName}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
              The payment plan is visible and understandable, but it is still a mock-safe mirror of
              future Shopify-backed states.
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <SltPrepMiniStat
              label="Paid"
              value={`${workspace.traveler.payments.filter((item) => item.status === "paid").length}`}
            />
            <SltPrepMiniStat
              label="Open"
              value={`${workspace.traveler.payments.filter((item) => item.status === "due").length}`}
            />
            <SltPrepMiniStat
              label="Processing"
              value={`${workspace.traveler.payments.filter((item) => item.status === "processing").length}`}
            />
          </section>

          <SltPrepSectionCard eyebrow="Milestones" title="What is paid and what still needs help?">
            <div className="grid gap-3">
              {workspace.traveler.payments.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                      <p className="mt-1 text-sm text-white/58">{item.amountLabel}</p>
                      <p className="mt-2 text-sm leading-6 text-white/68">{item.summary}</p>
                    </div>
                    <SltPrepTonePill
                      tone={
                        item.status === "paid"
                          ? "green"
                          : item.status === "processing"
                            ? "yellow"
                            : "red"
                      }
                      label={item.status}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/54">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                      {item.dueLabel}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                      {item.sourceLabel}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </SltPrepSectionCard>
        </>
      )}
    </AppShell>
  );
}
