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
  getSltTripPrepChecklistWorkspace,
  getSltTripPrepSubnavItems,
  type SltTripPrepChecklistFilter,
  sltTripPrepMobileQuickNavItems,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import type { TripPrepChecklistItem } from "@/shared/types/slt-trip-prep";
import { getSltPrepPageContext } from "../page-context";

export const metadata = getStaticRouteMetadata("sltPrepChecklist");
export const dynamic = "force-dynamic";

type ChecklistPageProps = {
  searchParams?: Promise<{
    filter?: string;
  }>;
};

export default async function SltPrepChecklistPage({ searchParams }: ChecklistPageProps) {
  const emptySearchParams: { filter?: string } = {};
  const [{ actor, data }, search] = await Promise.all([
    getSltPrepPageContext("/slt-prep/checklist"),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const filter = parseChecklistFilter(search.filter);
  const workspace = getSltTripPrepChecklistWorkspace(actor, filter);

  return (
    <AppShell
      actor={actor}
      hideTopHeader
      mobileQuickItemsOverride={[...sltTripPrepMobileQuickNavItems]}
    >
      <DataSourceNotice source={data.source} />
      <SltPrepSubnav items={[...getSltTripPrepSubnavItems(actor)]} />

      {!workspace.canReadChecklist || !workspace.traveler ? (
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
              <div className="flex items-center gap-3">
                <Link href="/slt-prep" className="text-sm font-semibold text-white/86">
                  ← Trip Prep
                </Link>
                <h1 className="text-lg font-semibold text-white">Readiness Checklist</h1>
              </div>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm leading-6 text-slate-600">
                Use the checklist the way the exported SLT screen intends: open one item at a time,
                see what is complete, what is due soon, and what still needs follow-up before departure.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SltPrepMiniStat label="Total items" value={`${workspace.counts.total}`} variant="light" />
                <SltPrepMiniStat label="Complete" value={`${workspace.counts.complete}`} variant="light" />
                <SltPrepMiniStat
                  label="Needs attention"
                  value={`${workspace.counts.needsAttention}`}
                  variant="light"
                />
                <SltPrepMiniStat label="Upcoming" value={`${workspace.counts.upcoming}`} variant="light" />
              </div>
            </div>
          </section>

          <section className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All" },
              { key: "needs_attention", label: "Due Soon / Missing" },
              { key: "complete", label: "Complete" },
            ].map((option) => {
              const isActive = option.key === workspace.filter;

              return (
                <Link
                  key={option.key}
                  href={`/slt-prep/checklist?filter=${option.key}`}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    isActive
                      ? "border-[#0066CC] bg-[#0066CC] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950",
                  ].join(" ")}
                >
                  {option.label}
                </Link>
              );
            })}
          </section>

          <SltPrepSectionCard eyebrow="Checklist items" title="Open each missing or due-soon item" variant="light">
            <div className="grid gap-3">
              {groupChecklistItems(workspace.items).map((group) => (
                <section key={group.label}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-bold tracking-tight text-slate-900">{group.label}</h2>
                    <span className="text-sm text-slate-400">
                      {group.items.filter((item) => item.status === "complete").length}/{group.items.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <Link
                        key={item.id}
                        href={`/slt-prep/checklist/${item.id}`}
                        className="block rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300 hover:bg-slate-100/80"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-semibold text-slate-950">{item.title}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                {item.dueLabel}
                              </span>
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                {item.mockSource}
                              </span>
                            </div>
                          </div>
                          <SltPrepTonePill
                            tone={toChecklistTone(item)}
                            label={getChecklistLabel(item)}
                            variant="light"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </SltPrepSectionCard>
        </>
      )}
    </AppShell>
  );
}

function parseChecklistFilter(value: string | undefined): SltTripPrepChecklistFilter {
  if (value === "complete") {
    return "complete";
  }

  if (value === "needs_attention") {
    return "needs_attention";
  }

  return "all";
}

function groupChecklistItems(items: TripPrepChecklistItem[]) {
  const groups = [
    { label: "Payments", match: (item: TripPrepChecklistItem) => item.category === "Payments" },
    {
      label: "Required Forms",
      match: (item: TripPrepChecklistItem) => item.category === "Required forms",
    },
    {
      label: "Travel Details",
      match: (item: TripPrepChecklistItem) =>
        item.category === "Travel docs" || item.category === "Flights",
    },
    { label: "Meetings", match: (item: TripPrepChecklistItem) => item.category === "Meetings" },
    {
      label: "Extensions / Extra Tours",
      match: (item: TripPrepChecklistItem) => item.category === "Extensions",
    },
  ];

  return groups
    .map((group) => ({
      label: group.label,
      items: items.filter(group.match),
    }))
    .filter((group) => group.items.length > 0);
}

function toChecklistTone(item: TripPrepChecklistItem): "red" | "yellow" | "green" {
  if (item.status === "needs_attention") {
    return "red";
  }

  if (item.status === "in_review" || item.status === "upcoming") {
    return "yellow";
  }

  return "green";
}

function getChecklistLabel(item: TripPrepChecklistItem) {
  switch (item.status) {
    case "needs_attention":
      return "Missing";
    case "in_review":
      return "In review";
    case "upcoming":
      return "Due soon";
    case "complete":
      return "Complete";
  }
}
