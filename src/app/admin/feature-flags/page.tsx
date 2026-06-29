import { AdminAppShell } from "@/components/admin-app-shell";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { ControlReviewSnapshotSection } from "@/components/control-review-snapshot-section";
import { ProductionControlApprovalTrail } from "@/components/production-control-approval-trail";
import { RestrictedState } from "@/components/restricted-state";
import { getFeatureFlagAuditEmptyStateCopy } from "@/modules/admin/control-audit-empty-state";
import {
  canManageFeatureFlags,
  featureFlagEnvironments,
  featureFlagStatuses,
  getCurrentFeatureEnvironment,
  getFeatureFlagAdminState,
  getFeatureFlagDefinitions,
  type FeatureFlagEnvironment,
  type FeatureFlagResolvedState,
} from "@/modules/feature-flags";
import {
  getDsSecretStepUpState,
  needsFreshProductionStepUp,
} from "@/services/admin-integrations-step-up";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getLandingRouteForActor } from "@/services/landing-route";
import { updateFeatureFlagAction } from "./actions";

export const dynamic = "force-dynamic";

type FeatureFlagsPageProps = {
  searchParams?: Promise<{
    env?: string;
    featureFlagResult?: string;
    featureFlagMessage?: string;
  }>;
};

export default async function FeatureFlagsPage({
  searchParams,
}: FeatureFlagsPageProps) {
  const [actor, resolvedSearchParams] = await Promise.all([
    getLocalActorContext(),
    searchParams ? searchParams : Promise.resolve(undefined),
  ]);
  const canManage = canManageFeatureFlags(actor);
  const environment = parseEnvironment(resolvedSearchParams?.env);
  const stepUpState = canManage
    ? await getDsSecretStepUpState(actor)
    : null;
  const productionStepUpReady = stepUpState
    ? !needsFreshProductionStepUp(stepUpState)
    : false;
  const adminState = await getFeatureFlagAdminState({ environment });
  const flags = adminState.flags;
  const moduleFlags = flags.filter((flag) => flag.kind === "module");
  const providerFlags = flags.filter((flag) => flag.kind === "provider");
  const auditRecords = adminState.auditRecords;
  const controlReadback = adminState.controlReadback;
  const productionApprovalRecords = adminState.productionApprovalRecords;
  const result = resolvedSearchParams?.featureFlagResult;
  const message = resolvedSearchParams?.featureFlagMessage;
  const reviewSnapshot = getFeatureFlagReviewSnapshot({
    environment,
    persistence: adminState.persistence,
    overrideRowCount: controlReadback.overrideRowCount,
    auditRowCount: controlReadback.auditRowCount,
    stepUpSessionCount: controlReadback.stepUpSessionCount,
    productionApprovalCount: controlReadback.productionApprovalCount,
    productionStepUpReady,
    stepUpMessage:
      stepUpState?.message ?? "Step-up status is unavailable for this role.",
  });
  const productionSafetyGateMessage =
    adminState.persistence.mode === "supabase"
      ? "Production provider flags require an approval reference, a fresh admin step-up session, and a separate durable approval row before the flag change runs."
      : "Production provider flags stay blocked until Supabase-backed control storage and approval rows are available.";

  return (
    <AdminAppShell actor={actor}>
      <AdminBackendLaneNav current="feature_flags" showIntegrations={canManage} />

      {!canManage ? (
        <RestrictedState
          title="Feature flags are restricted."
          message="Only DS Admin and Super Admin can manage module and provider feature flags."
          nextHref={getLandingRouteForActor(actor)}
          nextLabel="Go to your workspace"
        />
      ) : (
        <main className="space-y-5">
          <section className="app-surface-info rounded-[2rem] p-5">
            <p className="app-eyebrow app-eyebrow-blue">Feature flag registry</p>
            <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
              <div>
                <h1 className="text-3xl font-semibold text-slate-950">
                  Turn modules on or off without breaking unrelated work.
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Flags are evaluated server-side. Disabled integrations return graceful fallback
                  states and must not call external APIs. Every status change requires a reason
                  and creates an audit record with actor, role, environment, key, old status,
                  new status, reason, and timestamp.
                </p>
              </div>
              <form action="/admin/feature-flags" className="rounded-2xl border border-[var(--mymedlife-border)] bg-white p-3">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Environment
                  <select
                    name="env"
                    defaultValue={environment}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  >
                    {featureFlagEnvironments.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="mt-3 w-full rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-white">
                  Review environment
                </button>
              </form>
            </div>
          </section>

          {message ? (
            <section
              className={`rounded-2xl border p-4 text-sm font-semibold ${
                result === "success"
                  ? "border-[var(--mymedlife-border)] bg-[var(--background)] text-[var(--mymedlife-info)]"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {message}
            </section>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-11">
            <MiniStat label="Environment" value={environment} />
            <MiniStat label="Persistence" value={adminState.persistence.mode} />
            <MiniStat label="Module flags" value={`${moduleFlags.length}`} />
            <MiniStat label="Provider flags" value={`${providerFlags.length}`} />
            <MiniStat
              label="Enabled now"
              value={`${flags.filter((flag) => flag.enabled).length}`}
            />
            <MiniStat
              label="Override rows"
              value={`${controlReadback.overrideRowCount}`}
            />
            <MiniStat
              label="Audit rows"
              value={`${controlReadback.auditRowCount}`}
            />
            <MiniStat
              label="Step-up rows"
              value={`${controlReadback.stepUpSessionCount}`}
            />
            <MiniStat
              label="Prod approvals"
              value={`${controlReadback.productionApprovalCount}`}
            />
            <MiniStat
              label="Step-up"
              value={productionStepUpReady ? "ready" : stepUpState?.status ?? "locked"}
            />
            <MiniStat
              label="Prod gate"
              value={
                adminState.persistence.mode === "supabase" && productionStepUpReady
                  ? "armed"
                  : "locked"
              }
            />
          </section>

          <section className="rounded-2xl border border-[var(--mymedlife-border)] bg-white p-4 text-sm text-slate-600">
            <span className="font-semibold text-slate-950">Control storage:</span>{" "}
            {adminState.persistence.reason}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4 text-sm text-slate-600">
            <span className="font-semibold text-slate-950">Production safety gate:</span>{" "}
            {productionSafetyGateMessage}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <span className="font-semibold text-slate-950">Step-up status:</span>{" "}
            {stepUpState?.message ?? "Step-up status is unavailable for this role."}
            {stepUpState?.verifiedAt ? (
              <span>
                {" "}
                Verified at {stepUpState.verifiedAt} and expires at {stepUpState.expiresAt}.
              </span>
            ) : null}
          </section>

          <ControlReviewSnapshotSection
            title="Feature flag controls"
            description="Use this snapshot to confirm whether the current environment is still in local review mode or already reading durable control rows, and whether production-sensitive provider changes are actually ready for signoff."
            recordedNow={reviewSnapshot.recordedNow}
            stillBlocked={reviewSnapshot.stillBlocked}
          />

          <FlagSection title="Module Flags" flags={moduleFlags} environment={environment} />
          <FlagSection title="Provider Flags" flags={providerFlags} environment={environment} />

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <p className="app-eyebrow app-eyebrow-blue">Independence checks</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <IndependenceCard
                title="Events can run without SOPs"
                detail="events_luma_points is independent from sop_workflows_next_action, so SOPs can be disabled while event/points views remain available."
              />
              <IndependenceCard
                title="Assignments and UGC are separate"
                detail="task_assignment and ugc_feed_proof each have their own fallback copy and no dependency that blocks events or staff analytics."
              />
              <IndependenceCard
                title="Providers fail closed"
                detail="Provider flags are external API boundaries. When a provider flag is disabled, server services must return fallback state before calling fetch."
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <p className="app-eyebrow app-eyebrow-blue">Audit log</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Recent feature flag changes
            </h2>
            <div className="mt-4 grid gap-3">
              {auditRecords.length > 0 ? (
                auditRecords.map((record) => (
                  <article
                    key={record.id}
                    className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill>{record.environment}</StatusPill>
                      <StatusPill>{record.key}</StatusPill>
                      <StatusPill>{`${record.oldStatus} -> ${record.newStatus}`}</StatusPill>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-950">
                      {record.reason}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {record.actorEmail} / {record.actorRole} / {record.createdAt}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4 text-sm text-slate-600">
                  {getFeatureFlagAuditEmptyStateCopy(
                    adminState.persistence,
                    environment,
                  )}
                </p>
              )}
            </div>
          </section>

          <ProductionControlApprovalTrail
            title="Recent production provider approvals"
            description="Production-sensitive provider flags should leave a separate approval record before the durable flag change runs. Review these rows alongside the feature-flag audit log before treating a production toggle as approved."
            emptyMessage={
              adminState.persistence.mode === "supabase"
                ? "No durable production provider approval rows have been recorded yet."
                : "Production approval rows will appear here once Supabase-backed control storage is active."
            }
            records={productionApprovalRecords}
          />
        </main>
      )}
    </AdminAppShell>
  );
}

function FlagSection({
  title,
  flags,
  environment,
}: {
  title: string;
  flags: FeatureFlagResolvedState[];
  environment: FeatureFlagEnvironment;
}) {
  const definitions = getFeatureFlagDefinitions();

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
      <p className="app-eyebrow app-eyebrow-blue">{title}</p>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {flags.map((flag) => {
          const definition = definitions.find((item) => item.key === flag.key);
          return (
            <article
              key={flag.key}
              className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill>{flag.status}</StatusPill>
                    <StatusPill>{flag.enabled ? "available" : "fallback"}</StatusPill>
                    {flag.externalApiBoundary ? <StatusPill>external boundary</StatusPill> : null}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">
                    {flag.label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {definition?.description}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Fallback: {flag.gracefulFallback}
                  </p>
                  {definition?.dependencies.length ? (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Depends on: {definition.dependencies.join(", ")}
                    </p>
                  ) : null}
                </div>
              </div>
              <form action={updateFeatureFlagAction} className="mt-4 grid gap-3 lg:grid-cols-[10rem_1fr_auto]">
                <input type="hidden" name="returnTo" value={`/admin/feature-flags?env=${environment}`} />
                <input type="hidden" name="environment" value={environment} />
                <input type="hidden" name="flagKey" value={flag.key} />
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Status
                  <select
                    name="nextStatus"
                    defaultValue={flag.status}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  >
                    {featureFlagStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Reason
                  <input
                    name="reason"
                    required
                    minLength={8}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                    placeholder="Explain the operational reason"
                  />
                </label>
                {environment === "production" && flag.externalApiBoundary ? (
                  <div className="rounded-2xl border border-[var(--danger)]/30 bg-rose-50 p-3 lg:col-span-3">
                    <label className="flex items-start gap-2 text-xs font-semibold text-rose-700">
                      <input
                        name="confirmProduction"
                        type="checkbox"
                        className="mt-1"
                      />
                      I confirm this production-sensitive provider change has explicit Nick/DS approval and a fresh admin step-up session.
                    </label>
                    <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
                      Approval reference
                      <input
                        name="approvalReference"
                        className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-800"
                        placeholder="Example: Nick approved in Codex thread on 2026-06-28"
                      />
                    </label>
                  </div>
                ) : null}
                <button className="self-end rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-white">
                  Save
                </button>
              </form>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function StatusPill({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-[var(--mymedlife-border)] bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--mymedlife-info)]">
      {children}
    </span>
  );
}

function IndependenceCard({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-[var(--mymedlife-border)] bg-[var(--background)] p-4">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}

function parseEnvironment(value: string | undefined): FeatureFlagEnvironment {
  if (featureFlagEnvironments.includes(value as FeatureFlagEnvironment)) {
    return value as FeatureFlagEnvironment;
  }

  return getCurrentFeatureEnvironment();
}

function getFeatureFlagReviewSnapshot(input: {
  environment: FeatureFlagEnvironment;
  persistence: {
    mode: "memory" | "supabase";
    requested?: boolean;
    availability?: "disabled" | "unavailable" | "missing_session" | "ready";
    reason: string;
  };
  overrideRowCount: number;
  auditRowCount: number;
  stepUpSessionCount: number;
  productionApprovalCount: number;
  productionStepUpReady: boolean;
  stepUpMessage: string;
}) {
  const persistenceAvailability =
    input.persistence.availability ??
    (input.persistence.mode === "supabase"
      ? "ready"
      : input.persistence.requested
        ? "missing_session"
        : "disabled");
  const recordedNow = [
    input.persistence.mode === "supabase"
      ? {
          label: "Supabase-backed control storage is active",
          detail: `Feature flag controls for ${input.environment} are reading durable rows and writing audited changes through Supabase.`,
        }
      : persistenceAvailability === "missing_session"
        ? {
            label: "Supabase-backed control storage is requested",
            detail: `Feature flag controls for ${input.environment} are configured for durable Supabase rows, but this reviewer session is not signed in for durable control reads or writes yet.`,
          }
        : persistenceAvailability === "unavailable"
          ? {
              label: "Supabase-backed control storage is requested",
              detail: `Feature flag controls for ${input.environment} are pointed at the durable control layer, but this environment is not yet ready to open a Supabase control session.`,
            }
      : {
          label: "Local review posture is still active",
          detail: `Feature flag controls for ${input.environment} are still using in-memory review state until Supabase-backed control storage and a signed-in control session are available.`,
        },
    input.persistence.mode === "supabase"
      ? {
          label: "Visible durable control rows",
          detail: `${input.overrideRowCount} feature flag override row(s), ${input.auditRowCount} durable feature flag audit row(s), ${input.stepUpSessionCount} admin step-up session row(s), and ${input.productionApprovalCount} production approval row(s) are visible for ${input.environment}.`,
        }
      : {
          label: "Visible durable control rows",
          detail: `Durable hosted feature flag readback is not active for ${input.environment} yet, so override rows, audit rows, step-up rows, and approval rows are still zero in this review lane.`,
        },
    {
      label: "Feature flag audit trail",
      detail:
        input.auditRowCount > 0
          ? `${input.auditRowCount} durable feature flag audit row(s) are visible for reviewer readback.`
          : `No feature flag audit rows are currently visible for ${input.environment}.`,
    },
    {
      label: "Production provider approvals",
      detail:
        input.productionApprovalCount > 0
          ? `${input.productionApprovalCount} recent durable production provider approval row(s) are visible in this review lane.`
          : "No durable production provider approval rows are visible yet.",
    },
  ];

  if (input.productionStepUpReady) {
    recordedNow.push({
      label: "Fresh admin step-up is active",
      detail: "Production-sensitive provider changes can clear the step-up requirement for this current admin session.",
    });
  }

  const stillBlocked = [];

  if (input.persistence.mode !== "supabase") {
    stillBlocked.push({
      label:
        persistenceAvailability === "missing_session"
          ? "Reviewer Supabase control session is missing"
          : persistenceAvailability === "unavailable"
            ? "Supabase control layer is requested but unavailable"
            : "Durable control storage is not active yet",
      detail:
        persistenceAvailability === "missing_session"
          ? "Durable feature-flag storage is configured, but this reviewer still needs to sign in through the approved myMEDLIFE auth path before the app can read or write real control rows."
          : persistenceAvailability === "unavailable"
            ? input.persistence.reason
            : "Supabase-backed control storage and a signed-in control session are still required before this environment can claim durable feature-flag readiness.",
    });
  }

  if (!input.productionStepUpReady) {
    stillBlocked.push({
      label: "Production provider changes remain step-up locked",
      detail: input.stepUpMessage,
    });
  }

  if (input.productionApprovalCount === 0) {
    stillBlocked.push({
      label: "No durable production provider approval rows exist yet",
      detail:
        "Critical provider toggles remain blocked until explicit approval rows are recorded alongside the audited flag change.",
    });
  }

  return {
    recordedNow,
    stillBlocked,
  };
}
