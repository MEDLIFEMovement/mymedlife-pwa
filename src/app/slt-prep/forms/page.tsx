import Link from "next/link";
import { SltPrepShell } from "@/components/slt-prep-shell";
import { SltPrepRouteHandoffCard } from "@/components/slt-prep-route-handoff-card";
import {
  SltPrepSectionCard,
  SltPrepTonePill,
} from "@/components/slt-prep-primitives";
import { SltPrepSubnav } from "@/components/slt-prep-subnav";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { buildSltChecklistDetailHref } from "@/services/slt-checklist-detail-href";
import {
  buildSltTripPrepRouteHref,
  getSltTripPrepRouteSourceContext,
  getSltTripPrepMobileQuickNavItems,
  getSltTripPrepSubnavItems,
  getSltTripPrepWorkspace,
  parseSltTripPrepRouteSource,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrepForms");
export const dynamic = "force-dynamic";

type SltPrepFormsPageProps = {
  searchParams?: Promise<{
    source?: string;
    traveler?: string;
  }>;
};

export default async function SltPrepFormsPage({
  searchParams,
}: SltPrepFormsPageProps) {
  const emptySearchParams: { source?: string; traveler?: string } = {};
  const [actor, search] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const workspace = getSltTripPrepWorkspace(actor, search.traveler);
  const routeSource = parseSltTripPrepRouteSource(search.source);
  const routeSourceContext = getSltTripPrepRouteSourceContext(
    routeSource,
    search.traveler,
    workspace.traveler?.displayName,
  );
  const needsSignatureForm =
    workspace.traveler?.forms.find((item) => item.status === "needs_signature") ?? null;
  const inReviewForm =
    workspace.traveler?.forms.find((item) => item.status === "in_review") ?? null;
  const submittedFormCount =
    workspace.traveler?.forms.filter((item) => item.status === "submitted").length ?? 0;

  return (
    <SltPrepShell
      actor={actor}
      mobileQuickItemsOverride={getSltTripPrepMobileQuickNavItems({
        source: routeSource ?? undefined,
        travelerId: search.traveler,
      })}
      hideTopHeader
      showMobileQuickItemHelpers={false}
      showDebugTools={false}
    >
      <SltPrepSubnav
        items={getSltTripPrepSubnavItems({
          source: routeSource ?? undefined,
          travelerId: search.traveler,
        })}
      />

      {!workspace.canReadWorkspace || !workspace.traveler ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={buildSltTripPrepRouteHref("/slt-prep", { travelerId: search.traveler })}
          nextLabel="Back to trip prep"
        />
      ) : (
        <>
          <section className="app-surface-info overflow-hidden rounded-[2rem] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
              Required forms
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">
              Required Forms Hub
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Keep {workspace.traveler.firstName}&apos;s forms simple: what is done, what is waiting
              for review, and what still needs a human signature before departure.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <FormsHeroStat label="Forms" value={`${workspace.traveler.forms.length}`} />
              <FormsHeroStat
                label="Submitted"
                value={`${workspace.traveler.forms.filter((item) => item.status === "submitted").length}`}
              />
              <FormsHeroStat
                label="Needs signature"
                value={`${workspace.traveler.forms.filter((item) => item.status === "needs_signature").length}`}
              />
            </div>
          </section>

          <div className="grid gap-4 rounded-[2rem] bg-[#eef3fb] p-4 shadow-[0_18px_50px_rgba(5,24,60,0.12)]">
            <section className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
              <article className="app-surface-info rounded-[2rem] p-5">
                <p className="app-eyebrow app-eyebrow-blue">Review queue</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Submitted and review-ready forms
                </h2>
                <div className="mt-4 grid gap-3">
                  <MiniFact
                    label="In review"
                    value={inReviewForm?.title ?? "No active review"}
                    note={
                      inReviewForm?.summary ??
                      "Nothing is waiting on a reviewer right now."
                    }
                  />
                  <MiniFact
                    label="Submitted"
                    value={`${submittedFormCount} form${submittedFormCount === 1 ? "" : "s"}`}
                    note="Completed uploads can stay visible without crowding out the next blocker."
                  />
                </div>
              </article>

              <article className="app-surface-warm rounded-[2rem] p-5">
                <p className="app-eyebrow app-eyebrow-warm">Current blocker</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {needsSignatureForm?.title ?? "No signature blocker is active right now."}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {needsSignatureForm?.summary ??
                    "All form signatures are already captured in this prep flow."}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MiniFact
                    label="Due"
                    value={needsSignatureForm?.dueLabel ?? "Cleared"}
                    note="Signature timing should stay visible before the traveler assumes the prep flow is complete."
                  />
                  <MiniFact
                    label="Source"
                    value={needsSignatureForm?.sourceLabel ?? "myMEDLIFE mock"}
                    note="Keep the source visible so the traveler knows exactly where the next handoff lives."
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={buildSltChecklistDetailHref("medical-clearance", {
                      source: "forms",
                      travelerId: search.traveler,
                    })}
                    className="rounded-full bg-[#0b66cc] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Open medical clearance detail
                  </Link>
                </div>
              </article>
            </section>

            {routeSourceContext ? <SltPrepRouteHandoffCard {...routeSourceContext} /> : null}

            <SltPrepSectionCard eyebrow="Form states" title="Form status and next steps">
              <div className="grid gap-3">
                {workspace.traveler.forms.map((item) => (
                  <article
                    key={item.id}
                    className="app-surface-soft rounded-[1.35rem] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
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
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                        {item.dueLabel}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                        {item.sourceLabel}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </SltPrepSectionCard>

            <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <article className="app-surface rounded-[1.75rem] p-5">
                <p className="app-eyebrow app-eyebrow-slate">Signature risk</p>
                <h2 className="mt-2 text-[1.72rem] font-semibold leading-tight text-slate-950">
                  Which form still needs the next real handoff?
                </h2>
                <div className="mt-4 grid gap-3">
                  <MiniFact
                    label="In review"
                    value={`${workspace.traveler.forms.filter((item) => item.status === "in_review").length} form`}
                    note="Submitted forms can still hold up departure if reviewer follow-up is not clear."
                  />
                  <MiniFact
                    label="Needs signature"
                    value={`${workspace.traveler.forms.filter((item) => item.status === "needs_signature").length} form`}
                    note="Unsigned consent items should stand out before the prep flow feels done."
                  />
                </div>
              </article>

              <article className="app-surface rounded-[1.75rem] p-5">
                <p className="app-eyebrow app-eyebrow-slate">Related routes</p>
                <h2 className="mt-2 text-[1.72rem] font-semibold leading-tight text-slate-950">
                  Move from forms into the next checklist or reviewer lane.
                </h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={buildSltChecklistDetailHref("medical-clearance", {
                      source: "forms",
                      travelerId: search.traveler,
                    })}
                    className="rounded-full bg-[#0b66cc] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Open medical clearance detail
                  </Link>
                  <Link
                    href={buildSltTripPrepRouteHref("/slt-prep/staff", {
                      travelerId: search.traveler,
                    })}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Open staff dashboard
                  </Link>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Keep this route attached to the broader readiness flow without turning form
                  status into a detached review lane.
                </p>
              </article>
            </section>
          </div>
        </>
      )}
    </SltPrepShell>
  );
}

function FormsHeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/12 bg-white/10 p-3 backdrop-blur-sm">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-white/56">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniFact({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="app-surface-soft rounded-[1.25rem] p-4">
      <p className="app-eyebrow app-eyebrow-blue">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
    </div>
  );
}
