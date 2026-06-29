import { AdminAppShell } from "@/components/admin-app-shell";
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
import { PanelButton, SurfacePanel, StatusPill } from "@/components/visual-primitives";
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
import { getLandingRouteForActor } from "@/services/landing-route";
import { getWriteActivationApprovalPlan } from "@/services/write-activation-approval-plan";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getLumaCalendarReadinessSnapshot } from "@/services/luma-calendar-readiness";
import { getLumaEventLoopPilotReadback } from "@/services/luma-event-loop-pilot";
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
  canReadAdminIntegrationsSecurity,
  canReadIntegrationOutbox,
  getActorSurfaceFamily,
  getVisibleAdminPanelsForActor,
} from "@/services/role-visibility";
import { getStagingLumaEventLoopReadModel } from "@/services/staging-luma-event-loop";
import { getStakeholderReviewPlan } from "@/services/stakeholder-review-plan";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getWriteActivationReadinessSummary } from "@/services/write-activation-readiness";
import { getWriteResultStateCoverageSummary } from "@/services/write-result-state-coverage";
import { LumaEventLoopPilotPanel } from "@/components/luma-event-loop-pilot-panel";

export const metadata = getStaticRouteMetadata("admin");
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [data, actor, lumaSnapshot] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
    getLumaCalendarReadinessSnapshot(),
  ]);
  const surfaceFamily = getActorSurfaceFamily(actor);
  const canReadAdminBackend =
    surfaceFamily === "ds_admin" || surfaceFamily === "super_admin";

  if (!canReadAdminBackend) {
    return (
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <RestrictedState
            title="This admin backend is not visible to this role."
            message="Members, leaders, and coaches should use their own student or coach shells. Admin panels stay limited to HQ, DS Admin, and Super Admin contexts."
            nextHref={getLandingRouteForActor(actor)}
            nextLabel="Go to your app"
          />
        </div>
      </main>
    );
  }

  const visiblePanels = getVisibleAdminPanelsForActor(actor);
  const campaignSummary = getCampaignReadinessSummary();
  const lumaActivation = getStagingLumaEventLoopReadModel({
    mode: "staging",
    data,
  });
  const lumaEventLoop = getLumaEventLoopPilotReadback("admin", lumaSnapshot);
  const adminControlCenter = getAdminControlCenterSummary(data);
  const adminAuditLogReview = getAdminAuditLogReview(actor, data);
  const adminSystemHealthReview = getAdminSystemHealthReview(actor, data);
  const adminGlossary = getAdminGlossary(actor);
  const controlledPilotReadiness = getControlledPilotReadiness(actor, {
    lumaReadModel: lumaActivation,
  });
  const designQaReadiness = getDesignQaReadiness(actor);
  const environmentSafetySummary = getEnvironmentSafetySummary(actor);
  const writeActivationApprovalPlan = getWriteActivationApprovalPlan();
  const writeResultStateCoverage = getWriteResultStateCoverageSummary();
  const mvpCoverageChecklist = getMvpCoverageChecklist(actor, data);
  const mvpProgressMap = getMvpProgressMap(actor);
  const releaseReadiness = getMvpReleaseReadinessSummary(actor);
  const nickMvpReviewPacket = getNickMvpReviewPacket(actor);
  const productionLaunchGate = getProductionLaunchGate(actor, process.env, {
    lumaReadModel: lumaActivation,
  });
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
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="overview"
        builderLink={{
          href: "/admin/sop-builder/rush-month?tab=steps",
          label: "SOP Builder",
        }}
        showIntegrations={canReadAdminIntegrationsSecurity(actor)}
      />

      <SurfacePanel
        as="section"
        className="app-surface-info rounded-[2rem] p-5"
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] xl:items-start">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mymedlife-primary-button)]">
                Admin permission proof
              </p>
              <span className="rounded-full border border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--mymedlife-info)]">
                DS / Super Admin backend
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-slate-950">
              DS and Super Admin context is role-aware and read-only.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              The shell stays white-blue and workspace-oriented so it feels like a
              distinct admin product, not a generic backend console.
            </p>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              DS Admin can inspect disabled or mock integration rows only. Super Admin can inspect
              the full local permission surface. No other role can enter this backend or send
              real external writes from this app.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <MetricCard
              label="Backend posture"
              value="Read-only"
              note="No live mutation lane enabled"
            />
            <MetricCard
              label="Sensitive access"
              value="Restricted"
              note="DS and Super Admin only"
            />
            <MetricCard
              label="External writes"
              value="Off"
              note="Mock-safe integration posture"
            />
          </div>
        </div>
      </SurfacePanel>

      <SurfacePanel as="section" className="rounded-[2rem] border border-[var(--accent)]/25 bg-[var(--background)] p-5">
        <p className="app-eyebrow app-eyebrow-blue">Event loop</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          Luma event creation, RSVP, attendance, and points stay app-owned.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Admin review should keep the event story visible at portfolio scale:
          chapter events create RSVP signals, attendance creates trustworthy
          points movement, and the leaderboard stays a read-only reflection of
          what happened in the app.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Linked mock events"
            value={`${campaignSummary.linkedMockEvents}`}
            note="Luma-backed event shells"
          />
          <MetricCard
            label="HQ proof items"
            value={`${campaignSummary.hqProofItems}`}
            note="Attendance and proof review"
          />
          <MetricCard
            label="Disabled syncs"
            value={`${campaignSummary.disabledIntegrationEvents}`}
            note="No live external writes"
          />
        </div>
        <div className="mt-4 rounded-[1.2rem] border border-[var(--mymedlife-border)] bg-white px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {lumaActivation.providerStatusLabel}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                The staging loop includes event storage, Luma link/QR posture,
                feed sharing, member RSVP, attendance, and one points award. External writes remain off.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill tone="blue">{`${lumaActivation.summary.rsvpCount} RSVP`}</StatusPill>
              <StatusPill tone="gold">{`${lumaActivation.summary.attendanceCount} attended`}</StatusPill>
              <StatusPill tone="blue">{`${lumaActivation.summary.pointsAwarded} pts`}</StatusPill>
            </div>
          </div>
        </div>
      </SurfacePanel>

      <LumaEventLoopPilotPanel readback={lumaEventLoop} compact />

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

          <SurfacePanel as="section" className="rounded-[1.75rem] border border-slate-200 p-5">
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
          </SurfacePanel>

          {backendLaneLinks.length > 0 ? (
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {backendLaneLinks.map((lane) => (
                <PanelButton
                  href={lane.href}
                  variant="secondary"
                  key={lane.href}
                  className="app-surface rounded-[1.6rem] p-4 text-left transition hover:border-slate-300/80"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="app-eyebrow app-eyebrow-slate">{lane.eyebrow}</p>
                    <StatusPill tone="white">Read-only</StatusPill>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-slate-950">
                    {lane.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {lane.summary}
                  </p>
                </PanelButton>
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
                  <StatusPill tone="white">Backend</StatusPill>
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
    </AdminAppShell>
  );
}

function getBackendLaneLinks(actor: Awaited<ReturnType<typeof getLocalActorContext>>) {
  const surfaceFamily = getActorSurfaceFamily(actor);
  const shared = [
    {
      href: "/admin/phase-2",
      eyebrow: "Phase 2",
      title: "Live MVP Closeout",
      summary:
        "Single review entry for the closeout packet, dry run, onboarding, pilot scope, design QA, and first hosted write decision.",
    },
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
    {
      href: "/admin/sop-builder/rush-month?tab=steps",
      eyebrow: "Builder",
      title: "SOP Builder",
      summary:
        "Open the Rush Month builder workspace with steps, role matrix, completion, points/KPI, comms, preview, and version tabs.",
    },
    {
      href: "/admin/first-write",
      eyebrow: "Write",
      title: "First Write Drill",
      summary:
        "Smallest localhost-only action-start rehearsal before any wider write lane is approved.",
    },
    {
      href: "/admin/write-sequence",
      eyebrow: "Write",
      title: "Write Sequence",
      summary:
        "Promotion order, owner role, and rollback boundary for each guarded local write packet.",
    },
    {
      href: "/admin/proof-write",
      eyebrow: "Proof",
      title: "Proof Packet",
      summary:
        "Member proof metadata rehearsal with consent posture, audit readback, and zero external sends.",
    },
    {
      href: "/admin/hq-proof-write",
      eyebrow: "HQ",
      title: "HQ Proof Packet",
      summary:
        "HQ proof-sharing decision rehearsal that stays mock-safe and keeps public sharing locked.",
    },
    {
      href: "/admin/assignment-write",
      eyebrow: "Leader",
      title: "Assignment Packet",
      summary:
        "Leader assignment rehearsal with owner handoff, audit posture, and reminder sends still blocked.",
    },
    {
      href: "/admin/coach-write",
      eyebrow: "Coach",
      title: "Coach Decision Packet",
      summary:
        "Coach intervention rehearsal with decision ownership, escalation boundaries, and zero sends.",
    },
    {
      href: "/admin/review-path",
      eyebrow: "Review",
      title: "Stakeholder Review Path",
      summary:
        "No-code walkthrough for member, leader, coach, and admin review packets before live changes.",
    },
    {
      href: "/admin/nick-review",
      eyebrow: "Decision",
      title: "Nick Review Packet",
      summary:
        "Final launch packet that ties review paths, pilot scope, and launch evidence into one checkpoint.",
    },
    {
      href: "/admin/release-readiness",
      eyebrow: "Ready",
      title: "Release Readiness",
      summary:
        "Read-only launch summary that keeps pilot approval, auth, and safety gates explicit.",
    },
    {
      href: "/admin/launch-gate",
      eyebrow: "Gate",
      title: "Production Launch Gate",
      summary:
        "Hosted launch checklist for staging, pilot scope, external writes, and rollback ownership.",
    },
    {
      href: "/admin/audit-log",
      eyebrow: "Audit",
      title: "Audit Log",
      summary:
        "Write-readback posture for actor, target, before/after, reason, and visibility evidence.",
    },
    {
      href: "/admin/operations",
      eyebrow: "Ops",
      title: "Production Operations",
      summary:
        "Incident, rollback, backup, support, and recovery runbook for the live MVP posture.",
    },
    {
      href: "/admin/design-qa",
      eyebrow: "QA",
      title: "Design QA",
      summary:
        "Mobile, accessibility, and visual smoke checks for the Figma-backed review path.",
    },
    {
      href: "/admin/staff-dry-run",
      eyebrow: "Rehearsal",
      title: "Staff Dry Run",
      summary:
        "Fake-user rehearsal path for the Rush Month loop before staging, live writes, or pilot approval.",
    },
    {
      href: "/admin/pilot-scope",
      eyebrow: "Pilot",
      title: "Pilot Scope",
      summary:
        "One chapter, named owners, and approved launch posture for the narrow live pilot.",
    },
  ];

  if (surfaceFamily === "ds_admin") {
    return [
      ...shared,
      {
        href: "/admin/integrations",
        eyebrow: "Keys",
        title: "Integrations & API Keys",
        summary:
          "Secure DS-only provider configuration lane with write-only credential posture, masked metadata, and audit review.",
      },
      {
        href: "/admin/integration-outbox",
        eyebrow: "Safety",
        title: "Integration Outbox",
        summary:
          "Read-only event, outbox, and blocked-send posture for DS review.",
      },
      {
        href: "/admin/database-security",
        eyebrow: "Security",
        title: "Database Security",
        summary:
          "RLS and security review lane for local write promotion and staging rollout checks.",
      },
      {
        href: "/admin/system-health",
        eyebrow: "Health",
        title: "System Health",
        summary:
          "Deployment, auth, data-source, and backend health checks for read-only oversight.",
      },
      {
        href: "/admin/master-data",
        eyebrow: "Catalog",
        title: "Master Data",
        summary:
          "Fake users, named roles, chapter inventory, and campaign templates in one read-only admin inventory.",
      },
    ];
  }

  if (surfaceFamily === "staff") {
    return [
      ...shared,
      {
        href: "/admin/master-data",
        eyebrow: "Catalog",
        title: "Master Data",
        summary:
          "Fake users, named roles, chapter inventory, and campaign templates in one read-only admin inventory.",
      },
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

  if (surfaceFamily === "super_admin") {
    return [
      ...shared,
      {
        href: "/admin/integrations",
        eyebrow: "Keys",
        title: "Integrations & API Keys",
        summary:
          "Secure DS-only provider configuration lane with write-only credential posture, masked metadata, and audit review.",
      },
      {
        href: "/admin/master-data",
        eyebrow: "Catalog",
        title: "Master Data",
        summary:
          "Fake users, named roles, chapter inventory, and campaign templates in one read-only admin inventory.",
      },
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
