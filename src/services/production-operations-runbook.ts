import type { LocalActorContext } from "@/services/local-actor-context";
import {
  canReadAdminReviewSurface,
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";

export type ProductionOperationsRunbookStatus =
  | "local_runbook_ready"
  | "blocked_before_live";

export type ProductionOperationsRunbookItem = {
  key: string;
  label: string;
  ownerLane: string;
  status: ProductionOperationsRunbookStatus;
  localRunbook: string;
  firstResponseSteps: string[];
  missingLiveEvidence: string[];
  reviewRoutes: string[];
  approvalRequired: string;
  browserWritesExpected: 0;
  externalWritesExpected: 0;
  secretsShown: 0;
};

export type ProductionOperationsRunbook = {
  canReadRunbook: boolean;
  title: string;
  launchReady: false;
  summary: string;
  browserWritesExpected: 0;
  externalWritesExpected: 0;
  secretsShown: 0;
  counts: {
    total: number;
    localRunbookReady: number;
    blockedBeforeLive: number;
  };
  items: ProductionOperationsRunbookItem[];
  finalPrompt: string;
};

export function getProductionOperationsRunbook(
  actor: LocalActorContext,
): ProductionOperationsRunbook {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (!canReadAdminReviewSurface(actor)) {
    return {
      canReadRunbook: false,
      title: "Production operations runbook hidden for this role",
      launchReady: false,
      summary:
        "Production operations recovery planning is an HQ and DS Admin review surface.",
      browserWritesExpected: 0,
      externalWritesExpected: 0,
      secretsShown: 0,
      counts: emptyCounts(),
      items: [],
      finalPrompt: "",
    };
  }

  const items = productionOperationsRunbookItems;

  return {
    canReadRunbook: true,
    title: getTitle(surfaceFamily),
    launchReady: false,
    summary:
      "Names the local first-response playbooks, owner lanes, and missing live evidence for a controlled myMEDLIFE pilot without enabling production writes, external sends, or secrets.",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    secretsShown: 0,
    counts: {
      total: items.length,
      localRunbookReady: items.filter(
        (item) => item.status === "local_runbook_ready",
      ).length,
      blockedBeforeLive: items.filter(
        (item) => item.status === "blocked_before_live",
      ).length,
    },
    items,
    finalPrompt:
      "Do not invite real students until every runbook has a named owner, alert path, rollback or recovery plan, backup evidence where relevant, and current smoke evidence on the release build.",
  };
}

const productionOperationsRunbookItems: ProductionOperationsRunbookItem[] = [
  {
    key: "incident_triage",
    label: "Incident triage and severity",
    ownerLane: "Platform and HQ Operations",
    status: "local_runbook_ready",
    localRunbook:
      "Use the admin launch gate, system health review, and role-specific routes to classify launch issues as access, data, write, proof, integration, or support incidents.",
    firstResponseSteps: [
      "Record the affected route, actor email, role, chapter, time, and screenshot.",
      "Check `/admin` system health and production launch gate before touching flags.",
      "Escalate to the owner lane named on the matching runbook item.",
    ],
    missingLiveEvidence: [
      "Named incident commander and support backup for the pilot window.",
      "Approved alert channel, severity labels, and response-time expectations.",
      "Release-build smoke result linked to every severity-1 launch path.",
    ],
    reviewRoutes: ["/admin", "/rush-month/loop", "/coach"],
    approvalRequired:
      "HQ operations and platform/security must approve the incident command path.",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    secretsShown: 0,
  },
  {
    key: "auth_access_incident",
    label: "Auth or access incident",
    ownerLane: "Security and Student Access",
    status: "blocked_before_live",
    localRunbook:
      "Local actor switching can preview role visibility, but production Supabase Auth, callbacks, invites, and membership approval are not enabled.",
    firstResponseSteps: [
      "Confirm whether the issue is sign-in, join request, chapter membership, or role visibility.",
      "Compare the affected route against the expected actor role in `/admin` release readiness.",
      "Keep manual invite or role repair steps outside the browser app until auth is approved.",
    ],
    missingLiveEvidence: [
      "Production auth project, callback URLs, invite rules, and membership approval rules.",
      "Support owner for account lockout, wrong-role, and wrong-chapter access cases.",
      "Rollback plan for disabling a bad auth or role assignment change.",
    ],
    reviewRoutes: ["/login", "/chapter/members", "/admin"],
    approvalRequired: "Security must approve before real users can sign in.",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    secretsShown: 0,
  },
  {
    key: "database_rls_incident",
    label: "Database or RLS incident",
    ownerLane: "Data and Security",
    status: "blocked_before_live",
    localRunbook:
      "Use the database security decision packet and RLS/security tests to review chapter-scoped row visibility before production data is trusted.",
    firstResponseSteps: [
      "Stop promoting new writes if a role sees too much, too little, or wrong-chapter data.",
      "Capture actor, chapter, table or route, expected result, actual result, and test coverage gap.",
      "Rerun the relevant RLS/security test before reopening the affected path.",
    ],
    missingLiveEvidence: [
      "Production migration review and release-branch RLS/security test pass.",
      "Backup and restore proof for the production Supabase project.",
      "Approved migration rollback owner and data repair process.",
    ],
    reviewRoutes: ["/admin", "/admin/first-write", "/admin/write-sequence"],
    approvalRequired: "DS/security must approve before production data becomes writable.",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    secretsShown: 0,
  },
  {
    key: "write_rollback",
    label: "Write rollback and audit review",
    ownerLane: "App and Data",
    status: "local_runbook_ready",
    localRunbook:
      "The seven guarded write packets name expected result states, audit readback, disabled outbox posture, and rollback review prompts for localhost-only drills.",
    firstResponseSteps: [
      "Disable the specific write flag or keep it disabled if readback is wrong.",
      "Review audit actor, target, before value, after value, reason, and timestamp.",
      "Use the write-sequence packet before testing any next write path.",
    ],
    missingLiveEvidence: [
      "Release-branch readback proof for the exact production write being promoted.",
      "Named rollback owner and rollback command or manual repair step.",
      "Current audit-log proof for success, error, duplicate, and permission-denied states.",
    ],
    reviewRoutes: [
      "/admin/first-write",
      "/admin/write-sequence",
      "/admin/assignment-write",
      "/admin/coach-write",
    ],
    approvalRequired: "Nick must approve one write path at a time before launch use.",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    secretsShown: 0,
  },
  {
    key: "proof_storage_moderation",
    label: "Proof storage, consent, and moderation incident",
    ownerLane: "Proof Library and HQ Review",
    status: "blocked_before_live",
    localRunbook:
      "Proof metadata and HQ sharing decisions exist locally, but real file uploads, public proof publishing, moderation, and deletion are disabled.",
    firstResponseSteps: [
      "Classify the issue as upload failure, wrong visibility, consent mismatch, moderation concern, or deletion request.",
      "Keep uploads and public publishing disabled until storage policies and consent rules are approved.",
      "Use HQ proof decision review before any testimonial is shared beyond the app.",
    ],
    missingLiveEvidence: [
      "Supabase Storage buckets, file limits, consent fields, and storage policies approved.",
      "Moderation owner, deletion workflow, and public/private proof rules.",
      "Failure, retry, oversized file, and permission-denied upload tests.",
    ],
    reviewRoutes: ["/proof-library", "/proof-library/upload", "/rush-month/evidence"],
    approvalRequired:
      "HQ proof and security owners must approve before real uploads are enabled.",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    secretsShown: 0,
  },
  {
    key: "integration_recovery",
    label: "Integration and outbox recovery",
    ownerLane: "Data Solutions",
    status: "local_runbook_ready",
    localRunbook:
      "DS Admin can inspect disabled IntegrationEvent, AutomationOutbox, and AuditLog posture while n8n, HubSpot, Luma, warehouse, Power BI, SMS, email, and AI writes stay off.",
    firstResponseSteps: [
      "Treat the app and Supabase as source of truth before retrying any external workflow.",
      "Do not replay outbox rows until idempotency, retry, and dead-letter rules are approved.",
      "Compare the integration event to the audit row before marking a recovery complete.",
    ],
    missingLiveEvidence: [
      "n8n, HubSpot, Luma, warehouse, Power BI, SMS, email, and AI contracts approved.",
      "Retry, idempotency, dead-letter, and manual recovery procedure documented.",
      "Named DS owner for pausing, replaying, or discarding external messages.",
    ],
    reviewRoutes: ["/admin", "/rush-month/loop", "/rush-month/events"],
    approvalRequired: "DS must approve every real external send path explicitly.",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    secretsShown: 0,
  },
  {
    key: "mobile_pwa_support",
    label: "Mobile PWA support",
    ownerLane: "Launch and Product",
    status: "blocked_before_live",
    localRunbook:
      "Design QA readiness, route smoke expectations, and a conservative offline fallback shell exist, but real device QA, install behavior, cache update behavior, and production PWA support are not complete.",
    firstResponseSteps: [
      "Record device, browser, viewport, route, actor, and exact action that failed.",
      "Check whether the issue blocks the next student action or only a staff review surface.",
      "Route visual polish issues separately from data, auth, and write incidents.",
    ],
    missingLiveEvidence: [
      "Phone-sized staging QA across the pilot devices and browsers.",
      "Install, manifest, icon, service worker, cache update, and recovery expectations approved on real devices.",
      "Accessibility and keyboard or screen-reader smoke checks on the release build.",
    ],
    reviewRoutes: ["/rush-month", "/rush-month/actions", "/offline", "/admin"],
    approvalRequired: "Product and launch owners must approve before pilot invitations.",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    secretsShown: 0,
  },
  {
    key: "pilot_communications",
    label: "Pilot communications and day-one support",
    ownerLane: "HQ Operations",
    status: "blocked_before_live",
    localRunbook:
      "Staff dry-run guide, stakeholder review, and pilot scope planner exist, but the first real pilot group and day-one support plan are not approved.",
    firstResponseSteps: [
      "Confirm whether the issue affects one student, one chapter, or the whole pilot.",
      "Use the pilot scope and staff dry-run route to decide whether to advance, hold, or intervene.",
      "Send communications only from approved MEDLIFE channels, not from app automation.",
    ],
    missingLiveEvidence: [
      "Named first pilot group, support channel, escalation owner, and launch window.",
      "Staff rehearsal completed on the release build with current support scripts.",
      "Student-facing pause or rollback message approved before invitations go out.",
    ],
    reviewRoutes: ["/admin/pilot-scope", "/admin/staff-dry-run", "/coach"],
    approvalRequired: "Nick and HQ operations must approve the first pilot group.",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    secretsShown: 0,
  },
];

function emptyCounts(): ProductionOperationsRunbook["counts"] {
  return {
    total: 0,
    localRunbookReady: 0,
    blockedBeforeLive: 0,
  };
}

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "staff":
      return "Admin production operations runbook";
    case "ds_admin":
      return "DS Admin production operations and recovery runbook";
    case "super_admin":
      return "Full production operations runbook";
    case "member":
    case "leader":
    case "coach":
      return "Production operations runbook hidden for this role";
  }
}
