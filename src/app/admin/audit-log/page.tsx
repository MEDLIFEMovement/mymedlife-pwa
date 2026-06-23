import Link from "next/link";
import { AdminAuditLogReviewPanel } from "@/components/admin-audit-log-review-panel";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { getAdminAuditLogReview } from "@/services/admin-audit-log-review";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminAuditLog");
export const dynamic = "force-dynamic";

export default async function AdminAuditLogPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const review = getAdminAuditLogReview(actor, data);
  const nextStep = getNextStep(actor);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      {!review.canReadReview ? (
        <RestrictedState
          title={review.title}
          message={review.summary}
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-100">
                  Admin audit log
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">
                  {review.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
                  Review persisted audit readback posture before any production
                  write path is approved. DS Admin can confirm safety posture
                  without row-level chapter/member audit details.
                </p>
              </div>
              <Link
                href={nextStep.href}
                className="w-fit rounded-full bg-violet-300 px-4 py-2 text-sm font-semibold text-[#170d29]"
              >
                {nextStep.label}
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MiniStat label="Visible rows" value={`${review.counts.visibleRows}`} />
            <MiniStat label="Hidden rows" value={`${review.counts.hiddenRows}`} />
            <MiniStat label="Writes" value={`${review.counts.browserWritesEnabled}`} />
            <MiniStat label="Sends" value={`${review.counts.externalWritesEnabled}`} />
            <MiniStat label="Secrets" value={`${review.counts.secretsShown}`} />
          </section>

          <AdminAuditLogReviewPanel review={review} />
        </>
      )}
    </AppShell>
  );
}

function getNextStep(actor: LocalActorContext) {
  if (getActorSurfaceFamily(actor) === "ds_admin") {
    return {
      label: "Open integration outbox",
      href: "/admin/integration-outbox",
    };
  }

  return {
    label: "Review write sequence",
    href: "/admin/write-sequence",
  };
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
