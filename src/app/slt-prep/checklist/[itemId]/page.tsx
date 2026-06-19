import Link from "next/link";
import { notFound } from "next/navigation";
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
  getSltTripPrepChecklistDetailWorkspace,
  sltTripPrepMobileQuickNavItems,
  sltTripPrepSubnavItems,
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
  }>;
};

export default async function SltPrepChecklistDetailPage({
  params,
  searchParams,
}: ChecklistDetailPageProps) {
  const { itemId } = await params;
  const emptySearchParams: { preview?: string } = {};
  const [actor, data, search] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const workspace = getSltTripPrepChecklistDetailWorkspace(actor, itemId);

  if (!workspace) {
    notFound();
  }

  return (
    <AppShell actor={actor} mobileQuickItemsOverride={[...sltTripPrepMobileQuickNavItems]}>
      <DataSourceNotice source={data.source} />
      <SltPrepSubnav items={[...sltTripPrepSubnavItems]} />

      {!workspace.canReadDetail || !workspace.item || !workspace.traveler ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref="/slt-prep/checklist"
          nextLabel="Back to checklist"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
                  {workspace.item.category}
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">{workspace.title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
                  {workspace.summary}
                </p>
              </div>
              <SltPrepTonePill
                tone={
                  workspace.item.status === "needs_attention"
                    ? "red"
                    : workspace.item.status === "complete"
                      ? "green"
                      : "yellow"
                }
                label={workspace.item.status.replace("_", " ")}
              />
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SltPrepMiniStat label="Traveler" value={workspace.traveler.firstName} />
            <SltPrepMiniStat label="Due" value={workspace.item.dueLabel} />
            <SltPrepMiniStat
              label="Readiness"
              value={`${workspace.readinessScore}%`}
              note="Current traveler readiness"
            />
            <SltPrepMiniStat label="Owner" value={workspace.item.owner} />
          </section>

          {search.preview === "complete" ? (
            <section className="rounded-[2rem] border border-[#f7d05e]/25 bg-[#f7d05e]/12 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f7d05e]">
                Completion preview
              </p>
              <p className="mt-3 text-sm leading-6 text-white/78">
                This would move the item into a completed state, add an audit row, and update
                traveler readiness after a real write path is approved. No status change is saved
                from this preview.
              </p>
            </section>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <SltPrepSectionCard eyebrow="Why it matters" title="Context for this checkpoint">
              <div className="space-y-4">
                <p className="text-sm leading-6 text-white/72">{workspace.item.whyItMatters}</p>
                <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/46">
                    Evidence requirement
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/72">
                    {workspace.item.evidenceRequirement}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/46">
                    Next step
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/72">{workspace.item.nextStep}</p>
                </div>
              </div>
            </SltPrepSectionCard>

            <SltPrepSectionCard eyebrow="Review posture" title="Keep the write path safely blocked">
              <div className="space-y-3">
                <Link
                  href={`/slt-prep/checklist/${workspace.item.id}?preview=complete`}
                  className="inline-flex rounded-full bg-[#f7d05e] px-4 py-2 text-sm font-semibold text-[#08224c]"
                >
                  Preview completion packet
                </Link>
                {actor.audience === "admin" ||
                actor.audience === "ds_admin" ||
                actor.audience === "super_admin" ? (
                  <Link
                    href={`/admin/slt-checklist-write?travelerId=${workspace.traveler.id}&itemId=${workspace.item.id}`}
                    className="inline-flex rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white/78"
                  >
                    Open admin packet
                  </Link>
                ) : null}
                <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/46">
                    Mock source
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/72">
                    {workspace.item.mockSource}
                  </p>
                </div>
                {workspace.safetyNotes.map((note) => (
                  <p
                    key={note}
                    className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/68"
                  >
                    {note}
                  </p>
                ))}
              </div>
            </SltPrepSectionCard>
          </section>

          <SltPrepSectionCard eyebrow="Related routes" title="Keep the next decision close">
            <div className="grid gap-3 md:grid-cols-2">
              {workspace.relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4 transition hover:border-[#f7d05e]/35 hover:bg-white/[0.07]"
                >
                  <SltPrepTonePill tone={link.tone} label={link.label} />
                  <p className="mt-3 text-sm leading-6 text-white/68">{link.helper}</p>
                </Link>
              ))}
            </div>
          </SltPrepSectionCard>
        </>
      )}
    </AppShell>
  );
}
