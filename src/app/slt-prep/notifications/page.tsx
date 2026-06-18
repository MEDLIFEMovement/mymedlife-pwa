import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import {
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

export const metadata = getStaticRouteMetadata("sltPrepNotifications");
export const dynamic = "force-dynamic";

export default async function SltPrepNotificationsPage() {
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
              Notification center
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Readiness updates for {workspace.traveler.firstName}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
              The state is visible, but all reminders are still mock previews. No email, SMS, or
              push message is sent from this app.
            </p>
          </section>

          <SltPrepSectionCard eyebrow="Recent updates" title="Keep alerts human-readable">
            <div className="grid gap-3">
              {workspace.traveler.notifications.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                      <p className="mt-1 text-sm text-white/58">
                        {item.sentLabel} • {item.channelLabel}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/68">{item.summary}</p>
                    </div>
                    <SltPrepTonePill
                      tone={
                        item.tone === "urgent"
                          ? "red"
                          : item.tone === "watch"
                            ? "yellow"
                            : "green"
                      }
                      label={item.tone}
                    />
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
