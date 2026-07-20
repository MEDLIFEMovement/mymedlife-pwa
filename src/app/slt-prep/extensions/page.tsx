import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import {
  ensureVisibleTestLabel,
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

export const metadata = getStaticRouteMetadata("sltPrepExtensions");
export const dynamic = "force-dynamic";

export default async function SltPrepExtensionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ traveler?: string }>;
}) {
  const [{ actor, data }, search] = await Promise.all([
    getSltPrepPageContext("/slt-prep/extensions"),
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
              <h1 className="text-lg font-semibold text-white">Extensions & Tours</h1>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm leading-6 text-slate-600">
                Optional add-ons stay visible and easy to compare, but booking and payment remain blocked until a real storefront path is approved.
              </p>
            </div>
          </section>

          <SltPrepSectionCard eyebrow="Optional add-ons" title="Understand the choices without live booking" variant="light">
            <div className="grid gap-4">
              {workspace.traveler.extensions.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"
                >
                  <div
                    className="h-40 bg-cover bg-center"
                    style={{
                      backgroundImage:
                        item.id === "machu-picchu"
                          ? "url('https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1200&h=540&fit=crop&auto=format')"
                          : "url('https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&h=540&fit=crop&auto=format')",
                    }}
                  />
                  <div className="px-4 pb-5 pt-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-slate-950">
                          {ensureVisibleTestLabel(item.title)}
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          {ensureVisibleTestLabel(item.priceLabel)}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {ensureVisibleTestLabel(item.summary)}
                        </p>
                      </div>
                      <SltPrepTonePill
                        tone={item.status === "selected" ? "green" : "yellow"}
                        label={item.status === "selected" ? "Selected" : item.status === "considering" ? "Interested" : "Not selected"}
                        variant="light"
                      />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled
                        className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-500"
                      >
                        {item.status === "selected" ? "Booking confirmed is blocked" : "Choose extension is blocked"}
                      </button>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        This route keeps the exported card structure, but Shopify booking and add-on payment stay preview-only.
                      </div>
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
