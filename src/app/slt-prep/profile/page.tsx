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

export const metadata = getStaticRouteMetadata("sltPrepProfile");
export const dynamic = "force-dynamic";

type SltPrepProfilePageProps = {
  searchParams?: Promise<{
    source?: string;
    traveler?: string;
  }>;
};

export default async function SltPrepProfilePage({
  searchParams,
}: SltPrepProfilePageProps) {
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
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0b66cc]">
                      Profile
                    </p>
                    <h1 className="mt-2 text-[1.8rem] font-semibold tracking-tight text-slate-950">
                      Profile for {workspace.traveler.displayName}
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                      {workspace.traveler.tripLabel.replace("|", "—")}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{workspace.traveler.cityLabel}</p>
                  </div>
                  <Link
                    href={buildSltTripPrepRouteHref("/slt-prep/notifications", {
                      source: preservedRouteSource ?? undefined,
                      travelerId: search.traveler,
                    })}
                    className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0b66cc]"
                  >
                    Open notifications
                  </Link>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-950">Traveler snapshot</h2>
                <div className="mt-3 grid gap-3">
                  {[
                    ["Email", workspace.traveler.profile.travelerEmail],
                    ["Phone", workspace.traveler.profile.travelerPhone],
                    ["Passport", workspace.traveler.profile.passportStatus],
                    ["Emergency contact", workspace.traveler.profile.emergencyContactName],
                    ["Emergency phone", workspace.traveler.profile.emergencyContactPhone],
                    ["Dietary needs", workspace.traveler.profile.dietaryNeeds],
                  ].map(([label, value]) => (
                    <article
                      key={label}
                      className="rounded-[1.2rem] border border-slate-200 bg-white p-4"
                    >
                      <p className="text-sm font-semibold text-slate-950">{label}</p>
                      <p className="mt-1 text-sm text-slate-500">{value}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-950">Recent Notifications</h2>
                <div className="mt-3 grid gap-3">
                  {workspace.traveler.notifications.slice(0, 4).map((item) => {
                    const action = getProfileAction(item.href);

                    return (
                      <article
                        key={item.id}
                        className="rounded-[1.2rem] border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={mapChecklistDetailHref(item.href, {
                                source: "profile",
                                travelerId: search.traveler,
                              })}
                              className="text-base font-semibold text-slate-950"
                            >
                              {item.title}
                            </Link>
                            <p className="mt-1 text-sm text-slate-500">
                              {item.sentLabel} • {item.channelLabel}
                            </p>
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
                                source: "profile",
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
                <h2 className="text-lg font-semibold text-slate-950">Communication Preferences</h2>
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

function getProfileAction(href: string) {
  if (href.includes("flight-itinerary") || href.includes("/flights")) {
    return { href: "/slt-prep/flights", label: "Submit flight info" };
  }

  if (href.includes("orientation-rsvp") || href.includes("/meetings")) {
    return { href: "/slt-prep/meetings", label: "Join meeting" };
  }

  if (href.includes("second-installment") || href.includes("/payments")) {
    return { href: "/slt-prep/payments", label: "Pay balance" };
  }

  if (href.includes("extension-choice") || href.includes("/extensions")) {
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
