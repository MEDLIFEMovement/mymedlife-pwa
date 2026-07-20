import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import {
  ensureVisibleTestLabel,
  SltPrepMiniStat,
  SltPrepSectionCard,
  SltPrepTonePill,
} from "@/components/slt-prep-primitives";
import { SltPrepSubnav } from "@/components/slt-prep-subnav";
import { RestrictedState } from "@/components/restricted-state";
import {
  getSltTripPrepSubnavItems,
  getSltTripPrepWorkspace,
  sltTripPrepMobileQuickNavItems,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getSltPrepPageContext } from "../page-context";

export const metadata = getStaticRouteMetadata("sltPrepPayments");
export const dynamic = "force-dynamic";

export default async function SltPrepPaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ traveler?: string }>;
}) {
  const [{ actor, data }, search] = await Promise.all([
    getSltPrepPageContext("/slt-prep/payments"),
    searchParams ?? Promise.resolve<{ traveler?: string }>({}),
  ]);
  const workspace = getSltTripPrepWorkspace(actor, search.traveler);

  return (
    <AppShell
      actor={actor}
      hideTopHeader
      mobileQuickItemsOverride={[...sltTripPrepMobileQuickNavItems]}
    >
      <DataSourceNotice source={data.source} />
      <SltPrepSubnav items={[...getSltTripPrepSubnavItems(actor, workspace.traveler?.id)]} />

      {!workspace.canReadWorkspace || !workspace.traveler ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref="/slt-prep"
          nextLabel="Back to trip prep"
        />
      ) : (
        <>
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
            <div className="bg-[#0066CC] px-4 py-4">
              <h1 className="text-lg font-semibold text-white">Payment Status</h1>
            </div>
            <div className="px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Total trip cost
                  </p>
                  <p className="mt-1 text-4xl font-black text-slate-950">TEST $2,000</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {ensureVisibleTestLabel(workspace.traveler.tripLabel)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Remaining
                  </p>
                  <p className="mt-1 text-3xl font-black text-rose-600">TEST $1,500</p>
                  <p className="mt-1 text-sm text-rose-500">Preview-only payment posture</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <SltPrepMiniStat
                  label="Paid"
                  value={`${workspace.traveler.payments.filter((item) => item.status === "paid").length}`}
                  variant="light"
                />
                <SltPrepMiniStat
                  label="Due"
                  value={`${workspace.traveler.payments.filter((item) => item.status === "due").length}`}
                  variant="light"
                />
                <SltPrepMiniStat
                  label="Processing"
                  value={`${workspace.traveler.payments.filter((item) => item.status === "processing").length}`}
                  variant="light"
                />
              </div>
            </div>
          </section>

          <SltPrepSectionCard eyebrow="Payment milestones" title="Readable without live checkout" variant="light">
            <div className="grid gap-3">
              {workspace.traveler.payments.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-[1.35rem] px-4 py-4 ${
                    item.status === "due"
                      ? "border-2 border-rose-300 bg-white"
                      : "border border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-slate-950">
                        {ensureVisibleTestLabel(item.title)}
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        {ensureVisibleTestLabel(item.amountLabel)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {ensureVisibleTestLabel(item.summary)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                          {ensureVisibleTestLabel(item.dueLabel)}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                          {ensureVisibleTestLabel(item.sourceLabel)}
                        </span>
                      </div>
                    </div>
                    <SltPrepTonePill
                      tone={
                        item.status === "paid"
                          ? "green"
                          : item.status === "processing"
                            ? "yellow"
                            : "red"
                      }
                      label={item.status === "due" ? "Payment required" : item.status}
                      variant="light"
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled
                      className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-500"
                    >
                      {item.status === "due" ? "Pay remaining balance is blocked" : "View receipt is blocked"}
                    </button>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                      Shopify status is shown for readiness only. No checkout or payment-plan action runs from this route.
                    </div>
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
