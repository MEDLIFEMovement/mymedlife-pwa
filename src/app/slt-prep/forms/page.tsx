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
  getSltTripPrepSubnavItems,
  getSltTripPrepWorkspace,
  sltTripPrepMobileQuickNavItems,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getSltPrepPageContext } from "../page-context";

export const metadata = getStaticRouteMetadata("sltPrepForms");
export const dynamic = "force-dynamic";

export default async function SltPrepFormsPage() {
  const { actor, data } = await getSltPrepPageContext("/slt-prep/forms");
  const workspace = getSltTripPrepWorkspace(actor);

  return (
    <AppShell
      actor={actor}
      hideTopHeader
      mobileQuickItemsOverride={[...sltTripPrepMobileQuickNavItems]}
    >
      <DataSourceNotice source={data.source} />
      <SltPrepSubnav items={[...getSltTripPrepSubnavItems(actor)]} />

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
              <h1 className="text-lg font-semibold text-white">Required Forms</h1>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm leading-6 text-slate-600">
                Keep the student language simple: what form is done, what still needs a signature,
                and what remains in review. Inline HubSpot or Drive writes stay blocked.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <SltPrepMiniStat
                  label="Forms complete"
                  value={`${workspace.traveler.forms.filter((item) => item.status === "submitted").length}`}
                  variant="light"
                />
                <SltPrepMiniStat
                  label="In review"
                  value={`${workspace.traveler.forms.filter((item) => item.status === "in_review").length}`}
                  variant="light"
                />
                <SltPrepMiniStat
                  label="Needs signature"
                  value={`${workspace.traveler.forms.filter((item) => item.status === "needs_signature").length}`}
                  variant="light"
                />
              </div>
            </div>
          </section>

          <SltPrepSectionCard eyebrow="Form states" title="Student-friendly form language" variant="light">
            <div className="grid gap-3">
              {workspace.traveler.forms.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                          {item.dueLabel}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                          {item.sourceLabel}
                        </span>
                      </div>
                    </div>
                    <SltPrepTonePill
                      tone={
                        item.status === "submitted"
                          ? "green"
                          : item.status === "needs_signature"
                            ? "red"
                            : "yellow"
                      }
                      label={
                        item.status === "submitted"
                          ? "Complete"
                          : item.status === "needs_signature"
                            ? "Needs signature"
                            : "In review"
                      }
                      variant="light"
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled
                      className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-500"
                    >
                      {item.status === "submitted" ? "Edit form is blocked" : "Complete form is blocked"}
                    </button>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                      Preview only. No HubSpot, Drive, or form submission runs from this route.
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
