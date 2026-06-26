import { sopTemplateRegistry } from "@/data/mock-sop-template-registry";
import type { SopRole, SopScope } from "@/shared/types/sop-builder";
import type {
  CampaignStep,
  CampaignTemplate,
  CampaignVersion,
  OutboxPreviewRecord,
  StepRuleEvaluation,
  TemplateImportStatus,
} from "@/shared/types/sop-templates";

const preferredStatusOrder: readonly TemplateImportStatus[] = [
  "live",
  "scheduled",
  "draft_reviewed",
  "draft_imported",
  "archived",
];

export function getSopTemplateRegistry(): readonly CampaignTemplate[] {
  return sopTemplateRegistry;
}

export function getSopTemplateBySlug(
  campaignSlug: string,
): CampaignTemplate | null {
  return (
    sopTemplateRegistry.find((template) => template.slug === campaignSlug) ??
    null
  );
}

export function getFirstStructuredImportTemplate(): CampaignTemplate | null {
  return getSopTemplateBySlug("planning-goal-setting");
}

export function getPreferredCampaignVersion(
  templateOrSlug: CampaignTemplate | string,
): CampaignVersion | null {
  const template =
    typeof templateOrSlug === "string"
      ? getSopTemplateBySlug(templateOrSlug)
      : templateOrSlug;

  if (!template) {
    return null;
  }

  if (template.liveVersionId) {
    return (
      template.versions.find((version) => version.id === template.liveVersionId) ??
      null
    );
  }

  for (const status of preferredStatusOrder) {
    const version = template.versions.find(
      (candidate) => candidate.status === status,
    );

    if (version) {
      return version;
    }
  }

  return template.versions[0] ?? null;
}

export function getAllowedTemplateVersionTransitions(
  status: TemplateImportStatus,
): readonly TemplateImportStatus[] {
  switch (status) {
    case "draft_imported":
      return ["draft_reviewed", "archived"];
    case "draft_reviewed":
      return ["live", "scheduled", "archived"];
    case "scheduled":
      return ["live", "archived"];
    case "live":
      return ["archived"];
    case "archived":
      return ["draft_imported"];
  }
}

export function evaluateCampaignStepAccess({
  campaignSlug,
  role,
  scope,
  stepId,
  versionId,
}: {
  campaignSlug: string;
  role: SopRole;
  scope: SopScope;
  stepId: string;
  versionId?: string;
}): StepRuleEvaluation | null {
  const version = resolveVersion(campaignSlug, versionId);

  if (!version) {
    return null;
  }

  const step = findStep(version, stepId);

  if (!step) {
    return null;
  }

  const matchingRoleRules = version.roleActionRules.filter((rule) => {
    return step.roleActionRuleIds.includes(rule.id) && rule.role === role;
  });
  const roleMatches = step.ownerRoles.includes(role) || matchingRoleRules.length > 0;
  const scopeMatches = matchingRoleRules.some((rule) => rule.scope === scope);

  return {
    roleMatches,
    scopeMatches,
    matchingRoleRules,
  };
}

export function buildOutboxPreviewRecords({
  campaignSlug,
  versionId,
}: {
  campaignSlug: string;
  versionId?: string;
}): readonly OutboxPreviewRecord[] {
  const version = resolveVersion(campaignSlug, versionId);

  if (!version) {
    return [];
  }

  return version.phases.flatMap((phase) =>
    phase.steps.flatMap((step) =>
      step.integrationTriggerRuleIds.flatMap((triggerId) => {
        const trigger = version.integrationTriggerRules.find(
          (candidate) => candidate.id === triggerId,
        );

        if (!trigger) {
          return [];
        }

        return [
          {
            templateSlug: campaignSlug,
            versionId: version.id,
            stepId: step.id,
            integrationTriggerId: trigger.id,
            eventName: trigger.eventName,
            externalSystem: trigger.externalSystem,
            outboxTopic: trigger.outboxTopic,
            mode: trigger.mode,
            directSendEnabled: false,
          },
        ];
      }),
    ),
  );
}

function resolveVersion(
  campaignSlug: string,
  versionId?: string,
): CampaignVersion | null {
  const template = getSopTemplateBySlug(campaignSlug);

  if (!template) {
    return null;
  }

  if (versionId) {
    return template.versions.find((version) => version.id === versionId) ?? null;
  }

  return getPreferredCampaignVersion(template);
}

function findStep(
  version: CampaignVersion,
  stepId: string,
): CampaignStep | null {
  for (const phase of version.phases) {
    const step = phase.steps.find((candidate) => candidate.id === stepId);

    if (step) {
      return step;
    }
  }

  return null;
}
