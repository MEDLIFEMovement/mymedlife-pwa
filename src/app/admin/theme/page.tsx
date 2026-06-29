import { AdminAppShell } from "@/components/admin-app-shell";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { ControlReviewSnapshotSection } from "@/components/control-review-snapshot-section";
import { ProductionControlApprovalTrail } from "@/components/production-control-approval-trail";
import { RestrictedState } from "@/components/restricted-state";
import { getThemeAuditEmptyStateCopy } from "@/modules/admin/control-audit-empty-state";
import {
  featureFlagEnvironments,
  getCurrentFeatureEnvironment,
  type FeatureFlagEnvironment,
} from "@/modules/feature-flags";
import {
  canManageTheme,
  getThemeAdminState,
  getThemeContrastResults,
  getThemeCssVariables,
  themeTokenOrder,
  type ThemeTokenValue,
} from "@/modules/theme";
import {
  getDsSecretStepUpState,
  needsFreshProductionStepUp,
} from "@/services/admin-integrations-step-up";
import { getLandingRouteForActor } from "@/services/landing-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  publishThemeAction,
  restoreDefaultThemeAction,
  rollbackThemeAction,
  saveThemeDraftAction,
} from "./actions";

export const dynamic = "force-dynamic";

type ThemePageProps = {
  searchParams?: Promise<{
    env?: string;
    themeResult?: string;
    themeMessage?: string;
  }>;
};

export default async function ThemePage({ searchParams }: ThemePageProps) {
  const [actor, resolvedSearchParams] = await Promise.all([
    getLocalActorContext(),
    searchParams ? searchParams : Promise.resolve(undefined),
  ]);
  const canManage = canManageTheme(actor);
  const environment = parseEnvironment(resolvedSearchParams?.env);
  const stepUpState = canManage
    ? await getDsSecretStepUpState(actor)
    : null;
  const productionStepUpReady = stepUpState
    ? !needsFreshProductionStepUp(stepUpState)
    : false;
  const adminState = await getThemeAdminState({ environment });
  const snapshot = adminState.snapshot;
  const contrast = getThemeContrastResults(snapshot);
  const auditRecords = adminState.auditRecords;
  const controlReadback = adminState.controlReadback;
  const productionApprovalRecords = adminState.productionApprovalRecords;
  const result = resolvedSearchParams?.themeResult;
  const message = resolvedSearchParams?.themeMessage;
  const reviewSnapshot = getThemeReviewSnapshot({
    environment,
    persistence: adminState.persistence,
    snapshotRowCount: controlReadback.snapshotRowCount,
    auditRowCount: controlReadback.auditRowCount,
    stepUpSessionCount: controlReadback.stepUpSessionCount,
    productionApprovalCount: controlReadback.productionApprovalCount,
    productionStepUpReady,
    stepUpMessage:
      stepUpState?.message ?? "Step-up status is unavailable for this role.",
  });
  const productionSafetyGateMessage =
    adminState.persistence.mode === "supabase"
      ? "Production theme publish, rollback, and restore actions require an approval reference, a fresh admin step-up session, and a separate durable approval row before the theme change runs."
      : "Production theme changes stay blocked until Supabase-backed control storage and approval rows are available.";

  return (
    <AdminAppShell actor={actor}>
      <AdminBackendLaneNav current="theme" showIntegrations={canManage} />

      {!canManage ? (
        <RestrictedState
          title="Theme admin is restricted."
          message="Only DS Admin and Super Admin can edit, publish, rollback, or restore theme tokens."
          nextHref={getLandingRouteForActor(actor)}
          nextLabel="Go to your workspace"
        />
      ) : (
        <main className="space-y-5">
          <style
            id="mymedlife-theme-preview"
            dangerouslySetInnerHTML={{ __html: getThemeCssVariables(snapshot) }}
          />

          <section className="app-surface-info rounded-[2rem] p-5">
            <p className="app-eyebrow app-eyebrow-blue">Theme admin</p>
            <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
              <div>
                <h1 className="text-3xl font-semibold text-slate-950">
                  Manage myMEDLIFE colors as audited design tokens.
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Theme tokens render as CSS variables. Pantone entries are metadata only;
                  the app renders web-safe hex values. Draft, publish, rollback, and restore
                  actions require a reason and write an audit event.
                </p>
              </div>
              <form action="/admin/theme" className="rounded-2xl border border-[var(--mymedlife-border)] bg-white p-3">
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
            <MiniStat label="Theme status" value={snapshot.status} />
            <MiniStat label="Tokens" value={`${themeTokenOrder.length}`} />
            <MiniStat
              label="Contrast blocks"
              value={`${contrast.filter((item) => item.severity === "block").length}`}
            />
            <MiniStat
              label="Snapshot rows"
              value={`${controlReadback.snapshotRowCount}`}
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
            title="Theme controls"
            description="Use this snapshot to confirm whether theme tokens are still in local review mode or already reading durable snapshots, and whether production theme actions are truly ready for signoff."
            recordedNow={reviewSnapshot.recordedNow}
            stillBlocked={reviewSnapshot.stillBlocked}
          />

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
              <p className="app-eyebrow app-eyebrow-blue">Theme tokens</p>
              <div className="mt-4 grid gap-3">
                {themeTokenOrder.map((key) => (
                  <TokenEditor
                    key={key}
                    token={snapshot.tokens[key]}
                    environment={environment}
                  />
                ))}
              </div>
            </section>

            <aside className="space-y-4">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
                <p className="app-eyebrow app-eyebrow-blue">Preview</p>
                <div
                  className="mt-4 rounded-2xl border p-4"
                  style={{
                    background: "var(--mymedlife-card-block)",
                    borderColor: "var(--mymedlife-border)",
                    color: "var(--foreground)",
                  }}
                >
                  <div
                    className="rounded-xl px-3 py-2 text-sm font-semibold"
                    style={{
                      background: "var(--mymedlife-nav-background)",
                      color: "var(--mymedlife-nav-text)",
                    }}
                  >
                    myMEDLIFE Navigation
                  </div>
                  <h2 className="mt-4 text-xl font-semibold">
                    Rush Month Event Loop
                  </h2>
                  <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                    RSVP, attendance, points, and leaderboard state stay readable.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        background: "var(--mymedlife-badge-background)",
                        color: "var(--mymedlife-badge-text)",
                      }}
                    >
                      20 pts
                    </span>
                    <button
                      className="rounded-full px-4 py-2 text-sm font-semibold"
                      style={{
                        background: "var(--mymedlife-primary-button)",
                        color: "var(--mymedlife-nav-text)",
                      }}
                    >
                      RSVP
                    </button>
                  </div>
                  <div
                    className="mt-4 h-3 rounded-full"
                    style={{ background: "var(--mymedlife-progress-track)" }}
                  >
                    <div
                      className="h-3 w-2/3 rounded-full"
                      style={{ background: "var(--mymedlife-progress-fill)" }}
                    />
                  </div>
                </div>
              </section>

              <ThemeCommand
                environment={environment}
                title="Publish draft"
                action={publishThemeAction}
                buttonLabel="Publish theme"
                includeOverride
                includeProductionApproval
              />
              <ThemeCommand
                environment={environment}
                title="Rollback"
                action={rollbackThemeAction}
                buttonLabel="Rollback theme"
                includeProductionApproval
              />
              <ThemeCommand
                environment={environment}
                title="Restore default"
                action={restoreDefaultThemeAction}
                buttonLabel="Restore MEDLIFE default"
                includeProductionApproval
              />
            </aside>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <p className="app-eyebrow app-eyebrow-blue">Contrast checks</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {contrast.map((item) => (
                <article
                  key={item.pair}
                  className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill>{item.severity}</StatusPill>
                    <StatusPill>{`${item.ratio}:1`}</StatusPill>
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-slate-950">
                    {item.pair}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.foreground} on {item.background}:{" "}
                    {item.passesAA ? "passes AA" : "needs review"}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <p className="app-eyebrow app-eyebrow-blue">Audit log</p>
            <div className="mt-4 grid gap-3">
              {auditRecords.length > 0 ? (
                auditRecords.map((record) => (
                  <article
                    key={record.id}
                    className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4"
                  >
                    <div className="flex flex-wrap gap-2">
                      <StatusPill>{record.environment}</StatusPill>
                      <StatusPill>{record.action}</StatusPill>
                      {record.contrastOverride ? <StatusPill>contrast override</StatusPill> : null}
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
                  {getThemeAuditEmptyStateCopy(adminState.persistence, environment)}
                </p>
              )}
            </div>
          </section>

          <ProductionControlApprovalTrail
            title="Recent production theme approvals"
            description="Production theme publish, rollback, and restore actions should leave a separate approval record before the durable theme snapshot changes. Review these rows with the theme audit log before treating a production theme change as approved."
            emptyMessage={
              adminState.persistence.mode === "supabase"
                ? "No durable production theme approval rows have been recorded yet."
                : "Production approval rows will appear here once Supabase-backed control storage is active."
            }
            records={productionApprovalRecords}
          />
        </main>
      )}
    </AdminAppShell>
  );
}

function TokenEditor({
  token,
  environment,
}: {
  token: ThemeTokenValue;
  environment: FeatureFlagEnvironment;
}) {
  return (
    <form
      action={saveThemeDraftAction}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-[var(--background)] p-4 lg:grid-cols-[minmax(10rem,1fr)_8rem_9rem_9rem_minmax(12rem,1fr)_auto]"
    >
      <input type="hidden" name="returnTo" value={`/admin/theme?env=${environment}`} />
      <input type="hidden" name="environment" value={environment} />
      <input type="hidden" name="tokenKey" value={token.key} />
      <div>
        <p className="text-sm font-semibold text-slate-950">{token.label}</p>
        <p className="mt-1 font-mono text-xs text-slate-500">{token.cssVariable}</p>
      </div>
      <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        Color
        <input
          type="color"
          name="hexPicker"
          defaultValue={token.hex}
          className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white p-1"
        />
      </label>
      <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        Hex
        <input
          name="hex"
          defaultValue={token.hex}
          pattern="^#[0-9a-fA-F]{6}$"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
        />
      </label>
      <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        Pantone
        <input
          name="pantoneLabel"
          defaultValue={token.pantoneLabel ?? ""}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
          placeholder="Optional"
        />
      </label>
      <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        Reason
        <input
          required
          minLength={8}
          name="reason"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
          placeholder="Why change this token?"
        />
      </label>
      <button className="self-end rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-white">
        Save draft
      </button>
    </form>
  );
}

function ThemeCommand({
  environment,
  title,
  action,
  buttonLabel,
  includeOverride = false,
  includeProductionApproval = false,
}: {
  environment: FeatureFlagEnvironment;
  title: string;
  action: (formData: FormData) => Promise<void>;
  buttonLabel: string;
  includeOverride?: boolean;
  includeProductionApproval?: boolean;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="returnTo" value={`/admin/theme?env=${environment}`} />
        <input type="hidden" name="environment" value={environment} />
        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Reason
          <input
            required
            minLength={8}
            name="reason"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            placeholder="Audit reason"
          />
        </label>
        {includeOverride ? (
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input type="checkbox" name="overrideContrast" />
            Super Admin contrast override
          </label>
        ) : null}
        {environment === "production" && includeProductionApproval ? (
          <div className="rounded-2xl border border-[var(--danger)]/30 bg-rose-50 p-3">
            <label className="flex items-start gap-2 text-xs font-semibold text-rose-700">
              <input
                name="confirmProduction"
                type="checkbox"
                className="mt-1"
              />
              I confirm this production theme change has explicit approval and a fresh admin step-up session.
            </label>
            <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
              Approval reference
              <input
                name="approvalReference"
                className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-800"
                placeholder="Example: Nick approved in Codex thread on 2026-06-28"
              />
            </label>
          </div>
        ) : null}
        <button className="w-full rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-white">
          {buttonLabel}
        </button>
      </form>
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

function parseEnvironment(value: string | undefined): FeatureFlagEnvironment {
  if (featureFlagEnvironments.includes(value as FeatureFlagEnvironment)) {
    return value as FeatureFlagEnvironment;
  }

  return getCurrentFeatureEnvironment();
}

function getThemeReviewSnapshot(input: {
  environment: FeatureFlagEnvironment;
  persistence: {
    mode: "memory" | "supabase";
    requested?: boolean;
    availability?: "disabled" | "unavailable" | "missing_session" | "ready";
    reason: string;
  };
  snapshotRowCount: number;
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
          label: "Supabase-backed theme storage is active",
          detail: `Theme controls for ${input.environment} are reading durable theme snapshots and writing audited theme changes through Supabase.`,
        }
      : persistenceAvailability === "missing_session"
        ? {
            label: "Supabase-backed theme storage is requested",
            detail: `Theme controls for ${input.environment} are configured for durable Supabase theme snapshots, but this reviewer session is not signed in for durable control reads or writes yet.`,
          }
        : persistenceAvailability === "unavailable"
          ? {
              label: "Supabase-backed theme storage is requested",
              detail: `Theme controls for ${input.environment} are pointed at the durable control layer, but this environment is not yet ready to open a Supabase control session.`,
            }
      : {
          label: "Local theme review posture is still active",
          detail: `Theme controls for ${input.environment} are still using in-memory review state until Supabase-backed control storage and a signed-in control session are available.`,
        },
    input.persistence.mode === "supabase"
      ? {
          label: "Visible durable control rows",
          detail: `${input.snapshotRowCount} theme snapshot row(s), ${input.auditRowCount} durable theme audit row(s), ${input.stepUpSessionCount} admin step-up session row(s), and ${input.productionApprovalCount} production approval row(s) are visible for ${input.environment}.`,
        }
      : {
          label: "Visible durable control rows",
          detail: `Durable hosted theme readback is not active for ${input.environment} yet, so snapshot rows, audit rows, step-up rows, and approval rows are still zero in this review lane.`,
        },
    {
      label: "Theme audit trail",
      detail:
        input.auditRowCount > 0
          ? `${input.auditRowCount} durable theme audit row(s) are visible for reviewer readback.`
          : `No theme audit rows are currently visible for ${input.environment}.`,
    },
    {
      label: "Production theme approvals",
      detail:
        input.productionApprovalCount > 0
          ? `${input.productionApprovalCount} recent durable production theme approval row(s) are visible in this review lane.`
          : "No durable production theme approval rows are visible yet.",
    },
  ];

  if (input.productionStepUpReady) {
    recordedNow.push({
      label: "Fresh admin step-up is active",
      detail: "Production theme publish, rollback, and restore actions can clear the step-up requirement for this current admin session.",
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
            : "Durable theme storage is not active yet",
      detail:
        persistenceAvailability === "missing_session"
          ? "Durable theme storage is configured, but this reviewer still needs to sign in through the approved myMEDLIFE auth path before the app can read or write real theme rows."
          : persistenceAvailability === "unavailable"
            ? input.persistence.reason
            : "Supabase-backed control storage and a signed-in control session are still required before this environment can claim durable theme readiness.",
    });
  }

  if (!input.productionStepUpReady) {
    stillBlocked.push({
      label: "Production theme actions remain step-up locked",
      detail: input.stepUpMessage,
    });
  }

  if (input.productionApprovalCount === 0) {
    stillBlocked.push({
      label: "No durable production theme approval rows exist yet",
      detail:
        "Production theme publish, rollback, and restore actions remain blocked until explicit approval rows are recorded alongside the audited theme change.",
    });
  }

  return {
    recordedNow,
    stillBlocked,
  };
}
