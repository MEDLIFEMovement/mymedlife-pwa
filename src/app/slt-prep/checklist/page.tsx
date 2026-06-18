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
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import {
  getSltTripPrepChecklistWorkspace,
  type SltTripPrepChecklistFilter,
  sltTripPrepSubnavItems,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrepChecklist");
export const dynamic = "force-dynamic";

type ChecklistPageProps = {
  searchParams?: Promise<{
    filter?: string;
  }>;
};

export default async function SltPrepChecklistPage({
  searchParams,
}: ChecklistPageProps) {
  const emptySearchParams: { filter?: string } = {};
  const [actor, data, search] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const filter = parseChecklistFilter(search.filter);
  const workspace = getSltTripPrepChecklistWorkspace(actor, filter);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <SltPrepSubnav items={[...sltTripPrepSubnavItems]} />

      {!workspace.canReadChecklist || !workspace.traveler ? (
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
              Traveler readiness checklist
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{workspace.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
              {workspace.summary}
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SltPrepMiniStat label="Total items" value={`${workspace.counts.total}`} />
            <SltPrepMiniStat label="Complete" value={`${workspace.counts.complete}`} />
            <SltPrepMiniStat
              label="Needs follow-up"
              value={`${workspace.counts.needsAttention}`}
            />
            <SltPrepMiniStat label="Upcoming" value={`${workspace.counts.upcoming}`} />
          </section>

          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All items" },
              { key: "needs_attention", label: "Needs follow-up" },
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
                      ? "border-[#f7d05e]/35 bg-[#f7d05e]/14 text-white"
                      : "border-white/10 bg-black/20 text-white/70 hover:border-white/20 hover:text-white",
                  ].join(" ")}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>

          <SltPrepSectionCard eyebrow="Checklist items" title="Open one item at a time">
            <div className="grid gap-3">
              {workspace.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/slt-prep/checklist/${item.id}`}
                  className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4 transition hover:border-[#f7d05e]/35 hover:bg-white/[0.07]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
                        {item.category}
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-white">{item.title}</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/68">
                        {item.summary}
                      </p>
                    </div>
                    <SltPrepTonePill
                      tone={toChecklistTone(item.status)}
                      label={item.status.replace("_", " ")}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/54">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                      {item.dueLabel}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                      {item.owner}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                      {item.mockSource}
                    </span>
                  </div>
                </Link>
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

function toChecklistTone(status: string): "red" | "yellow" | "green" {
  if (status === "needs_attention") {
    return "red";
  }

  if (status === "in_review" || status === "upcoming") {
    return "yellow";
  }

  return "green";
}
