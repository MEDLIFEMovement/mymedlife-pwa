import Link from "next/link";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { NickMvpReviewPanel } from "@/components/nick-mvp-review-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getNickMvpReviewPacket } from "@/services/nick-mvp-review";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminNickReview");
export const dynamic = "force-dynamic";

export default async function AdminNickReviewPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const packet = getNickMvpReviewPacket(actor);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav current="nick_review" />

      {!packet.canReadPacket ? (
        <RestrictedState
          title={packet.title}
          message={packet.summary}
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100">
                  Nick review
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">
                  Final local MVP review before any pilot decision.
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
                  This route gathers the final local review sequence, owner lanes,
                  pass signals, and launch boundaries in one place. It is for
                  review only: live auth, writes, uploads, sends, and invitations
                  stay blocked.
                </p>
              </div>
              <Link
                href="/admin/review-path"
                className="w-fit rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
              >
                Open review path
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MiniStat
              label="Local review"
              value={packet.localReviewReady ? "yes" : "no"}
            />
            <MiniStat
              label="Live launch"
              value={packet.liveLaunchReady ? "yes" : "no"}
            />
            <MiniStat label="Items" value={`${packet.counts.reviewItems}`} />
            <MiniStat label="Writes" value={`${packet.browserWritesExpected}`} />
            <MiniStat label="Invites" value={`${packet.studentInvitationsExpected}`} />
          </section>

          <NickMvpReviewPanel packet={packet} />
        </>
      )}
    </AppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
