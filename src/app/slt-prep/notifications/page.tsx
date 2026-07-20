import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import {
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

export const metadata = getStaticRouteMetadata("sltPrepNotifications");
export const dynamic = "force-dynamic";

export default async function SltPrepNotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ traveler?: string }>;
}) {
  const [{ actor, data }, search] = await Promise.all([
    getSltPrepPageContext("/slt-prep/notifications"),
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
              <h1 className="text-lg font-semibold text-white">Notifications</h1>
            </div>
            <div className="px-5 py-5">
              <div className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Push notifications</p>
                  <p className="mt-1 text-sm text-slate-500">Notification settings stay read-only in this preview.</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                  Active
                </span>
              </div>
            </div>
          </section>

          <SltPrepSectionCard eyebrow="Recent notifications" title="Messages you would see here" variant="light">
            <div className="grid gap-3">
              {workspace.traveler.notifications.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.sentLabel} • {item.channelLabel}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                    </div>
                    <SltPrepTonePill
                      tone={item.tone === "urgent" ? "red" : item.tone === "watch" ? "yellow" : "green"}
                      label={item.tone === "urgent" ? "Urgent" : item.tone === "watch" ? "Due soon" : "Info"}
                      variant="light"
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled
                      className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-500"
                    >
                      Complete now is blocked
                    </button>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                      No email, SMS, push, reminder, or provider sync fires from this notification center.
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
