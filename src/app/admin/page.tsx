import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AdminAuditLogReviewPanel } from "@/components/admin-audit-log-review-panel";
import { AdminControlCenterPanel } from "@/components/admin-control-center-panel";
import { AdminSystemHealthReviewPanel } from "@/components/admin-system-health-review-panel";
import { AdminGlossaryPanel } from "@/components/admin-glossary-panel";
import { ControlledPilotReadinessPanel } from "@/components/controlled-pilot-readiness-panel";
import { DatabaseSecurityDecisionPanel } from "@/components/database-security-decision-panel";
import { DataSourceNotice } from "@/components/data-source-notice";
import { DesignQaReadinessPanel } from "@/components/design-qa-readiness-panel";
import { EnvironmentSafetySummaryPanel } from "@/components/environment-safety-summary-panel";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { FigmaMissingPageNotice } from "@/components/figma-missing-page-notice";
import { MetricCard } from "@/components/metric-card";
import { MvpCoverageChecklistPanel } from "@/components/mvp-coverage-checklist-panel";
import { MvpProgressMapPanel } from "@/components/mvp-progress-map-panel";
import { MvpReleaseReadinessPanel } from "@/components/mvp-release-readiness-panel";
import { NickMvpReviewPanel } from "@/components/nick-mvp-review-panel";
import { ProductionLaunchGatePanel } from "@/components/production-launch-gate-panel";
import { ProductionOperationsRunbookPanel } from "@/components/production-operations-runbook-panel";
import { RestrictedState } from "@/components/restricted-state";
import { RouteCoverageSummaryPanel } from "@/components/route-coverage-summary-panel";
import { RouteSmokeManifestPanel } from "@/components/route-smoke-manifest-panel";
import { StakeholderReviewPlanPanel } from "@/components/stakeholder-review-plan-panel";
import { WriteActivationApprovalPlanPanel } from "@/components/write-activation-approval-plan-panel";
import { WriteActivationReadinessPanel } from "@/components/write-activation-readiness-panel";
import { WriteResultStateCoveragePanel } from "@/components/write-result-state-coverage-panel";
import { getAdminControlCenterSummary } from "@/services/admin-control-center";
import { getAdminAuditLogReview } from "@/services/admin-audit-log-review";
import { getAdminGlossary } from "@/services/admin-glossary";
import { getAdminSystemHealthReview } from "@/services/admin-system-health-review";
import { getCampaignReadinessSummary } from "@/services/campaign-ops-service";
import { getControlledPilotReadiness } from "@/services/controlled-pilot-readiness";
import { getDatabaseSecurityDecisionPacket } from "@/services/database-security-decision";
import { getDesignQaReadiness } from "@/services/design-qa-readiness";
import { getEnvironmentSafetySummary } from "@/services/environment-safety-summary";
import { getWriteActivationApprovalPlan } from "@/services/write-activation-approval-plan";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getMvpCoverageChecklist } from "@/services/mvp-coverage-checklist";
import { getMvpProgressMap } from "@/services/mvp-progress-map";
import { getMvpReleaseReadinessSummary } from "@/services/mvp-release-readiness";
import { getNickMvpReviewPacket } from "@/services/nick-mvp-review";
import { getProductionLaunchGate } from "@/services/production-launch-gate";
import { getProductionOperationsRunbook } from "@/services/production-operations-runbook";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getRouteCoverageSummary } from "@/services/route-coverage-summary";
import { getRouteSmokeManifest } from "@/services/route-smoke-manifest";
import {
  canReadIntegrationOutbox,
  getVisibleAdminPanelsForActor,
} from "@/services/role-visibility";
import { getStakeholderReviewPlan } from "@/services/stakeholder-review-plan";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getWriteActivationReadinessSummary } from "@/services/write-activation-readiness";
import { getWriteResultStateCoverageSummary } from "@/services/write-result-state-coverage";

export const metadata = getStaticRouteMetadata("admin");
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const visiblePanels = getVisibleAdminPanelsForActor(actor);
  const campaignSummary = getCampaignReadinessSummary();
  const adminControlCenter = getAdminControlCenterSummary(data);
  const adminAuditLogReview = getAdminAuditLogReview(actor, data);
  const adminSystemHealthReview = getAdminSystemHealthReview(actor, data);
  const adminGlossary = getAdminGlossary(actor);
  const controlledPilotReadiness = getControlledPilotReadiness(actor);
  const designQaReadiness = getDesignQaReadiness(actor);
  const environmentSafetySummary = getEnvironmentSafetySummary(actor);
  const writeActivationApprovalPlan = getWriteActivationApprovalPlan();
  const writeResultStateCoverage = getWriteResultStateCoverageSummary();
  const mvpCoverageChecklist = getMvpCoverageChecklist(actor, data);
  const mvpProgressMap = getMvpProgressMap(actor);
  const releaseReadiness = getMvpReleaseReadinessSummary(actor);
  const nickMvpReviewPacket = getNickMvpReviewPacket(actor);
  const productionLaunchGate = getProductionLaunchGate(actor);
  const productionOperationsRunbook = getProductionOperationsRunbook(actor);
  const databaseSecurityDecision = getDatabaseSecurityDecisionPacket(actor);
  const routeSmokeManifest = getRouteSmokeManifest(actor);
  const routeCoverageSummary = getRouteCoverageSummary(actor);
  const stakeholderReviewPlan = getStakeholderReviewPlan(actor);
  const writeActivationSummary = getWriteActivationReadinessSummary(actor, {
    assignments: data.assignments,
    coachDecision: data.kpiSummary.coachDecision,
  });

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <FigmaMissingPageNotice
        route="/admin"
        expectedSource="Dedicated Admin/DS backend Figma export"
        currentSurface="Existing secure admin backend, not Chapter content"
        nextStep="Port the exact admin Figma page when that source is approved"
      />

      <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-100">
              Phase 2 review
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              Open the safe prep surface.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
              Review MED-471 through MED-486, the mock-only boundary, and the
              approval steps for the next implementation lane without enabling
              any live infrastructure.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/phase-2"
              className="rounded-full bg-sky-200 px-4 py-2 text-sm font-semibold text-[#082136]"
            >
              Open Phase 2 review
            </Link>
            <Link
              href="/admin/launch-gate"
              className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white/78"
            >
              Launch gate
            </Link>
          </div>
        </div>
      </section>

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

          <MvpReleaseReadinessPanel summary={releaseReadiness} />
          <NickMvpReviewPanel packet={nickMvpReviewPacket} />
          <ProductionLaunchGatePanel gate={productionLaunchGate} />
          <DatabaseSecurityDecisionPanel packet={databaseSecurityDecision} />
          <ControlledPilotReadinessPanel readiness={controlledPilotReadiness} />
          <MvpProgressMapPanel progressMap={mvpProgressMap} />
          <DesignQaReadinessPanel readiness={designQaReadiness} />
          <EnvironmentSafetySummaryPanel summary={environmentSafetySummary} />
          <AdminSystemHealthReviewPanel review={adminSystemHealthReview} />
          <ProductionOperationsRunbookPanel runbook={productionOperationsRunbook} />
          <StakeholderReviewPlanPanel plan={stakeholderReviewPlan} />
          <AdminGlossaryPanel glossary={adminGlossary} />
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
          <RouteCoverageSummaryPanel summary={routeCoverageSummary} />
          <AdminControlCenterPanel summary={adminControlCenter} />
          <AdminAuditLogReviewPanel review={adminAuditLogReview} />
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
