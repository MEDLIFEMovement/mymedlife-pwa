import type { LocalActorContext } from "@/services/local-actor-context";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
import { getAdminLumaIntegrationStatus } from "@/services/admin-luma-integration-status";
import { getChapterLumaCalendarSummary } from "@/services/chapter-luma-calendars";
import {
  getIntegrationContractReview,
  type IntegrationContractReview,
} from "@/services/integration-contract-review";
import {
  getLumaRsvpAttendanceWritebackSafetyContract,
  type LumaRsvpAttendanceWritebackSafetyContract,
} from "@/services/luma-rsvp-attendance-writeback-safety-contract";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";

export type LumaDryRunAdapterRoute = {
  href: string;
  label: string;
  purpose: string;
};

export type LumaDryRunAdapterPacket = {
  canReadPacket: boolean;
  title: string;
  summary: string;
  posture: "read_only_preview" | "hidden_for_role";
  localOnly: true;
  routes: readonly LumaDryRunAdapterRoute[];
  chapterCalendarSummary: ReturnType<typeof getChapterLumaCalendarSummary>;
  adminLumaStatus: ReturnType<typeof getAdminLumaIntegrationStatus>;
  integrationContractReview: IntegrationContractReview;
  writebackSafetyContract: LumaRsvpAttendanceWritebackSafetyContract;
  evidenceAndBoundaries: {
    providerCalls: 0;
    browserWritesEnabled: 0;
    externalWritesEnabled: 0;
    secretsShown: 0;
  };
  blockedControls: readonly string[];
  noGoRules: readonly string[];
  nextSmallestGoal: string;
};

export function getLumaDryRunAdapterPacket(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  env: Record<string, string | undefined> = process.env,
): LumaDryRunAdapterPacket {
  if (!canReadAdminIntegrationsSecurity(actor)) {
    return hiddenPacket();
  }

  const chapterCalendarSummary = getChapterLumaCalendarSummary({
    chapters: data.chapterRows,
    persistedRows: data.chapterLumaCalendarRows,
    env,
  });
  const adminLumaStatus = getAdminLumaIntegrationStatus(actor, data, env);
  const integrationContractReview = getIntegrationContractReview(data);
  const writebackSafetyContract = getLumaRsvpAttendanceWritebackSafetyContract();

  return {
    canReadPacket: true,
    title: "Luma dry-run adapter packet",
    summary:
      "This read-only adapter composes the chapter-to-calendar map, provider posture, integration contract review, and writeback safety contract without making any provider call or browser write. It is the handoff layer future integration work can rely on before any real Luma lane is approved.",
    posture: "read_only_preview",
    localOnly: true,
    routes: [
      {
        href: "/admin/integrations/luma",
        label: "Luma status",
        purpose: "Inspect provider posture, mapping readiness, and blocked controls.",
      },
      {
        href: "/admin/integration-outbox",
        label: "Integration outbox",
        purpose: "Inspect disabled outbox rows, readback posture, and zero-send boundaries.",
      },
      {
        href: "/leader?view=events",
        label: "Leader events",
        purpose: "Keep the member event loop, attendance, and points review separate from provider writes.",
      },
      {
        href: "/app/events",
        label: "Member events",
        purpose: "Keep RSVP and event-detail posture local until a provider lane is approved.",
      },
    ],
    chapterCalendarSummary,
    adminLumaStatus,
    integrationContractReview,
    writebackSafetyContract,
    evidenceAndBoundaries: {
      providerCalls: 0,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      secretsShown: 0,
    },
    blockedControls: uniqueStrings([
      ...adminLumaStatus.blockedControls,
      ...integrationContractReview.blockedControls,
      ...writebackSafetyContract.lanes.flatMap((lane) => lane.forbiddenSideEffects.slice(0, 2)),
    ]),
    noGoRules: [
      "No provider API call is allowed from this adapter.",
      "No browser-facing write or outbox send is allowed from this adapter.",
      "No secret, token, or live-send posture may be exposed as proof.",
      "No chapter calendar mapping is rollout proof until the separate production mapping and invite-gate packets are approved.",
    ],
    nextSmallestGoal:
      "Use the packet to verify the read-only mapping, contract, and outbox posture before any future Luma integration lane is allowed to write.",
  };
}

export function formatLumaDryRunAdapterPacket(
  packet: LumaDryRunAdapterPacket,
): string {
  return [
    "Luma dry-run adapter packet: READ-ONLY readiness spec",
    `- title: ${packet.title}`,
    `- posture: ${packet.posture}`,
    `- localOnly: ${String(packet.localOnly)}`,
    `- providerCalls: ${packet.evidenceAndBoundaries.providerCalls}`,
    `- browserWritesEnabled: ${packet.evidenceAndBoundaries.browserWritesEnabled}`,
    `- externalWritesEnabled: ${packet.evidenceAndBoundaries.externalWritesEnabled}`,
    `- secretsShown: ${packet.evidenceAndBoundaries.secretsShown}`,
    "",
    "Current route anchors:",
    ...packet.routes.map((route) => `- ${route.href} (${route.label}): ${route.purpose}`),
    "",
    "No-go rules:",
    ...packet.noGoRules.map((rule) => `- ${rule}`),
    "",
    `Next smallest goal: ${packet.nextSmallestGoal}`,
  ].join("\n");
}

function emptyChapterCalendarSummary(): ReturnType<typeof getChapterLumaCalendarSummary> {
  return {
    rows: [],
    readyCount: 0,
    explicitReadyCount: 0,
    savedReadyCount: 0,
    temporaryReadyCount: 0,
    sharedDefaultCount: 0,
    needsSetupCount: 0,
    totalCount: 0,
    detail: "No chapter-to-Luma calendar mappings are visible for this role.",
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function hiddenPacket(): LumaDryRunAdapterPacket {
  const hiddenRoutes: LumaDryRunAdapterRoute[] = [
    {
      href: "/admin/integrations/luma",
      label: "Luma status",
      purpose: "Hidden for this role.",
    },
  ];

  return {
    canReadPacket: false,
    title: "Luma dry-run adapter hidden for this role",
    summary:
      "Only DS Admin and Super Admin can inspect the Luma dry-run adapter packet.",
    posture: "hidden_for_role",
    localOnly: true,
    routes: hiddenRoutes,
    chapterCalendarSummary: emptyChapterCalendarSummary(),
    adminLumaStatus: {
      canReadWorkspace: false,
      title: "Luma integration hidden for this role",
      summary: "Hidden for this role.",
      providerStatus: "disabled",
      readSyncEnabled: false,
      environment: "disabled",
      environmentLabel: "Disabled",
      testConnection: {
        status: "blocked",
        label: "Blocked",
        detail: "Hidden for this role.",
      },
      lastTestTime: "Not available",
      lastSync: "Not available",
      outboxStatus: "Hidden",
      counts: {
        calendars: 0,
        linkedEvents: 0,
        lumaIntegrationEvents: 0,
        lumaOutboxRows: 0,
        liveSendRows: 0,
        browserSecretsShown: 0,
        externalReadsEnabled: 0,
        externalWritesEnabled: 0,
      },
      setupChecks: [],
      errorLog: [],
      safetyNotes: [],
      blockedControls: [],
    },
    integrationContractReview: {
      title: "Mock-safe integration contracts",
      summary: "Hidden for this role.",
      items: [],
      counts: {
        total: 0,
        ready: 0,
        watch: 0,
        blocked: 0,
        browserWritesEnabled: 0,
        externalWritesEnabled: 0,
      },
      blockedControls: [],
    },
    writebackSafetyContract: {
      title: "Luma RSVP / attendance-import / event-writeback safety contract",
      summary: [],
      currentWritePath: {
        exists: false,
        reason: "Hidden for this role.",
        blockedUntil: [],
      },
      adjacentGuardrails: [],
      globalGuards: [],
      requiredFoundations: [],
      lanes: [],
      validation: {
        ready: false,
        checks: [],
      },
    },
    evidenceAndBoundaries: {
      providerCalls: 0,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      secretsShown: 0,
    },
    blockedControls: [],
    noGoRules: ["Hidden for this role."],
    nextSmallestGoal: "Hidden for this role.",
  };
}
