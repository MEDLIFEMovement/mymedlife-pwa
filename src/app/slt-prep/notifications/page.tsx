import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SltPrepTonePill } from "@/components/slt-prep-primitives";
import { SltPrepSubnav } from "@/components/slt-prep-subnav";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { mapChecklistDetailHref } from "@/services/slt-checklist-detail-href";
import {
  buildSltTripPrepRouteHref,
  getSltTripPrepMobileQuickNavItems,
  getSltTripPrepSubnavItems,
  getSltTripPrepWorkspace,
  parseSltTripPrepRouteSource,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrepNotifications");
export const dynamic = "force-dynamic";

type SltPrepNotificationsPageProps = {
  searchParams?: Promise<{
    source?: string;
    traveler?: string;
  }>;
};

export default async function SltPrepNotificationsPage({
  searchParams,
}: SltPrepNotificationsPageProps) {
  const emptySearchParams: { source?: string; traveler?: string } = {};
  const [actor, search] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const workspace = getSltTripPrepWorkspace(actor, search.traveler);
  const preservedRouteSource = parseSltTripPrepRouteSource(search.source);

  return (
    <AppShell
      actor={actor}
      mobileQuickItemsOverride={getSltTripPrepMobileQuickNavItems({
        source: preservedRouteSource ?? undefined,
        travelerId: search.traveler,
      })}
      hideTopHeader
      showMobileQuickItemHelpers={false}
      showDebugTools={false}
    >
      <SltPrepSubnav
        items={getSltTripPrepSubnavItems({
          source: preservedRouteSource ?? undefined,
          travelerId: search.traveler,
        })}
      />

      {!workspace.canReadWorkspace || !workspace.traveler ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={buildSltTripPrepRouteHref("/slt-prep", {
            travelerId: search.traveler,
          })}
          nextLabel="Back to trip prep"
        />
      ) : (
        <>
          <section className="overflow-hidden rounded-[1.8rem] border border-[#1565c0]/12 bg-white shadow-[0_18px_55px_rgba(8,34,76,0.08)]">
            <div className="space-y-5 px-4 pb-5 pt-4">
              <section className="rounded-[1.4rem] border border-slate-200 bg-[#fbfdff] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-[1.8rem] font-semibold tracking-tight text-slate-950">
                      Notifications
                    </h1>
                    <p className="mt-3 text-sm font-semibold text-slate-950">
                      Push Notifications
                    </p>
                    <p className="mt-1 text-sm text-slate-500">Stay updated on trip prep</p>
                  </div>
                  <label className="mt-1 inline-flex cursor-default items-center">
                    <input
                      aria-label="Push Notifications"
                      checked
                      readOnly
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300 text-[#0b66cc] focus:ring-[#0b66cc]"
                    />
                  </label>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-950">Recent Notifications</h2>
                <div className="mt-3 grid gap-3">
                  {workspace.traveler.notifications.map((item) => {
                    const action = getNotificationAction(item.href);

                    return (
                      <article
                        key={item.id}
                        className="rounded-[1.2rem] border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={mapChecklistDetailHref(item.href, {
                                source: "notifications",
                                travelerId: search.traveler,
                              })}
                              className="text-base font-semibold text-slate-950"
                            >
                              {item.title}
                            </Link>
                            <p className="mt-1 text-sm text-slate-500">{item.sentLabel}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                          </div>
                          <SltPrepTonePill
                            tone={
                              item.tone === "urgent"
                                ? "red"
                                : item.tone === "watch"
                                  ? "yellow"
                                  : "green"
                            }
                            label={
                              item.tone === "watch"
                                ? "Soon"
                                : item.tone === "info"
                                  ? "Done"
                                  : "Now"
                            }
                          />
                        </div>

                        {action ? (
                          <div className="mt-4">
                            <Link
                              href={buildSltTripPrepRouteHref(action.href, {
                                source: "notifications",
                                travelerId: search.traveler,
                              })}
                              className="inline-flex rounded-full bg-[#0b66cc] px-4 py-2 text-sm font-semibold text-white"
                            >
                              {action.label}
                            </Link>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-950">
                  Communication Preferences
                </h2>
                <div className="mt-3 grid gap-3">
                  <PreferenceRow
                    label="Email Notifications"
                    value={workspace.traveler.profile.travelerEmail}
                  />
                  <PreferenceRow
                    label="SMS Notifications"
                    value={workspace.traveler.profile.travelerPhone}
                  />
                </div>
              </section>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

function getNotificationAction(href: string) {
  if (href.includes("flight-itinerary")) {
    return { href: "/slt-prep/flights", label: "Submit flight info" };
  }

  if (href.includes("orientation-rsvp")) {
    return { href: "/slt-prep/meetings", label: "Join meeting" };
  }

  if (href.includes("second-installment")) {
    return { href: "/slt-prep/payments", label: "Pay balance" };
  }

  if (href.includes("extension-choice")) {
    return { href: "/slt-prep/extensions", label: "Choose extension" };
  }

  return null;
}

function PreferenceRow({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{label}</p>
          <p className="mt-1 text-sm text-slate-500">{value}</p>
        </div>
        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Active
        </span>
      </div>
    </article>
  );
}
