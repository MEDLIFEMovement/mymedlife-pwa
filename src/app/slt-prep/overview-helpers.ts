import type { getSltTripPrepWorkspace } from "@/services/slt-trip-prep-workspace";
import { buildSltChecklistDetailHref } from "@/services/slt-checklist-detail-href";
import type { TripPrepChecklistItem } from "@/shared/types/slt-trip-prep";

export type SltPrepOverviewWorkspace = Awaited<
  ReturnType<typeof getSltTripPrepWorkspace>
>;

export function buildOverviewCtas(workspace: SltPrepOverviewWorkspace) {
  return [
    {
      href: workspace.nextStep.href,
      eyebrow: "Complete Next Step",
      title: workspace.nextStep.label,
      detail: workspace.nextStep.summary,
      className:
        "rounded-[1.25rem] border border-[#0b66cc]/20 bg-[#edf5ff] px-4 py-4 transition hover:border-[#0b66cc]/35 hover:bg-[#e6f0ff]",
    },
    {
      href: "/slt-prep/staff",
      eyebrow: "Staff Dashboard Access",
      title: "Traveler Readiness Dashboard",
      detail:
        "Open the staff review surface with risk filters, traveler detail, and bulk support posture.",
      className:
        "rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4 transition hover:border-[#bfd8ff] hover:bg-[#dbeafe]",
    },
  ] as const;
}

export function buildChecklistCards(workspace: SltPrepOverviewWorkspace) {
  if (!workspace.traveler) {
    return [];
  }

  const duePayments = workspace.traveler.payments.filter((item) => item.status === "due");
  const pendingForms = workspace.traveler.forms.filter((item) => item.status !== "submitted");
  const unresolvedFlights = workspace.traveler.flights.filter(
    (item) => item.status !== "confirmed",
  );
  const pendingMeetings = workspace.traveler.meetings.filter(
    (item) => item.status !== "attended",
  );
  const undecidedExtensions = workspace.traveler.extensions.filter(
    (item) => item.status !== "selected",
  );
  const prepItems = workspace.traveler.checklist.filter((item) => {
    return item.category === "Travel docs" || item.category === "Required forms";
  });

  return [
    {
      href:
        getPriorityChecklistDetailHref(workspace.traveler.checklist, "Payments") ??
        "/slt-prep/payments",
      label: "Payments",
      helper:
        duePayments.length > 0
          ? `${duePayments.length} item overdue`
          : "All payment steps are on track",
      tone: duePayments.length > 0 ? "red" : "green",
      pill: duePayments.length > 0 ? "Action needed" : "Done",
      borderClassName:
        duePayments.length > 0
          ? "border-l-[6px] border-l-blue-500 border-t-slate-200 border-r-slate-200 border-b-slate-200"
          : "border-l-[6px] border-l-blue-500 border-t-slate-200 border-r-slate-200 border-b-slate-200",
    },
    {
      href:
        getPriorityChecklistDetailHref(workspace.traveler.checklist, "Required forms") ??
        "/slt-prep/forms",
      label: "Required Forms",
      helper:
        pendingForms.length > 0
          ? `${pendingForms.length} item due soon`
          : "All required forms are submitted",
      tone: pendingForms.length > 0 ? "yellow" : "green",
      pill: pendingForms.length > 0 ? "Due soon" : "Done",
      borderClassName:
        pendingForms.length > 0
          ? "border-l-[6px] border-l-blue-400 border-t-slate-200 border-r-slate-200 border-b-slate-200"
          : "border-l-[6px] border-l-blue-500 border-t-slate-200 border-r-slate-200 border-b-slate-200",
    },
    {
      href:
        getPriorityChecklistDetailHref(workspace.traveler.checklist, "Flights") ??
        "/slt-prep/flights",
      label: "Travel Details",
      helper:
        unresolvedFlights.length > 0
          ? `${unresolvedFlights.length} item overdue`
          : "Flight details are complete",
      tone: unresolvedFlights.length > 0 ? "red" : "green",
      pill: unresolvedFlights.length > 0 ? "Action needed" : "Done",
      borderClassName:
        unresolvedFlights.length > 0
          ? "border-l-[6px] border-l-blue-500 border-t-slate-200 border-r-slate-200 border-b-slate-200"
          : "border-l-[6px] border-l-blue-500 border-t-slate-200 border-r-slate-200 border-b-slate-200",
    },
    {
      href:
        getPriorityChecklistDetailHref(workspace.traveler.checklist, "Meetings") ??
        "/slt-prep/meetings",
      label: "Meetings",
      helper:
        pendingMeetings.length > 0
          ? `${pendingMeetings.length} item due soon`
          : "Pre-trip meetings are complete",
      tone: pendingMeetings.length > 0 ? "yellow" : "green",
      pill: pendingMeetings.length > 0 ? "Due soon" : "Done",
      borderClassName:
        pendingMeetings.length > 0
          ? "border-l-[6px] border-l-blue-400 border-t-slate-200 border-r-slate-200 border-b-slate-200"
          : "border-l-[6px] border-l-blue-500 border-t-slate-200 border-r-slate-200 border-b-slate-200",
    },
    {
      href:
        getPriorityChecklistDetailHref(workspace.traveler.checklist, "Extensions") ??
        "/slt-prep/extensions",
      label: "Extensions / Extra Tours",
      helper:
        undecidedExtensions.length > 0
          ? `${workspace.traveler.extensions.filter((item) => item.status === "selected").length} of ${workspace.traveler.extensions.length} complete`
          : "Extensions are locked",
      tone: undecidedExtensions.length > 0 ? "yellow" : "green",
      pill: undecidedExtensions.length > 0 ? "Pending" : "Done",
      borderClassName:
        undecidedExtensions.length > 0
          ? "border-l-[6px] border-l-slate-300 border-t-slate-200 border-r-slate-200 border-b-slate-200"
          : "border-l-[6px] border-l-blue-500 border-t-slate-200 border-r-slate-200 border-b-slate-200",
    },
    {
      href: "/slt-prep/checklist",
      label: "Packing & Preparation",
      helper: `${prepItems.filter((item) => item.status === "complete").length} of ${prepItems.length} complete`,
      tone:
        prepItems.some((item) => item.status === "needs_attention")
          ? "red"
          : prepItems.some((item) => item.status !== "complete")
            ? "yellow"
            : "green",
      pill:
        prepItems.some((item) => item.status === "needs_attention")
          ? "Action needed"
          : prepItems.some((item) => item.status !== "complete")
            ? "Pending"
            : "Done",
      borderClassName:
        prepItems.some((item) => item.status === "needs_attention")
          ? "border-l-[6px] border-l-blue-500 border-t-slate-200 border-r-slate-200 border-b-slate-200"
          : prepItems.some((item) => item.status !== "complete")
            ? "border-l-[6px] border-l-slate-300 border-t-slate-200 border-r-slate-200 border-b-slate-200"
            : "border-l-[6px] border-l-blue-500 border-t-slate-200 border-r-slate-200 border-b-slate-200",
    },
  ] as const;
}

function getPriorityChecklistDetailHref(
  items: TripPrepChecklistItem[],
  category: TripPrepChecklistItem["category"],
) {
  const categoryItems = items.filter((item) => item.category === category);

  const priorityItem =
    categoryItems.find((item) => item.status === "needs_attention") ??
    categoryItems.find((item) => item.status === "in_review") ??
    categoryItems.find((item) => item.status === "upcoming");

  return priorityItem
    ? buildSltChecklistDetailHref(priorityItem.id, { source: "overview" })
    : null;
}
