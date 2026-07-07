import Link from "next/link";
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
  getSltTripPrepStaffWorkspace,
  type SltTripPrepStaffBulkAction,
  type SltTripPrepStaffFocusFilter,
  type SltTripPrepStaffRiskFilter,
} from "@/services/slt-trip-prep-staff-workspace";
import { getSltTripPrepSubnavItems } from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getSltPrepPageContext } from "../page-context";

export const metadata = getStaticRouteMetadata("sltPrepStaff");
export const dynamic = "force-dynamic";

type StaffPageProps = {
  searchParams?: Promise<{
    risk?: string;
    focus?: string;
    bulk?: string;
    traveler?: string;
  }>;
};

export default async function SltPrepStaffPage({ searchParams }: StaffPageProps) {
  const emptySearchParams: {
    risk?: string;
    focus?: string;
    bulk?: string;
    traveler?: string;
  } = {};
  const [{ actor, data }, search] = await Promise.all([
    getSltPrepPageContext("/slt-prep/staff"),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const riskFilter = parseRiskFilter(search.risk);
  const focusFilter = parseFocusFilter(search.focus);
  const bulkAction = parseBulkAction(search.bulk);
  const workspace = getSltTripPrepStaffWorkspace(actor, {
    riskFilter,
    focusFilter,
    bulkAction,
    travelerId: search.traveler,
  });

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <SltPrepSubnav items={[...getSltTripPrepSubnavItems(actor)]} />

      {!workspace.canReadDashboard || !workspace.selectedTraveler ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref="/slt-prep"
          nextLabel="Open traveler view"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
              Staff dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{workspace.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
              {workspace.summary}
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SltPrepMiniStat label="Visible travelers" value={`${workspace.counts.totalTravelers}`} />
            <SltPrepMiniStat label="High risk" value={`${workspace.counts.highRiskTravelers}`} />
            <SltPrepMiniStat
              label="Open items"
              value={`${workspace.counts.openChecklistItems}`}
            />
            <SltPrepMiniStat
              label="Selected readiness"
              value={`${workspace.selectedTravelerReadiness}%`}
            />
          </section>

          <section className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
                Risk filters
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["all", "All travelers"],
                  ["high", "High risk"],
                  ["medium", "Medium risk"],
                  ["low", "Low risk"],
                ].map(([value, label]) => (
                  <Link
                    key={value}
                    href={buildStaffHref({
                      risk: value,
                      focus: workspace.focusFilter,
                      bulk: workspace.bulkAction,
                      traveler: workspace.selectedTraveler?.id,
                    })}
                    aria-current={workspace.riskFilter === value ? "page" : undefined}
                    className={[
                      "rounded-full border px-4 py-2 text-sm font-semibold transition",
                      workspace.riskFilter === value
                        ? "border-[#f7d05e]/35 bg-[#f7d05e]/14 text-white"
                        : "border-white/10 bg-black/20 text-white/70 hover:border-white/20 hover:text-white",
                    ].join(" ")}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
                Focus
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["all", "All blockers"],
                  ["payments", "Payments"],
                  ["forms", "Forms"],
                  ["flights", "Flights"],
                  ["meetings", "Meetings"],
                ].map(([value, label]) => (
                  <Link
                    key={value}
                    href={buildStaffHref({
                      risk: workspace.riskFilter,
                      focus: value,
                      bulk: workspace.bulkAction,
                      traveler: workspace.selectedTraveler?.id,
                    })}
                    aria-current={workspace.focusFilter === value ? "page" : undefined}
                    className={[
                      "rounded-full border px-4 py-2 text-sm font-semibold transition",
                      workspace.focusFilter === value
                        ? "border-[#f7d05e]/35 bg-[#f7d05e]/14 text-white"
                        : "border-white/10 bg-black/20 text-white/70 hover:border-white/20 hover:text-white",
                    ].join(" ")}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
                Bulk action previews
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["none", "None"],
                  ["payment-follow-up", "Finance follow-up"],
                  ["meeting-makeup", "Meeting make-up"],
                  ["packet-review", "Packet review"],
                ].map(([value, label]) => (
                  <Link
                    key={value}
                    href={buildStaffHref({
                      risk: workspace.riskFilter,
                      focus: workspace.focusFilter,
                      bulk: value,
                      traveler: workspace.selectedTraveler?.id,
                    })}
                    aria-current={workspace.bulkAction === value ? "page" : undefined}
                    className={[
                      "rounded-full border px-4 py-2 text-sm font-semibold transition",
                      workspace.bulkAction === value
                        ? "border-[#f7d05e]/35 bg-[#f7d05e]/14 text-white"
                        : "border-white/10 bg-black/20 text-white/70 hover:border-white/20 hover:text-white",
                    ].join(" ")}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {workspace.bulkActionPreview ? (
            <section className="rounded-[2rem] border border-[#f7d05e]/25 bg-[#f7d05e]/12 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f7d05e]">
                Bulk preview
              </p>
              <p className="mt-3 text-sm leading-6 text-white/78">
                {workspace.bulkActionPreview}
              </p>
            </section>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <SltPrepSectionCard eyebrow="Portfolio table" title="Who needs staff attention first?">
              <div className="grid gap-3">
                {workspace.travelers.map((traveler) => (
                  <Link
                    key={traveler.id}
                    href={buildStaffHref({
                      risk: workspace.riskFilter,
                      focus: workspace.focusFilter,
                      bulk: workspace.bulkAction,
                      traveler: traveler.id,
                    })}
                    className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4 transition hover:border-[#f7d05e]/35 hover:bg-white/[0.07]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-white">{traveler.displayName}</h2>
                        <p className="mt-1 text-sm text-white/58">{traveler.chapterName}</p>
                        <p className="mt-2 text-sm leading-6 text-white/68">
                          {traveler.focusSummary}
                        </p>
                      </div>
                      <div className="text-right">
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
                        <p className="mt-3 text-sm font-semibold text-white">
                          {traveler.readinessScore}% ready
                        </p>
                        <p className="mt-1 text-xs text-white/52">
                          {traveler.openItems} open items • {traveler.nextOwner}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </SltPrepSectionCard>

            <SltPrepSectionCard eyebrow="Selected traveler" title={workspace.selectedTraveler.displayName}>
              <div className="space-y-3">
                <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/46">
                    Chapter and trip
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/72">
                    {workspace.selectedTraveler.chapterName} • {workspace.selectedTraveler.tripLabel}
                  </p>
                </div>
                {workspace.selectedTravelerHighlights.map((highlight) => (
                  <p
                    key={highlight}
                    className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/68"
                  >
                    {highlight}
                  </p>
                ))}
                <Link
                  href="/slt-prep"
                  className="inline-flex rounded-full bg-[#f7d05e] px-4 py-2 text-sm font-semibold text-[#08224c]"
                >
                  Open traveler mobile view
                </Link>
              </div>
            </SltPrepSectionCard>
          </section>
        </>
      )}
    </AppShell>
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
