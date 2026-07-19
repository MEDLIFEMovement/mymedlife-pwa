import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { RestrictedState } from "@/components/restricted-state";
import { submitHubSpotReadSyncAction } from "@/app/admin/integrations/hubspot/actions";
import { getAdminHubSpotSyncWorkspace } from "@/services/admin-hubspot-sync-workspace";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canAccessAdminWorkspace } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { redirect } from "next/navigation";

export const metadata = getStaticRouteMetadata("adminIntegrationProvider");
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminHubSpotIntegrationPage({ searchParams }: PageProps) {
  const actor = await getLocalActorContext();
  if (shouldRedirectActorToLogin(actor)) redirect(buildLoginRedirectHref("/admin/integrations/hubspot"));
  if (!canAccessAdminWorkspace(actor)) redirect(getLandingRouteForActor(actor));

  const workspace = await getAdminHubSpotSyncWorkspace();
  const params = (await searchParams) ?? {};
  const result = Array.isArray(params.hubspotSyncResult) ? params.hubspotSyncResult[0] : params.hubspotSyncResult;

  return (
    <AppShell actor={actor}>
      <section className="rounded-lg border border-sky-400/20 bg-[#061a33] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Server-only source sync</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">HubSpot chapter and member sync</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">{workspace.message}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/chapters" className="rounded-md bg-sky-300 px-4 py-2 text-sm font-semibold text-[#061a33]">Open chapters</Link>
            <Link href="/admin/integration-outbox" className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white">Open outbox</Link>
          </div>
        </div>
      </section>

      {result ? (
        <section className="mt-4 rounded-lg border border-white/10 bg-white/[0.05] p-4 text-sm text-white">
          Last action result: <strong>{result.replaceAll("_", " ")}</strong>
        </section>
      ) : null}

      {!workspace.canRead ? (
        <RestrictedState title="HubSpot sync readback unavailable" message={workspace.message} nextHref="/admin" nextLabel="Back to admin" />
      ) : (
        <>
          <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Imported companies" value={workspace.counts.companies} />
            <Stat label="Imported contacts" value={workspace.counts.contacts} />
            <Stat label="Imported memberships" value={workspace.counts.memberships} />
            <Stat label="Open failures" value={workspace.counts.openFailures} />
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">Latest run</p>
              {workspace.lastRun ? (
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Detail label="Status" value={workspace.lastRun.status} />
                  <Detail label="Mode" value={workspace.lastRun.mode} />
                  <Detail label="Source companies" value={workspace.lastRun.sourceCompanies} />
                  <Detail label="Source contacts" value={workspace.lastRun.sourceContacts} />
                  <Detail label="Chapters created" value={workspace.lastRun.materializedChapters} />
                  <Detail label="Profiles matched" value={workspace.lastRun.matchedProfiles} />
                  <Detail label="Conflicts" value={workspace.lastRun.conflicts} />
                  <Detail label="Failures" value={workspace.lastRun.failures} />
                </dl>
              ) : <p className="mt-4 text-sm text-white/60">No sync run has completed yet.</p>}
            </article>

            <article className="rounded-lg border border-white/10 bg-black/20 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">Reconciliation queue</p>
              <dl className="mt-4 grid gap-3">
                <Detail label="Pending chapters" value={workspace.counts.pendingCompanies} />
                <Detail label="Pending contacts" value={workspace.counts.pendingContacts} />
                <Detail label="Pending memberships" value={workspace.counts.pendingMemberships} />
              </dl>
            </article>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-2">
            <SyncForm mode="backfill" enabled={workspace.config.enabled} />
            <SyncForm mode="incremental" enabled={workspace.config.enabled} />
          </section>

          <section className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-lg font-semibold text-white">Open failures</h2>
            <div className="mt-4 space-y-2">
              {workspace.failures.length === 0 ? <p className="text-sm text-white/60">No unresolved failures.</p> : workspace.failures.map((failure) => (
                <div key={failure.id} className="rounded-md border border-white/10 bg-black/20 p-3 text-sm text-white/70">
                  <div className="flex justify-between gap-3"><strong className="text-white">{failure.objectType}: {failure.code}</strong><span>{failure.createdAt}</span></div>
                  <p className="mt-2">{failure.message}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

function SyncForm({ mode, enabled }: { mode: "backfill" | "incremental"; enabled: boolean }) {
  const confirmation = mode === "backfill" ? "BACKFILL HUBSPOT" : "SYNC HUBSPOT";
  return (
    <form action={submitHubSpotReadSyncAction} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <h2 className="text-lg font-semibold text-white">{mode === "backfill" ? "Initial backfill" : "Incremental reconciliation"}</h2>
      <p className="mt-2 text-sm leading-6 text-white/60">{mode === "backfill" ? "Reads the full active HubSpot chapter and member set." : "Refreshes the active chapter index and applies member records changed after the last successful checkpoint."} Writes only app-owned records and never sends invitations or HubSpot mutations.</p>
      <input type="hidden" name="mode" value={mode} />
      <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-white/60" htmlFor={`confirmation-${mode}`}>Type {confirmation}</label>
      <input id={`confirmation-${mode}`} name="confirmation" disabled={!enabled} className="mt-2 w-full rounded-md border border-white/15 bg-black/20 px-3 py-2 text-sm text-white" />
      <button type="submit" disabled={!enabled} className="mt-3 rounded-md bg-sky-300 px-4 py-2 text-sm font-semibold text-[#061a33] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40">Run {mode}</button>
    </form>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <article className="rounded-lg border border-white/10 bg-white/[0.04] p-4"><p className="text-xs uppercase tracking-[0.14em] text-white/50">{label}</p><p className="mt-2 text-2xl font-semibold text-white">{value}</p></article>;
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-md border border-white/10 bg-black/20 p-3"><dt className="text-xs uppercase tracking-[0.12em] text-white/45">{label}</dt><dd className="mt-1 text-sm font-semibold text-white">{value}</dd></div>;
}
