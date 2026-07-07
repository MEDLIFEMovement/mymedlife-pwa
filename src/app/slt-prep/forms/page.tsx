import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import {
  SltPrepMiniStat,
  SltPrepSectionCard,
  SltPrepTonePill,
} from "@/components/slt-prep-primitives";
import { SltPrepSubnav } from "@/components/slt-prep-subnav";
import { RestrictedState } from "@/components/restricted-state";
import {
  getSltTripPrepWorkspace,
  sltTripPrepMobileQuickNavItems,
  sltTripPrepSubnavItems,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getSltPrepPageContext } from "../page-context";

export const metadata = getStaticRouteMetadata("sltPrepForms");
export const dynamic = "force-dynamic";

export default async function SltPrepFormsPage() {
  const { actor, data } = await getSltPrepPageContext("/slt-prep/forms");
  const workspace = getSltTripPrepWorkspace(actor);

  return (
    <AppShell actor={actor} mobileQuickItemsOverride={[...sltTripPrepMobileQuickNavItems]}>
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
              Required forms
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Forms hub for {workspace.traveler.firstName}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
              Keep forms simple: what is done, what is waiting for review, and what still needs
              a human signature before departure.
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <SltPrepMiniStat label="Forms" value={`${workspace.traveler.forms.length}`} />
            <SltPrepMiniStat
              label="Submitted"
              value={`${workspace.traveler.forms.filter((item) => item.status === "submitted").length}`}
            />
            <SltPrepMiniStat
              label="Needs signature"
              value={`${workspace.traveler.forms.filter((item) => item.status === "needs_signature").length}`}
            />
          </section>

          <SltPrepSectionCard eyebrow="Form states" title="Readable, reviewable, and mock-safe">
            <div className="grid gap-3">
              {workspace.traveler.forms.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-white/68">{item.summary}</p>
                    </div>
                    <SltPrepTonePill
                      tone={
                        item.status === "submitted"
                          ? "green"
                          : item.status === "needs_signature"
                            ? "red"
                            : "yellow"
                      }
                      label={item.status.replace("_", " ")}
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
