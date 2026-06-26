import { getPreferredCampaignVersion, getSopTemplateRegistry } from "@/services/sop-template-registry";
import type { SopRole, SopScope } from "@/shared/types/sop-builder";
import type {
  CampaignTemplate,
  CampaignVersion,
  TemplateImportStatus,
  WorkflowOperation,
  WorkflowPermissionAuthorityStatus,
} from "@/shared/types/sop-templates";

export type WorkflowImportReadiness =
  | "ready_for_draft_import"
  | "needs_permissions_resolution"
  | "needs_figma_mapping"
  | "needs_source_clarification"
  | "blocked_by_security_boundary";

export type WorkflowInventoryEntry = {
  slug: string;
  name: string;
  versionLabel: string;
  importStatus: TemplateImportStatus;
  importReadiness: WorkflowImportReadiness;
  period: string;
  isCoreMedInternational: boolean;
  ownerRoles: readonly SopRole[];
  targetSurfaces: readonly string[];
  sourceDocumentRefs: readonly string[];
  sourceGapCount: number;
  phaseCount: number;
  stepCount: number;
  rolloutOrder: number;
  summary: string;
};

export type WorkflowPermissionInventoryEntry = {
  key: string;
  workflowSlug: string;
  workflowName: string;
  versionLabel: string;
  operation: WorkflowOperation;
  allowedRoles: readonly SopRole[];
  allowedScopes: readonly SopScope[];
  approvalRequired: boolean;
  authorityStatus: WorkflowPermissionAuthorityStatus;
  backendOnly: boolean;
  note: string;
};

export type WorkflowInventorySnapshot = {
  workflows: readonly WorkflowInventoryEntry[];
  permissions: readonly WorkflowPermissionInventoryEntry[];
  counts: {
    totalWorkflows: number;
    coreCampaigns: number;
    adjacentCampaigns: number;
    readyForDraftImport: number;
    needsPermissionsResolution: number;
    needsSourceClarification: number;
    blockedBySecurityBoundary: number;
  };
};

const coreWorkflowSlugs = new Set([
  "planning-goal-setting",
  "rush-month",
  "chapter-engagement",
  "slt-promotion",
  "moving-mountains",
  "leadership-transition",
]);

export function getWorkflowInventorySnapshot(): WorkflowInventorySnapshot {
  const templates = getSopTemplateRegistry();
  const workflows = templates
    .map((template) => createWorkflowInventoryEntry(template))
    .filter((entry): entry is WorkflowInventoryEntry => entry !== null)
    .sort((a, b) => a.rolloutOrder - b.rolloutOrder || a.name.localeCompare(b.name));
  const permissions = templates
    .flatMap((template) => createPermissionEntries(template))
    .sort((a, b) => a.workflowName.localeCompare(b.workflowName) || a.operation.localeCompare(b.operation));

  return {
    workflows,
    permissions,
    counts: {
      totalWorkflows: workflows.length,
      coreCampaigns: workflows.filter((workflow) => workflow.isCoreMedInternational).length,
      adjacentCampaigns: workflows.filter((workflow) => !workflow.isCoreMedInternational).length,
      readyForDraftImport: workflows.filter(
        (workflow) => workflow.importReadiness === "ready_for_draft_import",
      ).length,
      needsPermissionsResolution: workflows.filter(
        (workflow) => workflow.importReadiness === "needs_permissions_resolution",
      ).length,
      needsSourceClarification: workflows.filter(
        (workflow) => workflow.importReadiness === "needs_source_clarification",
      ).length,
      blockedBySecurityBoundary: workflows.filter(
        (workflow) => workflow.importReadiness === "blocked_by_security_boundary",
      ).length,
    },
  };
}

function createWorkflowInventoryEntry(
  template: CampaignTemplate,
): WorkflowInventoryEntry | null {
  const version = getPreferredCampaignVersion(template);

  if (!version) {
    return null;
  }

  const ownerRoles = uniqueRoles([
    ...version.reviewSummary.rolesAffected,
    ...version.roleActionRules.map((rule) => rule.role),
  ]);
  const targetSurfaces = uniqueStrings(
    template.primaryAppLocations.flatMap((route) => getSurfaceLabels(route)),
  );
  const sourceDocumentRefs = version.sourceReferences.map(
    (reference) => `${reference.label} (${reference.location})`,
  );

  return {
    slug: template.slug,
    name: template.name,
    versionLabel: version.label,
    importStatus: version.status,
    importReadiness: classifyImportReadiness(template, version),
    period: template.period,
    isCoreMedInternational: coreWorkflowSlugs.has(template.slug),
    ownerRoles,
    targetSurfaces,
    sourceDocumentRefs,
    sourceGapCount: countSourceGaps(version),
    phaseCount: version.phases.length,
    stepCount: version.reviewSummary.extractedStepCount,
    rolloutOrder: version.reviewSummary.suggestedRolloutOrder,
    summary: version.importSummary,
  };
}

function createPermissionEntries(
  template: CampaignTemplate,
): readonly WorkflowPermissionInventoryEntry[] {
  const version = getPreferredCampaignVersion(template);

  if (!version) {
    return [];
  }

  return version.operationPermissions.map((permission) => ({
    key: `${template.slug}-${permission.operation}`,
    workflowSlug: template.slug,
    workflowName: template.name,
    versionLabel: version.label,
    operation: permission.operation,
    allowedRoles: permission.allowedRoles,
    allowedScopes: permission.allowedScopes,
    approvalRequired: permission.approvalRequired,
    authorityStatus: permission.authorityStatus,
    backendOnly: permission.allowedScopes.every((scope) =>
      ["department", "all_platform", "breakglass"].includes(scope),
    ),
    note: permission.note,
  }));
}

function classifyImportReadiness(
  template: CampaignTemplate,
  version: CampaignVersion,
): WorkflowImportReadiness {
  const hasExplicitPackageCoverage = version.sourceReferences.some(
    (reference) =>
      reference.sourceType === "campaign_catalog" &&
      reference.certainty !== "repo_only_placeholder",
  ) &&
    version.sourceReferences.some(
      (reference) =>
        reference.sourceType === "sop_pdf" &&
        reference.certainty !== "repo_only_placeholder",
    );
  const hasFigmaMapping =
    version.reviewSummary.figmaSurfacesAffected.length > 0 ||
    template.primaryAppLocations.length > 0;
  const hasSourceClarificationGap = version.sourceReferences.some(
    (reference) => reference.certainty === "missing_source_confirmation",
  );
  const hasPermissionGap = version.operationPermissions.some(
    (permission) => permission.authorityStatus !== "permissions_matrix_linked",
  );
  const isSecuritySensitive =
    version.reviewSummary.sensitiveDataWarnings.length > 0 &&
    template.primaryAppLocations.some((route) => route.startsWith("/slt-prep"));

  if (!hasExplicitPackageCoverage || hasSourceClarificationGap) {
    return "needs_source_clarification";
  }

  if (isSecuritySensitive) {
    return "blocked_by_security_boundary";
  }

  if (!hasFigmaMapping) {
    return "needs_figma_mapping";
  }

  if (hasPermissionGap) {
    return "needs_permissions_resolution";
  }

  return "ready_for_draft_import";
}

function countSourceGaps(version: CampaignVersion) {
  return version.sourceReferences.filter(
    (reference) =>
      reference.certainty === "repo_only_placeholder" ||
      reference.certainty === "missing_source_confirmation",
  ).length;
}

function getSurfaceLabels(route: string): readonly string[] {
  if (route.startsWith("/slt-prep")) {
    return ["SLT Prep"];
  }

  if (route.startsWith("/chapter")) {
    return ["Student Leadership Command Center"];
  }

  if (route.startsWith("/coach")) {
    return ["Coach Command Center"];
  }

  if (route.startsWith("/staff")) {
    return ["Staff Command Center"];
  }

  if (route.startsWith("/admin")) {
    return ["DS/Admin Backend"];
  }

  return ["Student Mobile App"];
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function uniqueRoles(values: readonly SopRole[]): readonly SopRole[] {
  return [...new Set(values)];
}
