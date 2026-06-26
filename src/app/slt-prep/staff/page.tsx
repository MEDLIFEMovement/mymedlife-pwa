import Link from "next/link";
import { SltPrepShell } from "@/components/slt-prep-shell";
import {
  SltPrepSectionCard,
  SltPrepTonePill,
} from "@/components/slt-prep-primitives";
import { SltPrepSubnav } from "@/components/slt-prep-subnav";
import { RestrictedState } from "@/components/restricted-state";
import { getLandingRouteForActor } from "@/services/landing-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import {
  getSltTripPrepStaffWorkspace,
  type SltTripPrepStaffBulkAction,
  type SltTripPrepStaffFocusFilter,
  type SltTripPrepStaffRiskFilter,
} from "@/services/slt-trip-prep-staff-workspace";
import {
  buildSltTripPrepRouteHref,
  getSltTripPrepSubnavItems,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrepStaff");
export const dynamic = "force-dynamic";

type StaffPageProps = {
  searchParams?: Promise<{
    risk?: string;
    focus?: string;
    bulk?: string;
    source?: string;
    traveler?: string;
  }>;
};

export default async function SltPrepStaffPage({ searchParams }: StaffPageProps) {
  const emptySearchParams: {
    risk?: string;
    focus?: string;
    bulk?: string;
    source?: string;
    traveler?: string;
  } = {};
  const [actor, search] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const travelerPacketSource = "staff" as const;
  const riskFilter = parseRiskFilter(search.risk);
  const focusFilter = parseFocusFilter(search.focus);
  const bulkAction = parseBulkAction(search.bulk);
  const workspace = getSltTripPrepStaffWorkspace(actor, {
    riskFilter,
    focusFilter,
    bulkAction,
    travelerId: search.traveler,
  });
  const selectedTravelerId = workspace.selectedTraveler?.id ?? search.traveler;
  const surfaceFamily = getActorSurfaceFamily(actor);
  const restrictedNextHref =
    surfaceFamily === "ds_admin"
      ? "/admin"
      : getLandingRouteForActor(actor);
  const restrictedNextLabel =
    surfaceFamily === "ds_admin"
      ? "Open integration safety"
      : surfaceFamily === "member"
        ? "Open student home"
        : surfaceFamily === "leader"
          ? "Open chapter home"
          : "Open your owned surface";
  const filterOptions = [
    {
      label: "All",
      active: workspace.riskFilter === "all" && workspace.focusFilter === "all",
      href: buildStaffHref({
        risk: "all",
        focus: "all",
        bulk: workspace.bulkAction,
        traveler: workspace.selectedTraveler?.id,
      }),
    },
    {
      label: "Missing Flights",
      active: workspace.focusFilter === "flights" && workspace.riskFilter === "all",
      href: buildStaffHref({
        risk: "all",
        focus: "flights",
        bulk: workspace.bulkAction,
        traveler: workspace.selectedTraveler?.id,
      }),
    },
    {
      label: "Missing Forms",
      active: workspace.focusFilter === "forms" && workspace.riskFilter === "all",
      href: buildStaffHref({
        risk: "all",
        focus: "forms",
        bulk: workspace.bulkAction,
        traveler: workspace.selectedTraveler?.id,
      }),
    },
    {
      label: "Unpaid Balance",
      active: workspace.focusFilter === "payments" && workspace.riskFilter === "all",
      href: buildStaffHref({
        risk: "all",
        focus: "payments",
        bulk: workspace.bulkAction,
        traveler: workspace.selectedTraveler?.id,
      }),
    },
    {
      label: "High Risk",
      active: workspace.riskFilter === "high" && workspace.focusFilter === "all",
      href: buildStaffHref({
        risk: "high",
        focus: "all",
        bulk: workspace.bulkAction,
        traveler: workspace.selectedTraveler?.id,
      }),
    },
  ];
  const bulkOptions = [
    {
      label: "Payment follow-up",
      value: "payment-follow-up" as const,
      href: buildStaffHref({
        risk: workspace.riskFilter,
        focus: workspace.focusFilter,
        bulk: "payment-follow-up",
        traveler: workspace.selectedTraveler?.id,
      }),
    },
    {
      label: "Meeting make-up",
      value: "meeting-makeup" as const,
      href: buildStaffHref({
        risk: workspace.riskFilter,
        focus: workspace.focusFilter,
        bulk: "meeting-makeup",
        traveler: workspace.selectedTraveler?.id,
      }),
    },
    {
      label: "Traveler review",
      value: "packet-review" as const,
      href: buildStaffHref({
        risk: workspace.riskFilter,
        focus: workspace.focusFilter,
        bulk: "packet-review",
        traveler: workspace.selectedTraveler?.id,
      }),
    },
  ];

  return (
    <SltPrepShell actor={actor} hideTopHeader showDebugTools={false}>
      <SltPrepSubnav
        items={getSltTripPrepSubnavItems({
          source: travelerPacketSource,
          travelerId: selectedTravelerId,
        })}
      />

      {!workspace.canReadDashboard || !workspace.selectedTraveler ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={restrictedNextHref}
          nextLabel={restrictedNextLabel}
        />
      ) : (
        <>
          <section className="overflow-hidden rounded-[2rem] border border-[#bfdbfe] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_55%,#eef4ff_100%)] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
              Traveler readiness
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">{workspace.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Sort the traveler portfolio by risk, open the next blocker quickly, and keep support follow-up readable without leaving the dashboard.
            </p>
            <div className="mt-4 grid grid-cols-4 gap-3">
              <StaffHeroStat label="Total travelers" value={`${workspace.counts.totalTravelers}`} />
              <StaffHeroStat label="Ready" value={`${workspace.counts.readyTravelers}`} />
              <StaffHeroStat
                label="Need attention"
                value={`${workspace.counts.needsAttentionTravelers}`}
              />
              <StaffHeroStat label="High risk" value={`${workspace.counts.highRiskTravelers}`} />
            </div>
            <div className="mt-4 rounded-[1.4rem] border border-[#bfdbfe] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Status filters
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {filterOptions.map((filter) => (
                  <Link
                    key={filter.label}
                    href={filter.href}
                    aria-current={filter.active ? "page" : undefined}
                    className={[
                      "rounded-full border px-4 py-2 text-sm font-semibold transition",
                      filter.active
                        ? "border-[#2563eb]/35 bg-[#dbeafe] text-[#1d4ed8]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[#bfdbfe] hover:bg-[#f8fbff] hover:text-slate-950",
                    ].join(" ")}
                  >
                    {filter.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <div className="grid gap-4 rounded-[2rem] bg-[#eef3fb] p-4 shadow-[0_18px_50px_rgba(5,24,60,0.12)]">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Portfolio
                  </p>
                  <h2 className="mt-2 text-[1.6rem] font-semibold text-slate-950">
                    Traveler portfolio
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    Scan readiness, risk, owner, and next blocker in one pass before opening the traveler detail.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Bulk actions
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {bulkOptions.map((option) => (
                      <Link
                        key={option.value}
                        href={option.href}
                        aria-current={workspace.bulkAction === option.value ? "page" : undefined}
                        className={[
                          "rounded-full border px-4 py-2 text-sm font-semibold transition",
                          workspace.bulkAction === option.value
                            ? "border-[#2563eb]/35 bg-[#dbeafe] text-[#1d4ed8]"
                            : "border-slate-200 bg-white text-slate-700 hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950",
                        ].join(" ")}
                      >
                        {option.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead>
                    <tr className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <th className="px-3 py-3">Traveler</th>
                      <th className="px-3 py-3">Chapter</th>
                      <th className="px-3 py-3">Readiness</th>
                      <th className="px-3 py-3">Risk</th>
                      <th className="px-3 py-3">Next owner</th>
                      <th className="px-3 py-3">Next blocker</th>
                      <th className="px-3 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {workspace.travelers.map((traveler) => {
                      const isSelected = traveler.id === workspace.selectedTraveler?.id;

                      return (
                        <tr
                          key={traveler.id}
                          className={isSelected ? "bg-[#eef5ff]" : "bg-white"}
                        >
                          <td className="px-3 py-4 align-top">
                            <Link
                              href={buildStaffHref({
                                risk: workspace.riskFilter,
                                focus: workspace.focusFilter,
                                bulk: workspace.bulkAction,
                                traveler: traveler.id,
                              })}
                              className="font-semibold text-slate-950"
                            >
                              {traveler.displayName}
                            </Link>
                          </td>
                          <td className="px-3 py-4 align-top text-sm text-slate-600">
                            {traveler.chapterName}
                          </td>
                          <td className="px-3 py-4 align-top">
                            <p className="font-semibold text-slate-950">{traveler.readinessScore}% ready</p>
                            <p className="mt-1 text-xs text-slate-500">{traveler.openItems} open items</p>
                          </td>
                          <td className="px-3 py-4 align-top">
                            <SltPrepTonePill
                              tone={
                                traveler.riskLabel === "high"
                                  ? "red"
                                  : traveler.riskLabel === "medium"
                                    ? "yellow"
                                    : "green"
                              }
                              label={traveler.riskLabel}
                            />
                          </td>
                          <td className="px-3 py-4 align-top text-sm text-slate-600">
                            {traveler.nextOwner}
                          </td>
                          <td className="px-3 py-4 align-top">
                            <p className="text-sm leading-6 text-slate-600">{traveler.focusSummary}</p>
                          </td>
                          <td className="px-3 py-4 align-top text-right">
                            <Link
                              href={traveler.detailHref}
                              className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0b66cc]"
                            >
                              {traveler.detailLabel}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {workspace.bulkActionPreview ? (
              <section className="rounded-[2rem] border border-[#2563eb]/30 bg-[#dbeafe] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1d4ed8]">
                  Bulk preview
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {workspace.bulkActionPreview}
                </p>
              </section>
            ) : null}

            <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
              <SltPrepSectionCard eyebrow="Reviewer context" title="Next reviewer moves">
                <div className="space-y-3">
                  <div className="app-surface-soft rounded-[1.25rem] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Chapter and trip
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {workspace.selectedTraveler.chapterName} • {workspace.selectedTraveler.tripLabel}
                    </p>
                  </div>
                  <div className="app-surface-soft rounded-[1.25rem] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Readiness
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {workspace.selectedTravelerReadiness}% ready
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {workspace.selectedTraveler.checklist.filter((item) => item.status !== "complete").length} open checklist items
                    </p>
                  </div>
                  {workspace.selectedTravelerHighlights.map((highlight) => (
                    <p
                      key={highlight}
                      className="app-surface-soft rounded-[1.25rem] p-4 text-sm leading-6 text-slate-600"
                    >
                      {highlight}
                    </p>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={buildSltTripPrepRouteHref("/slt-prep", {
                        source: travelerPacketSource,
                        travelerId: selectedTravelerId,
                      })}
                      className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-[#08224c]"
                    >
                      Open traveler mobile view
                    </Link>
                    {workspace.selectedTravelerDrilldown ? (
                      <Link
                        href={workspace.selectedTravelerDrilldown.href}
                        className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        Review blocker detail
                      </Link>
                    ) : null}
                  </div>
                </div>
              </SltPrepSectionCard>

              <SltPrepSectionCard eyebrow="Selected traveler" title={workspace.selectedTraveler.displayName}>
                <div className="space-y-3">
                  <div className="app-surface-soft rounded-[1.25rem] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Related routes
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={buildSltTripPrepRouteHref("/slt-prep/profile", {
                          source: travelerPacketSource,
                          travelerId: selectedTravelerId,
                        })}
                        className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        Profile
                      </Link>
                      <Link
                        href={buildSltTripPrepRouteHref("/slt-prep/flights", {
                          source: travelerPacketSource,
                          travelerId: selectedTravelerId,
                        })}
                        className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        Flights
                      </Link>
                      <Link
                        href={buildSltTripPrepRouteHref("/slt-prep/timeline", {
                          source: travelerPacketSource,
                          travelerId: selectedTravelerId,
                        })}
                        className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        Timeline
                      </Link>
                    </div>
                  </div>
                  {workspace.selectedTravelerDrilldown ? (
                    <div className="app-surface-soft rounded-[1.25rem] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Review blocker detail
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {workspace.selectedTravelerDrilldown.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {workspace.selectedTravelerDrilldown.helper}
                      </p>
                      <Link
                        href={workspace.selectedTravelerDrilldown.href}
                        className="mt-3 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0b66cc]"
                      >
                        Open blocker detail
                      </Link>
                    </div>
                  ) : null}
                </div>
              </SltPrepSectionCard>
            </section>
          </div>
        </>
      )}
    </SltPrepShell>
  );
}

function parseRiskFilter(value: string | undefined): SltTripPrepStaffRiskFilter {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }

  return "all";
}

function parseFocusFilter(value: string | undefined): SltTripPrepStaffFocusFilter {
  if (
    value === "payments" ||
    value === "forms" ||
    value === "flights" ||
    value === "meetings"
  ) {
    return value;
  }

  return "all";
}

function parseBulkAction(value: string | undefined): SltTripPrepStaffBulkAction {
  if (
    value === "payment-follow-up" ||
    value === "meeting-makeup" ||
    value === "packet-review"
  ) {
    return value;
  }

  return "none";
}

function buildStaffHref({
  risk,
  focus,
  bulk,
  traveler,
}: {
  risk: string;
  focus: string;
  bulk: string;
  traveler?: string | null;
}) {
  const searchParams = new URLSearchParams();

  if (risk && risk !== "all") {
    searchParams.set("risk", risk);
  }

  if (focus && focus !== "all") {
    searchParams.set("focus", focus);
  }

  if (bulk && bulk !== "none") {
    searchParams.set("bulk", bulk);
  }

  if (traveler) {
    searchParams.set("traveler", traveler);
  }

  const query = searchParams.toString();

  return query ? `/slt-prep/staff?${query}` : "/slt-prep/staff";
}

function StaffHeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[#bfdbfe] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
