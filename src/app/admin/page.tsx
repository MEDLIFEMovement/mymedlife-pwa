import { AppShell } from "@/components/app-shell";
import { AdminControlCenterPanel } from "@/components/admin-control-center-panel";
import { DataSourceNotice } from "@/components/data-source-notice";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { LocalActorNotice } from "@/components/local-actor-notice";
import { LocalRoleSwitcher } from "@/components/local-role-switcher";
import { MetricCard } from "@/components/metric-card";
import { MvpCoverageChecklistPanel } from "@/components/mvp-coverage-checklist-panel";
import { RestrictedState } from "@/components/restricted-state";
import { RouteSmokeManifestPanel } from "@/components/route-smoke-manifest-panel";
import { WriteActivationApprovalPlanPanel } from "@/components/write-activation-approval-plan-panel";
import { WriteActivationReadinessPanel } from "@/components/write-activation-readiness-panel";
import { WriteResultStateCoveragePanel } from "@/components/write-result-state-coverage-panel";
import { getAdminControlCenterSummary } from "@/services/admin-control-center";
import { getCampaignReadinessSummary } from "@/services/campaign-ops-service";
import { getWriteActivationApprovalPlan } from "@/services/write-activation-approval-plan";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getMvpCoverageChecklist } from "@/services/mvp-coverage-checklist";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getRouteSmokeManifest } from "@/services/route-smoke-manifest";
import {
  canReadIntegrationOutbox,
  getVisibleAdminPanelsForActor,
} from "@/services/role-visibility";
import { getWriteActivationReadinessSummary } from "@/services/write-activation-readiness";
import { getWriteResultStateCoverageSummary } from "@/services/write-result-state-coverage";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const visiblePanels = getVisibleAdminPanelsForActor(actor);
  const campaignSummary = getCampaignReadinessSummary();
  const adminControlCenter = getAdminControlCenterSummary(data);
  const writeActivationApprovalPlan = getWriteActivationApprovalPlan();
  const writeResultStateCoverage = getWriteResultStateCoverageSummary();
  const mvpCoverageChecklist = getMvpCoverageChecklist(actor, data);
  const routeSmokeManifest = getRouteSmokeManifest(actor);
  const writeActivationSummary = getWriteActivationReadinessSummary(actor, {
    assignments: data.assignments,
    coachDecision: data.kpiSummary.coachDecision,
  });

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <LocalActorNotice actor={actor} />
      <LocalRoleSwitcher actor={actor} />

      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          Admin permission proof
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Staff context is role-aware and read-only.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
          Admins can inspect support and HQ proof-sharing posture. DS Admin can
          inspect disabled/mock integration rows only. Super Admin can inspect
          the full local permission surface. No role can send real external
          writes from this app.
        </p>
      </section>

      {visiblePanels.length > 0 ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Campaign shells"
              value={`${campaignSummary.activeCampaigns + campaignSummary.plannedCampaigns + campaignSummary.templateCampaigns}`}
              note="Read-only operating catalog"
            />
            <MetricCard
              label="Proof items"
              value={`${campaignSummary.hqProofItems}`}
              note="Need HQ sharing review"
            />
            <MetricCard
              label="Disabled events"
              value={`${campaignSummary.disabledIntegrationEvents}`}
              note="No external sends"
            />
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            {visiblePanels.map((panel) => (
              <article key={panel.key} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/70">
                  {panel.key.replace("_", " ")}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">{panel.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/64">{panel.summary}</p>
              </article>
            ))}
          </section>

          <MvpCoverageChecklistPanel checklist={mvpCoverageChecklist} />
          <RouteSmokeManifestPanel manifest={routeSmokeManifest} />
          <AdminControlCenterPanel summary={adminControlCenter} />
          <WriteActivationReadinessPanel summary={writeActivationSummary} />
          <WriteActivationApprovalPlanPanel plan={writeActivationApprovalPlan} />
          <WriteResultStateCoveragePanel summary={writeResultStateCoverage} />
        </>
      ) : (
        <RestrictedState
          title="This local actor has no admin panels."
          message="Chapter members, chapter leaders, and coaches should use their student or coach routes. Admin panels stay limited to HQ, DS Admin, and Super Admin contexts."
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      )}

      {canReadIntegrationOutbox(actor) ? (
        <EventOutboxLog events={data.integrationEvents} outboxItems={data.outboxItems} />
      ) : (
        <RestrictedState
          eyebrow="Integration controls"
          title="Outbox records are hidden for this role."
          message="Only DS Admin and Super Admin can inspect disabled/mock external-send posture. Admin can read support and proof-sharing context, but does not own connection configuration."
        />
      )}
    </AppShell>
  );
}
