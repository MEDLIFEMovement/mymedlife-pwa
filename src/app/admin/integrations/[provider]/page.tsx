import Link from "next/link";
import {
  disableIntegrationConnectionAction,
  testIntegrationConnectionAction,
  submitIntegrationCredentialAction,
} from "@/app/admin/integrations/actions";
import { AdminIntegrationsStepUpPanel } from "@/components/admin-integrations-step-up-panel";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminAppShell } from "@/components/admin-app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { MetricCard } from "@/components/metric-card";
import { RestrictedState } from "@/components/restricted-state";
import { getAdminIntegrationProviderWorkspace } from "@/services/admin-integrations-workspace";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminIntegrationProvider");
export const dynamic = "force-dynamic";

type AdminIntegrationProviderPageProps = {
  params: Promise<{ provider: string }>;
  searchParams?: Promise<{
    integrationResult?: string;
    integrationMessage?: string;
    env?: string;
  }>;
};

export default async function AdminIntegrationProviderPage(
  props: AdminIntegrationProviderPageProps,
) {
  const [{ provider }, actor, data, search] = await Promise.all([
    props.params,
    getLocalActorContext(),
    getReadOnlyAppData(),
    props.searchParams ?? Promise.resolve(undefined),
  ]);
  const workspace = await getAdminIntegrationProviderWorkspace(actor, provider, search);

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav current="integrations" showIntegrations />

      {!workspace.guard.canRenderLockedState && !workspace.canReadWorkspace ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={workspace.nextStep.href}
          nextLabel={workspace.nextStep.label}
        />
      ) : !workspace.canReadWorkspace ? (
        <AdminIntegrationsStepUpPanel
          title={workspace.guard.title}
          message={workspace.guard.message}
        />
      ) : (
        <>
          <section className="app-surface-info overflow-hidden rounded-[2rem] p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mymedlife-primary-button)]">
                  Provider detail
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                  {workspace.title}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {workspace.summary}
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <HeroMiniStat
                    label="Environments"
                    value={String(workspace.environments.length)}
                    detail="Local, staging, production"
                  />
                  <HeroMiniStat
                    label="Configured"
                    value={String(
                      workspace.environments.filter((env) => env.connectionId !== null).length,
                    )}
                    detail="Masked hints only"
                  />
                  <HeroMiniStat
                    label="Audit rows"
                    value={String(workspace.auditRows.length)}
                    detail="Safe readback only"
                  />
                </div>
                <p className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Write-only secrets, masked hints, audited changes
                </p>
              </div>
              <Link
                href={workspace.nextStep.href}
                className="rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-info)]"
              >
                {workspace.nextStep.label}
              </Link>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            <MetricCard
              label="Environments"
              value={String(workspace.environments.length)}
              note="Local, staging, and production posture"
            />
            <MetricCard
              label="Configured"
              value={String(
                workspace.environments.filter((env) => env.connectionId !== null).length,
              )}
              note="Masked credentials or metadata already saved"
            />
            <MetricCard
              label="Audit rows"
              value={String(workspace.auditRows.length)}
              note="Safe readback without raw secret exposure"
            />
          </section>

          <section className="app-surface rounded-[1.35rem] p-3">
            <div className="flex flex-wrap gap-2">
              {[
                { href: "#overview", label: "Overview" },
                { href: "#environments", label: "Environments" },
                { href: "#audit", label: "Audit" },
              ].map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:text-slate-950"
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </section>

          {workspace.resultBanner ? (
            <section
              className={[
                "rounded-[1.6rem] border px-4 py-3 text-sm leading-6",
                workspace.resultBanner.tone === "success"
                  ? "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]"
                  : workspace.resultBanner.tone === "warning"
                    ? "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]"
                    : "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]",
              ].join(" ")}
            >
              <p className="font-semibold">{workspace.resultBanner.title}</p>
              <p className="mt-1">{workspace.resultBanner.message}</p>
            </section>
          ) : null}

          <section id="overview" className="app-surface rounded-[1.7rem] p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
              <div>
                <p className="app-eyebrow app-eyebrow-slate">Overview</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Write-only credentials, visible posture.
                </h2>
                <p className="app-copy mt-3 max-w-2xl">
                  Saved values stay hidden after commit. The browser only shows the metadata, safe test state, and audit history needed to review the connector.
                </p>
              </div>
              <div className="grid gap-2">
                <StatusSummaryChip label="Raw secrets" value="Never shown" />
                <StatusSummaryChip label="Test posture" value="Safe read only" />
                <StatusSummaryChip label="Production changes" value="Extra confirmation" />
              </div>
            </div>
          </section>

          <section id="environments" className="grid gap-4">
            {workspace.environments.map((environment) => (
              <article
                key={`${workspace.providerKey}-${environment.environment}`}
                className="app-surface rounded-[1.7rem] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="app-eyebrow app-eyebrow-slate">
                        {environment.environment}
                      </p>
                      <span className="rounded-full border border-slate-200 bg-[var(--mymedlife-badge-background)] px-2.5 py-1 text-xs font-semibold text-slate-500">
                        {environment.status}
                      </span>
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                      {environment.displayName}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Status: {environment.status}. Last test: {environment.lastTestStatus.replaceAll("_", " ")}.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:w-[31rem]">
                    <div className="rounded-2xl border border-slate-200 bg-[var(--mymedlife-surface-hover)] px-4 py-3 text-sm leading-6 text-slate-600">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Masked hint
                      </p>
                      <p className="mt-2 font-medium text-slate-900">
                        {environment.maskedHint ?? "No credential saved"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Version: {environment.secretVersion}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-[var(--mymedlife-surface-hover)] px-4 py-3 text-sm leading-6 text-slate-600">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Ownership
                      </p>
                      <p className="mt-2 font-medium text-slate-900">{environment.ownerTeam}</p>
                      <p className="mt-1 text-xs text-slate-500">Last tested {environment.lastTestedAt}</p>
                    </div>
                  </div>
                </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr_1fr]">
                    <form
                      action={submitIntegrationCredentialAction}
                    className="rounded-[1.4rem] border border-slate-200 bg-[var(--mymedlife-surface-hover)] p-4 shadow-[0_10px_24px_rgb(var(--mymedlife-shadow-rgb)/0.04)]"
                    >
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Credentials
                      </p>
                      <input type="hidden" name="providerKey" value={workspace.providerKey ?? ""} />
                    <input type="hidden" name="environment" value={environment.environment} />
                    <input
                      type="hidden"
                      name="returnTo"
                      value={`/admin/integrations/${workspace.providerKey}`}
                    />
                    <div className="grid gap-3">
                      <label className="grid gap-2 text-sm font-semibold text-slate-950">
                        Display name
                        <input
                          name="displayName"
                          defaultValue={environment.displayName}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none"
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold text-slate-950">
                        Owner team
                        <input
                          name="ownerTeam"
                          defaultValue={environment.ownerTeam}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none"
                        />
                      </label>
                      {workspace.provider?.metadataFields.map((field) => (
                        <label
                          key={`${environment.environment}-${field.key}`}
                          className="grid gap-2 text-sm font-semibold text-slate-950"
                        >
                          {field.label}
                          {field.type === "textarea" ? (
                            <textarea
                              name={`metadata__${field.key}`}
                              defaultValue={
                                environment.metadataRows.find((row) => {
                                  return row.label === field.key.replaceAll("_", " ");
                                })?.value ?? ""
                              }
                              className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none"
                            />
                          ) : (
                            <input
                              name={`metadata__${field.key}`}
                              type={field.type}
                              defaultValue={
                                environment.metadataRows.find((row) => {
                                  return row.label === field.key.replaceAll("_", " ");
                                })?.value ?? ""
                              }
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none"
                            />
                          )}
                          <span className="text-xs font-normal leading-5 text-slate-500">
                            {field.helpText}
                          </span>
                        </label>
                      ))}
                      <label className="grid gap-2 text-sm font-semibold text-slate-950">
                        Scope summary
                        <textarea
                          name="scopeSummary"
                          defaultValue={environment.scopes.join("\n")}
                          className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none"
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold text-slate-950">
                        Secret value
                        <input
                          name="secretValue"
                          type="password"
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none"
                        />
                        <span className="text-xs font-normal leading-5 text-slate-500">
                          Raw values are stored server-side only and never shown again after save.
                        </span>
                      </label>
                      <label className="grid gap-2 text-sm font-semibold text-slate-950">
                        Expires at
                        <input
                          name="expiresAt"
                          type="date"
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none"
                        />
                      </label>
                      {environment.environment === "production" ? (
                        <label className="grid gap-2 text-sm font-semibold text-slate-950">
                          Type PRODUCTION to confirm
                          <input
                            name="productionConfirmation"
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none"
                          />
                        </label>
                      ) : null}
                      <label className="grid gap-2 text-sm font-semibold text-slate-950">
                        Reason for change
                        <textarea
                          name="reason"
                          className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none"
                        />
                      </label>
                      <button
                        type="submit"
                        className="rounded-full bg-[var(--mymedlife-primary-button)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-info)]"
                      >
                        Save write-only credential
                      </button>
                    </div>
                  </form>

                    <form
                      action={testIntegrationConnectionAction}
                      className="rounded-[1.4rem] border border-slate-200 bg-[var(--mymedlife-badge-background)] p-4 shadow-[0_10px_24px_rgb(var(--mymedlife-shadow-rgb)/0.04)]"
                    >
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Health check
                      </p>
                      <input type="hidden" name="providerKey" value={workspace.providerKey ?? ""} />
                    <input type="hidden" name="environment" value={environment.environment} />
                    <input
                      type="hidden"
                      name="returnTo"
                      value={`/admin/integrations/${workspace.providerKey}`}
                    />
                    <h3 className="text-lg font-semibold text-slate-950">Health check</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Safe server-side connection test only. No provider writes and no raw auth responses are exposed.
                    </p>
                    <input
                      type="hidden"
                      name="reason"
                      value="Safe read-only connection test from DS/Admin integrations console."
                    />
                    <button
                      type="submit"
                      className="mt-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:text-slate-950"
                    >
                      Run safe test
                    </button>
                    <p className="mt-4 text-xs leading-5 text-slate-500">
                      {environment.lastTestMessage}
                    </p>
                  </form>

                    <form
                      action={disableIntegrationConnectionAction}
                      className="rounded-[1.4rem] border border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] p-4 shadow-[0_10px_24px_rgb(var(--mymedlife-shadow-rgb)/0.04)]"
                    >
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-info)]">
                        Disable path
                      </p>
                      <input
                        type="hidden"
                        name="providerKey"
                        value={workspace.providerKey ?? ""}
                      />
                      <input
                        type="hidden"
                        name="environment"
                        value={environment.environment}
                      />
                      <input
                        type="hidden"
                        name="returnTo"
                        value={`/admin/integrations/${workspace.providerKey}`}
                      />
                      <h3 className="text-lg font-semibold text-slate-950">Disable connector</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        This stops future use of the configured reference for this environment and
                        records the action in audit history.
                      </p>
                      <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-950">
                        Reason for disable
                        <textarea
                          name="reason"
                          className="min-h-24 rounded-2xl border border-[var(--mymedlife-border)] bg-white px-4 py-3 text-sm text-slate-950 outline-none"
                        />
                      </label>
                      <button
                        type="submit"
                        className="mt-4 rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-info)]"
                      >
                        Disable connector
                      </button>
                    </form>
                </div>
              </article>
            ))}
          </section>

          <section id="audit" className="app-surface rounded-[1.7rem] p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-slate-950">Recent audit activity</h2>
              <Link
                href="/admin/integrations/audit"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Full audit
              </Link>
            </div>
            <div className="mt-4 grid gap-3">
              {workspace.auditRows.slice(0, 6).map((row) => (
                <article
                  key={row.id}
                  className="rounded-2xl border border-slate-200 bg-[var(--mymedlife-badge-background)] p-4"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <span>{row.action.replaceAll("_", " ")}</span>
                    <span>{row.result}</span>
                    <span>{row.environment ?? "all envs"}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{row.reason}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </AdminAppShell>
  );
}

function HeroMiniStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[1.15rem] border border-white/12 bg-white/8 p-3.5">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/48">
        {label}
      </p>
      <p className="mt-1.5 text-xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-white/66">{detail}</p>
    </article>
  );
}

function StatusSummaryChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[1.2rem] border border-slate-200 bg-[var(--mymedlife-badge-background)] px-4 py-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </article>
  );
}
