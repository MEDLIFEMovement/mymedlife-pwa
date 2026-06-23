import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SltPrepTonePill } from "@/components/slt-prep-primitives";
import { SltPrepSubnav } from "@/components/slt-prep-subnav";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { buildSltChecklistDetailHref } from "@/services/slt-checklist-detail-href";
import {
  buildSltTripPrepRouteHref,
  getSltTripPrepMobileQuickNavItems,
  getSltTripPrepSubnavItems,
  getSltTripPrepChecklistWorkspace,
  parseSltTripPrepRouteSource,
  type SltTripPrepChecklistFilter,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import type { TripPrepChecklistItem } from "@/shared/types/slt-trip-prep";

export const metadata = getStaticRouteMetadata("sltPrepChecklist");
export const dynamic = "force-dynamic";

type ChecklistPageProps = {
  searchParams?: Promise<{
    filter?: string;
    source?: string;
    traveler?: string;
  }>;
};

const filterOptions: ReadonlyArray<{
  key: SltTripPrepChecklistFilter;
  label: string;
}> = [
  { key: "all", label: "All" },
  { key: "missing", label: "Missing" },
  { key: "due_soon", label: "Due Soon" },
  { key: "complete", label: "Complete" },
];

export default async function SltPrepChecklistPage({
  searchParams,
}: ChecklistPageProps) {
  const emptySearchParams: { filter?: string; source?: string; traveler?: string } = {};
  const [actor, search] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const filter = parseChecklistFilter(search.filter);
  const routeSource = parseSltTripPrepRouteSource(search.source);
  const workspace = getSltTripPrepChecklistWorkspace(actor, filter, search.traveler);

  if (!workspace.canReadChecklist || !workspace.traveler) {
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
          nextHref={buildSltTripPrepRouteHref("/slt-prep", { travelerId: search.traveler })}
          nextLabel="Back to trip prep"
        />
      </AppShell>
    );
  }

  const groupedItems = groupChecklistItems(workspace.items);

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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/72">
            Trip Prep
          </p>
          <h1 className="mt-2 text-[1.9rem] font-semibold tracking-tight">
            Readiness Checklist
          </h1>
          <p className="mt-2 text-sm text-white/80">
            Open the red items first, then clear the soon items before departure week.
          </p>
        </div>

        <div className="space-y-5 px-4 pb-5 pt-4">
          <div className="grid grid-cols-3 gap-3">
            <ChecklistStat label="Total" value={`${workspace.counts.total}`} />
            <ChecklistStat label="Missing" value={`${workspace.counts.needsAttention}`} />
            <ChecklistStat label="Done" value={`${workspace.counts.complete}`} />
          </div>

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => {
              const isActive = option.key === workspace.filter;

              return (
                <Link
                  key={option.key}
                  href={buildSltTripPrepRouteHref(`/slt-prep/checklist?filter=${option.key}`, {
                    travelerId: search.traveler,
                  })}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    isActive
                      ? "border-[#0b66cc] bg-[#e8f1ff] text-[#0b66cc]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-[#bfd8ff] hover:text-slate-950",
                  ].join(" ")}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>

          <div className="space-y-4">
            {groupedItems.map(([category, items]) => (
              <section
                key={category}
                className="rounded-[1.5rem] border border-slate-200 bg-[#fbfdff] p-4"
              >
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">{category}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {items.filter((item) => item.status === "complete").length}/{items.length} complete
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={buildSltChecklistDetailHref(item.id, {
                        source: "checklist",
                        travelerId: search.traveler,
                      })}
                      className={[
                        "block rounded-[1.2rem] border bg-white p-4 transition hover:bg-slate-50",
                        getChecklistAccentClassName(item.status),
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{item.summary}</p>
                        </div>
                        <SltPrepTonePill
                          tone={toChecklistTone(item.status)}
                          label={getChecklistLabel(item.status)}
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                          {item.dueLabel}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                          {item.mockSource}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function parseChecklistFilter(value: string | undefined): SltTripPrepChecklistFilter {
  if (value === "complete") {
    return "complete";
  }

  if (value === "due_soon") {
    return "due_soon";
  }

  if (value === "missing" || value === "needs_attention") {
    return "missing";
  }

  return "all";
}

function groupChecklistItems(items: TripPrepChecklistItem[]) {
  const sections = new Map<string, TripPrepChecklistItem[]>();

  items.forEach((item) => {
    const existing = sections.get(item.category) ?? [];
    existing.push(item);
    sections.set(item.category, existing);
  });

  return [...sections.entries()];
}

function toChecklistTone(status: TripPrepChecklistItem["status"]): "red" | "yellow" | "green" {
  if (status === "needs_attention") {
    return "red";
  }

  if (status === "in_review" || status === "upcoming") {
    return "yellow";
  }

  return "green";
}

function getChecklistLabel(status: TripPrepChecklistItem["status"]) {
  if (status === "needs_attention") {
    return "Action needed";
  }

  if (status === "in_review" || status === "upcoming") {
    return "Due soon";
  }

  return "Done";
}

function getChecklistAccentClassName(status: TripPrepChecklistItem["status"]) {
  if (status === "needs_attention") {
    return "border-l-[6px] border-l-rose-500 border-t-slate-200 border-r-slate-200 border-b-slate-200";
  }

  if (status === "in_review" || status === "upcoming") {
    return "border-l-[6px] border-l-amber-400 border-t-slate-200 border-r-slate-200 border-b-slate-200";
  }

  return "border-l-[6px] border-l-emerald-500 border-t-slate-200 border-r-slate-200 border-b-slate-200";
}

function ChecklistStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
