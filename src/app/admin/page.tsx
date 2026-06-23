import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AdminAuditLogReviewPanel } from "@/components/admin-audit-log-review-panel";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminControlCenterPanel } from "@/components/admin-control-center-panel";
import { AdminSystemHealthReviewPanel } from "@/components/admin-system-health-review-panel";
import { AdminGlossaryPanel } from "@/components/admin-glossary-panel";
import { ControlledPilotReadinessPanel } from "@/components/controlled-pilot-readiness-panel";
import { DatabaseSecurityDecisionPanel } from "@/components/database-security-decision-panel";
import { DataSourceNotice } from "@/components/data-source-notice";
import { DesignQaReadinessPanel } from "@/components/design-qa-readiness-panel";
import { EnvironmentSafetySummaryPanel } from "@/components/environment-safety-summary-panel";
import { EventOutboxLog } from "@/components/event-outbox-log";
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
  getActorSurfaceFamily,
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
  const backendLaneLinks = getBackendLaneLinks(actor);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav current="overview" />

      <section className="rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#0a3b88_0%,#0b4f9b_58%,#081a3a_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.3)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d05e]">
          Admin permission proof
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Staff context is role-aware and read-only.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/82">
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

          <section className="app-surface rounded-[1.75rem] p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-eyebrow app-eyebrow-slate">Backend lanes</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  What this admin surface actually owns
                </h2>
                <p className="app-copy mt-2 max-w-3xl">
                  This backend stays boring on purpose: launch posture, auditability,
                  safety gates, and internal configuration context before any live
                  auth, writes, or external systems turn on.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricCard
                  label="Visible lanes"
                  value={`${visiblePanels.length}`}
                  note="Role-allowed backend sections"
                />
                <MetricCard
                  label="Release packets"
                  value="4"
                  note="Readiness and launch review surfaces"
                />
                <MetricCard
                  label="Audit posture"
                  value="Read-only"
                  note="No live mutation lane enabled"
                />
                <MetricCard
                  label="Outbox"
                  value={canReadIntegrationOutbox(actor) ? "Visible" : "Limited"}
                  note="Permission-based integration review"
                />
              </div>
            </div>
          </section>

          {backendLaneLinks.length > 0 ? (
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {backendLaneLinks.map((lane) => (
                <Link
                  key={lane.href}
                  href={lane.href}
                  className="app-surface rounded-[1.6rem] p-4 transition hover:border-slate-300/80"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="app-eyebrow app-eyebrow-slate">{lane.eyebrow}</p>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                      Read-only
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-slate-950">
                    {lane.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {lane.summary}
                  </p>
                </Link>
              ))}
            </section>
          ) : null}

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
              <article
                key={panel.key}
                className="app-surface rounded-[1.6rem] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="app-eyebrow app-eyebrow-slate">
                    {panel.key.replace("_", " ")}
                  </p>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                    Backend
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-950">{panel.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{panel.summary}</p>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Role-routed internal context only.
                </p>
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

function getBackendLaneLinks(actor: Awaited<ReturnType<typeof getLocalActorContext>>) {
  const surfaceFamily = getActorSurfaceFamily(actor);
  const shared = [
    {
      href: "/admin/permissions",
      eyebrow: "Roles",
      title: "Permission Registry",
      summary:
        "Canonical role, scope, landing-route, and route-family registry for local actors.",
    },
    {
      href: "/admin/workflows",
      eyebrow: "Flows",
      title: "Workflow Registry",
      summary:
        "Backend map of onboarding, writes, proof review, SLT readiness, coach intervention, and SOP tooling.",
    },
  ];

  if (surfaceFamily === "ds_admin") {
    return [
      ...shared,
      {
        href: "/admin/integration-outbox",
        eyebrow: "Safety",
        title: "Integration Outbox",
        summary:
          "Read-only event, outbox, and blocked-send posture for DS review.",
      },
    ];
  }

  if (surfaceFamily === "staff" || surfaceFamily === "super_admin") {
    return [
      ...shared,
      {
        href: "/admin/committees",
        eyebrow: "Owners",
        title: "Committee Registry",
        summary:
          "Action committee lanes, owner roles, and campaign links in one backend lane.",
      },
      {
        href: "/admin/sop-library",
        eyebrow: "Builder",
        title: "SOP Library",
        summary:
          "Campaign workflow definitions with steps, role matrix, completion, KPI, and version tabs.",
      },
    ];
  }

  return [];
}
