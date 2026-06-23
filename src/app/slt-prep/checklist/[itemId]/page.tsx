import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SltPrepTonePill } from "@/components/slt-prep-primitives";
import { SltPrepSubnav } from "@/components/slt-prep-subnav";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import type { SltChecklistDetailSource } from "@/services/slt-checklist-detail-href";
import {
  buildSltTripPrepRouteHref,
  getSltTripPrepMobileQuickNavItems,
  getSltTripPrepSubnavItems,
  getSltTripPrepChecklistDetailWorkspace,
  parseSltTripPrepRouteSource,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrepChecklistDetail");
export const dynamic = "force-dynamic";

type ChecklistDetailPageProps = {
  params: Promise<{
    itemId: string;
  }>;
  searchParams?: Promise<{
    preview?: string;
    source?: string;
    traveler?: string;
  }>;
};

export default async function SltPrepChecklistDetailPage({
  params,
  searchParams,
}: ChecklistDetailPageProps) {
  const { itemId } = await params;
  const emptySearchParams: { preview?: string; source?: string; traveler?: string } = {};
  const [actor, search] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const routeSource = parseSltTripPrepRouteSource(search.source);
  const workspace = getSltTripPrepChecklistDetailWorkspace(actor, itemId, search.traveler);

  if (!workspace) {
    notFound();
  }

  if (!workspace.canReadDetail || !workspace.item || !workspace.traveler) {
    return (
      <AppShell
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
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={buildSltTripPrepRouteHref("/slt-prep/checklist", {
            travelerId: search.traveler,
          })}
          nextLabel="Back to checklist"
        />
      </AppShell>
    );
  }

  const isFlightForm = workspace.item.id === "flight-itinerary";
  const statusLabel =
    workspace.item.status === "needs_attention"
      ? "Overdue"
      : workspace.item.status === "complete"
        ? "Done"
        : "Due soon";
  const detailTitle = isFlightForm ? "Flight information submitted" : workspace.title;
  const dueDateValue = workspace.item.dueLabel.replace(/^Due /, "").replace(/^Completed /, "");
  const detailSource = parseChecklistDetailSource(search.source);
  const detailOrigin = getChecklistDetailOrigin(
    detailSource,
    search.traveler,
    workspace.traveler.displayName,
  );
  const detailHref = buildSltTripPrepRouteHref(
    `/slt-prep/checklist/${workspace.item.id}${detailSource ? `?source=${detailSource}` : ""}`,
    {
      travelerId: search.traveler,
    },
  );
  const completionPreviewHref = `${detailHref}${detailHref.includes("?") ? "&" : "?"}preview=complete#completion-preview`;
  const supportHref = buildSltTripPrepRouteHref("/slt-prep/profile#notification-actions", {
    source: detailSource === "staff" ? "staff" : undefined,
    travelerId: search.traveler,
  });
  const completionBackHref = detailOrigin?.href ?? buildSltTripPrepRouteHref("/slt-prep/checklist", {
    travelerId: search.traveler,
  });
  const completionBackLabel = detailOrigin?.backLabel ?? "Back to checklist";
  const relatedLinks = workspace.relatedLinks.map((link) => ({
    ...link,
    href: buildSltTripPrepRouteHref(link.href, {
      source: detailSource === "staff" ? "staff" : undefined,
      travelerId: search.traveler,
    }),
  }));

  return (
    <AppShell
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

      <section className="overflow-hidden rounded-[1.8rem] border border-[#1565c0]/12 bg-white shadow-[0_18px_55px_rgba(8,34,76,0.08)]">
        <div className="bg-[#0b66cc] px-5 pb-5 pt-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                {workspace.item.category}
              </p>
              <h1 className="mt-2 text-[1.85rem] font-semibold tracking-tight">
                {detailTitle}
              </h1>
            </div>
            <SltPrepTonePill
              tone={
                workspace.item.status === "needs_attention"
                  ? "red"
                  : workspace.item.status === "complete"
                    ? "green"
                    : "yellow"
              }
              label={statusLabel}
            />
          </div>
        </div>

        <div className="space-y-5 px-4 pb-5 pt-4">
          {detailOrigin ? (
            <section className="rounded-[1.5rem] border border-slate-200 bg-[#fbfdff] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0b66cc]">
                    {detailOrigin.eyebrow}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-950">
                    {detailOrigin.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {search.preview === "complete"
                      ? detailOrigin.submitDetail
                      : detailOrigin.detail}
                  </p>
                </div>
                <Link
                  href={detailOrigin.href}
                  className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  {detailOrigin.backLabel}
                </Link>
              </div>
            </section>
          ) : null}

          {isFlightForm ? (
            <div className="grid grid-cols-2 gap-3">
              <DetailStat label="Status" value={statusLabel} />
              <DetailStat label="Due Date" value={dueDateValue} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <DetailStat label="Status" value={workspace.item.dueLabel} />
              <DetailStat label="Readiness" value={`${workspace.readinessScore}% ready`} />
            </div>
          )}

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-950">Why MEDLIFE needs this</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {isFlightForm
                ? "This helps MEDLIFE organize airport pickup and trip logistics. We need to know when you're arriving and departing to ensure smooth transfers and coordination."
                : workspace.item.whyItMatters}
            </p>
          </section>

          {isFlightForm ? (
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-slate-950">Flight Information</h2>
              <div className="mt-4 grid gap-4">
                <InputField label="Airline" placeholder="e.g., United Airlines" />
                <InputField label="Flight Number" placeholder="e.g., UA 123" />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Arrival Date" placeholder="06/21/2026" />
                  <InputField label="Arrival Time" placeholder="12:30 PM" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Departure Date" placeholder="06/21/2026" />
                  <InputField label="Departure Time" placeholder="12:30 PM" />
                </div>
                <InputField label="Airport" placeholder="e.g., Lima Jorge Chávez" />
                <div className="rounded-[1.2rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    Upload Confirmation (Optional)
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Click to upload or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-slate-400">PDF, PNG, or JPG (max. 5MB)</p>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-slate-950">What happens next</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{workspace.item.nextStep}</p>
              <div className="mt-4 rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Evidence requirement
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {workspace.item.evidenceRequirement}
                </p>
              </div>
            </section>
          )}

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <Link
              href={completionPreviewHref}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#0b66cc] px-4 py-3 text-sm font-semibold text-white"
            >
              {search.preview === "complete" ? "Completion preview open" : `Submit ${detailTitle}`}
            </Link>
            <Link
              href={supportHref}
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Need help? Contact support
            </Link>
          </section>

          {search.preview === "complete" ? (
            <section
              id="completion-preview"
              className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Completion preview
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">
                This item is ready for staff review.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                This preview keeps the route stateful without turning on a live write. Staff can
                review the submission context, and the traveler can jump back into trip prep
                if anything still needs attention.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={buildSltTripPrepRouteHref("/slt-prep/staff", {
                    travelerId: search.traveler,
                  })}
                  className="inline-flex rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700"
                >
                  Open staff dashboard
                </Link>
                <Link
                  href={completionBackHref}
                  className="inline-flex rounded-full border border-transparent bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700"
                >
                  {completionBackLabel}
                </Link>
              </div>
            </section>
          ) : null}

          <section className="rounded-[1.5rem] border border-slate-200 bg-[#fbfdff] p-4">
            <h2 className="text-lg font-semibold text-slate-950">Related routes</h2>
            <div className="mt-4 grid gap-3">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-[1rem] border border-slate-200 bg-white px-3 py-3 transition hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{link.label}</p>
                      <p className="mt-1 text-sm text-slate-500">{link.helper}</p>
                    </div>
                    <SltPrepTonePill tone={link.tone} label="Open" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </AppShell>
  );
}

function InputField({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        readOnly
        aria-label={label}
        placeholder={placeholder}
        className="mt-2 w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none"
      />
    </label>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function parseChecklistDetailSource(value?: string): SltChecklistDetailSource | null {
  switch (value) {
    case "overview":
    case "checklist":
    case "forms":
    case "payments":
    case "flights":
    case "meetings":
    case "extensions":
    case "notifications":
    case "profile":
    case "staff":
      return value;
    default:
      return null;
  }
}

function getChecklistDetailOrigin(
  source: SltChecklistDetailSource | null,
  travelerId?: string,
  travelerDisplayName?: string,
) {
  const travelerLabel = travelerDisplayName ?? "the selected traveler";

  switch (source) {
    case "overview":
      return {
        eyebrow: "From overview",
        title: `This detail opened from ${travelerLabel}'s SLT overview deadlines.`,
        detail: `The overview route is trying to pull you into the most important open blocker first, so this detail should still feel attached to ${travelerLabel}'s readiness summary.`,
        submitDetail:
          "You are previewing completion from the overview handoff. Keep the resolution tied to the deadline the overview screen surfaced.",
        href: buildSltTripPrepRouteHref("/slt-prep", { travelerId }),
        backLabel: "Back to overview",
      };
    case "checklist":
      return {
        eyebrow: "From checklist",
        title: `This detail opened from ${travelerLabel}'s trip-prep checklist.`,
        detail: `The checklist route is the task inventory. This detail should still feel like one item inside that bigger readiness flow, not a disconnected form for ${travelerLabel}.`,
        submitDetail:
          "You are previewing completion from the checklist handoff. Keep the evidence and next step anchored to the exact item you opened there.",
        href: buildSltTripPrepRouteHref("/slt-prep/checklist", { travelerId }),
        backLabel: "Back to checklist",
      };
    case "forms":
      return {
        eyebrow: "From forms",
        title: `This detail opened from the forms hub for ${travelerLabel}.`,
        detail: `The forms route should keep document status and signature risk readable, so this checklist detail still needs to feel like the next action from that forms surface for ${travelerLabel}.`,
        submitDetail:
          "You are previewing completion from the forms handoff. Keep the update tied to the document state that the forms route surfaced.",
        href: buildSltTripPrepRouteHref("/slt-prep/forms", { travelerId }),
        backLabel: "Back to forms",
      };
    case "payments":
      return {
        eyebrow: "From payments",
        title: `This detail opened from payment status for ${travelerLabel}.`,
        detail: `The payments route is meant to clarify what is paid, due, or under review, so this checklist detail should still feel tied to that finance posture for ${travelerLabel}.`,
        submitDetail:
          "You are previewing completion from the payments handoff. Keep the update connected to the payment blocker that the finance route exposed.",
        href: buildSltTripPrepRouteHref("/slt-prep/payments", { travelerId }),
        backLabel: "Back to payments",
      };
    case "flights":
      return {
        eyebrow: "From flights",
        title: `This detail opened from the traveler flight review for ${travelerLabel}.`,
        detail: `The flights route is meant to keep itinerary status and airport coordination visible, so this detail should still feel like a drill-down from that travel surface for ${travelerLabel}.`,
        submitDetail:
          "You are previewing completion from the flights handoff. Keep the update tied to the itinerary blocker that was visible on the flights route.",
        href: buildSltTripPrepRouteHref("/slt-prep/flights", { travelerId }),
        backLabel: "Back to flights",
      };
    case "meetings":
      return {
        eyebrow: "From meetings",
        title: `This detail opened from the meetings route for ${travelerLabel}.`,
        detail: `The meetings surface is supposed to keep attendance and the next required session clear, so this detail should still read like a drill-down from that plan for ${travelerLabel}.`,
        submitDetail:
          "You are previewing completion from the meetings handoff. Keep the change tied to the prep meeting that the traveler still needs to complete.",
        href: buildSltTripPrepRouteHref("/slt-prep/meetings", { travelerId }),
        backLabel: "Back to meetings",
      };
    case "extensions":
      return {
        eyebrow: "From extensions",
        title: `This detail opened from extensions and tours for ${travelerLabel}.`,
        detail: `The extensions route should separate optional add-ons from required readiness, so this detail still needs to feel attached to that decision lane for ${travelerLabel}.`,
        submitDetail:
          "You are previewing completion from the extensions handoff. Keep the update tied to the add-on decision that route surfaced.",
        href: buildSltTripPrepRouteHref("/slt-prep/extensions", { travelerId }),
        backLabel: "Back to extensions",
      };
    case "notifications":
      return {
        eyebrow: "From notifications",
        title: `This detail opened from a readiness update for ${travelerLabel}.`,
        detail: `The notification feed is meant to point you into the exact traveler blocker that changed, so the detail route should keep that alert context visible for ${travelerLabel}.`,
        submitDetail:
          "You are previewing completion from the notification handoff. Keep the update specific to the alert that sent you here.",
        href: buildSltTripPrepRouteHref("/slt-prep/notifications", { travelerId }),
        backLabel: "Back to notifications",
      };
    case "profile":
      return {
        eyebrow: "From profile",
        title: `This detail opened from profile and notifications for ${travelerLabel}.`,
        detail: `The profile route blends traveler identity with recent updates, so the detail page should still feel like the next prep move surfaced from that member-owned destination for ${travelerLabel}.`,
        submitDetail:
          "You are previewing completion from the profile handoff. Keep the resolution tied to the profile update that brought you here.",
        href: buildSltTripPrepRouteHref("/slt-prep/profile", { travelerId }),
        backLabel: "Back to profile",
      };
    case "staff":
      return {
        eyebrow: "From staff dashboard",
        title: `This detail opened from staff traveler review for ${travelerLabel}.`,
        detail: `The staff dashboard is a reviewer surface, so this detail should still feel like a drill-down from a named readiness concern for ${travelerLabel}, not a generic traveler form.`,
        submitDetail:
          "You are previewing completion from the staff handoff. Keep the change tied to the blocker the reviewer was inspecting.",
        href: buildSltTripPrepRouteHref("/slt-prep/staff", { travelerId }),
        backLabel: "Back to staff dashboard",
      };
    default:
      return null;
  }
}
