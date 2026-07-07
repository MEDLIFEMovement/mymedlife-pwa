import Link from "next/link";
import { notFound } from "next/navigation";
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
  getSltTripPrepChecklistDetailWorkspace,
  getSltTripPrepSubnavItems,
  sltTripPrepMobileQuickNavItems,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getSltPrepPageContext } from "../../page-context";

export const metadata = getStaticRouteMetadata("sltPrepChecklistDetail");
export const dynamic = "force-dynamic";

type ChecklistDetailPageProps = {
  params: Promise<{
    itemId: string;
  }>;
  searchParams?: Promise<{
    preview?: string;
  }>;
};

export default async function SltPrepChecklistDetailPage({
  params,
  searchParams,
}: ChecklistDetailPageProps) {
  const { itemId } = await params;
  const emptySearchParams: { preview?: string } = {};
  const [{ actor, data }, search] = await Promise.all([
    getSltPrepPageContext(`/slt-prep/checklist/${itemId}`),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const workspace = getSltTripPrepChecklistDetailWorkspace(actor, itemId);

  if (!workspace) {
    notFound();
  }

  return (
    <AppShell
      actor={actor}
      hideTopHeader
      mobileQuickItemsOverride={[...sltTripPrepMobileQuickNavItems]}
    >
      <DataSourceNotice source={data.source} />
      <SltPrepSubnav items={[...getSltTripPrepSubnavItems(actor)]} />

      {!workspace.canReadDetail || !workspace.item || !workspace.traveler ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref="/slt-prep/checklist"
          nextLabel="Back to checklist"
        />
      ) : (
        <>
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
            <div className="bg-[#0066CC] px-4 py-4">
              <div className="flex items-center gap-3">
                <Link href="/slt-prep/checklist" className="text-sm font-semibold text-white/86">
                  ← Checklist
                </Link>
                <h1 className="text-lg font-semibold text-white">
                  {ensureVisibleTestLabel(workspace.item.title)}
                </h1>
              </div>
            </div>
            <div className="px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {workspace.item.category}
                  </p>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    {ensureVisibleTestLabel(workspace.summary)}
                  </p>
                </div>
                <SltPrepTonePill
                  tone={getItemTone(workspace.item.status)}
                  label={getItemLabel(workspace.item.status)}
                  variant="light"
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SltPrepMiniStat
                  label="Traveler"
                  value={ensureVisibleTestLabel(workspace.traveler.firstName)}
                  variant="light"
                />
                <SltPrepMiniStat label="Due date" value={workspace.item.dueLabel} variant="light" />
                <SltPrepMiniStat
                  label="Owner"
                  value={ensureVisibleTestLabel(workspace.item.owner)}
                  variant="light"
                />
                <SltPrepMiniStat
                  label="Readiness"
                  value={`${workspace.readinessScore}%`}
                  note="Current traveler readiness"
                  variant="light"
                />
              </div>
            </div>
          </section>

          {isFlightItem(workspace.item.id) ? (
            <SltPrepSectionCard eyebrow="What to submit" title="Flight information" variant="light">
              <div className="grid gap-4">
                <div className="rounded-[1.35rem] border border-blue-200 bg-blue-50 px-4 py-4">
                  <p className="text-sm font-semibold text-blue-900">Why MEDLIFE needs this</p>
                  <p className="mt-2 text-sm leading-6 text-blue-800">
                    This helps MEDLIFE organize airport pickup and trip logistics. The fields are
                    shown exactly the way the exported SLT flow expects, but the submission action
                    stays blocked in this preview.
                  </p>
                </div>

                <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
                  {[
                    "Airline",
                    "Flight number",
                    "Arrival date",
                    "Arrival time",
                    "Departure date",
                    "Departure time",
                    "Airport",
                    "Upload confirmation (optional)",
                  ].map((field) => (
                    <div key={field}>
                      <p className="text-sm font-semibold text-slate-700">{field}</p>
                      <div className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-400">
                        Preview only
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-xl bg-slate-200 px-4 py-3 text-base font-bold text-slate-500"
                  >
                    Submit flight information
                  </button>
                  <Link
                    href="/slt-prep/notifications"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-300"
                  >
                    Need help?
                  </Link>
                </div>
              </div>
            </SltPrepSectionCard>
          ) : (
            <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <SltPrepSectionCard eyebrow="Why it matters" title="Context for this checkpoint" variant="light">
                <div className="space-y-4">
                  <p className="text-sm leading-6 text-slate-600">
                    {ensureVisibleTestLabel(workspace.item.whyItMatters)}
                  </p>
                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Evidence requirement
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {ensureVisibleTestLabel(workspace.item.evidenceRequirement)}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Next step
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {ensureVisibleTestLabel(workspace.item.nextStep)}
                    </p>
                  </div>
                </div>
              </SltPrepSectionCard>

              <SltPrepSectionCard eyebrow="Action" title="Keep the next move simple" variant="light">
                <div className="space-y-3">
                  <Link
                    href={getPrimaryDetailHref(workspace.item.id)}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-[#0066CC] px-4 py-3 text-base font-bold text-white shadow-sm transition hover:brightness-95"
                  >
                    {getPrimaryDetailLabel(workspace.item.id)}
                  </Link>
                  <p className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    This keeps the route honest and useful, but the underlying write still stays
                    preview-only until a real traveler path is approved.
                  </p>
                </div>
              </SltPrepSectionCard>
            </section>
          )}

          {search.preview === "complete" ? (
            <section className="rounded-[1.7rem] border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                Completion preview
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                This would move the item into a completed state, add an audit row, and update the
                readiness score after a real write path is approved. No status change is saved from
                this preview route.
              </p>
            </section>
          ) : null}

          <SltPrepSectionCard eyebrow="Preview safety" title="Keep the write path blocked" variant="light">
            <div className="grid gap-3">
              {workspace.safetyNotes.map((note) => (
                <p
                  key={note}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600"
                >
                  {note}
                </p>
              ))}
              {(actor.audience === "admin" || actor.audience === "super_admin") && workspace.traveler ? (
                <Link
                  href={`/admin/slt-checklist-write?travelerId=${workspace.traveler.id}&itemId=${workspace.item.id}`}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  Open admin packet
                </Link>
              ) : null}
            </div>
          </SltPrepSectionCard>
        </>
      )}
    </AppShell>
  );
}

function isFlightItem(itemId: string) {
  return itemId === "flight-itinerary";
}

function getItemTone(status: string): "red" | "yellow" | "green" {
  if (status === "needs_attention") {
    return "red";
  }

  if (status === "complete") {
    return "green";
  }

  return "yellow";
}

function getItemLabel(status: string) {
  switch (status) {
    case "needs_attention":
      return "Missing";
    case "complete":
      return "Complete";
    case "in_review":
      return "In review";
    case "upcoming":
      return "Due soon";
    default:
      return status;
  }
}

function getPrimaryDetailHref(itemId: string) {
  switch (itemId) {
    case "medical-clearance":
    case "trip-agreement":
      return "/slt-prep/forms";
    case "second-installment":
      return "/slt-prep/payments";
    case "orientation-rsvp":
      return "/slt-prep/meetings";
    case "extension-choice":
      return "/slt-prep/extensions";
    case "passport-proof":
      return "/slt-prep/profile";
    default:
      return "/slt-prep/checklist";
  }
}

function getPrimaryDetailLabel(itemId: string) {
  switch (itemId) {
    case "medical-clearance":
    case "trip-agreement":
      return "Review form status";
    case "second-installment":
      return "Review payment status";
    case "orientation-rsvp":
      return "Open meeting status";
    case "extension-choice":
      return "Review extensions";
    case "passport-proof":
      return "Open traveler profile";
    default:
      return "Back to checklist";
  }
}
