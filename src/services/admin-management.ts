import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getAllowedWorkspaces,
  getDefaultWorkspace,
  type WorkspaceAccessUser,
  type WorkspaceKey,
} from "@/services/workspace-access";

export type ManagedUserStatus =
  | "active"
  | "pending"
  | "disabled"
  | "deactivated"
  | "deleted";

export type ManagedChapterStatus = "active" | "disabled" | "archived" | "deleted";

export type ManagedChapterMembership = {
  chapterId: string;
  roleKey: string;
};

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  status: ManagedUserStatus;
  chapterMemberships: ManagedChapterMembership[];
  staffRoles: string[];
  portfolioChapterIds: string[];
  inviteStatus?: "not_sent" | "sent" | "accepted";
};

export type ManagedChapter = {
  id: string;
  name: string;
  school: string;
  region: string;
  status: ManagedChapterStatus;
  coachOwnerId: string | null;
  staffOwnerIds: string[];
  studentLeaderIds: string[];
  activeModules: string[];
  activeMemberCount: number;
  activeEventCount: number;
  historicalRecordCount: number;
};

export type AdminAuditRecord = {
  actor: string;
  actorRole: string;
  targetType: "user" | "chapter" | "access";
  targetId: string;
  targetLabel: string;
  action: string;
  oldValue: string;
  newValue: string;
  reason: string;
  timestamp: string;
  environment: string;
};

export type ManagedUserAccessSummary = {
  userId: string;
  allowedWorkspaces: WorkspaceKey[];
  defaultWorkspace: WorkspaceKey;
  previewWorkspaces: WorkspaceKey[];
};

export type AdminMutationResult<T> =
  | {
      ok: true;
      value: T;
      audit: AdminAuditRecord;
      warnings: string[];
    }
  | AdminMutationFailure;

export type AdminMutationFailure = {
      ok: false;
      code:
        | "admin_access_required"
        | "confirmation_required"
        | "reason_required"
        | "self_destructive_action_blocked"
        | "super_admin_protected"
        | "production_hard_delete_blocked"
        | "chapter_has_active_data";
      message: string;
      warnings: string[];
    };

type AdminMutationBase = {
  actor: LocalActorContext;
  reason: string;
  environment?: string;
  now?: string;
};

export type UserSearchFilters = {
  query?: string;
  role?: string;
  chapterId?: string;
  status?: ManagedUserStatus | "all";
};

export type ChapterSearchFilters = {
  query?: string;
  region?: string;
  coachOwnerId?: string;
  status?: ManagedChapterStatus | "all";
};

export function searchManagedUsers(
  users: readonly ManagedUser[],
  filters: UserSearchFilters,
): ManagedUser[] {
  const query = normalize(filters.query ?? "");
  const role = normalize(filters.role ?? "all");

  return users.filter((user) => {
    const matchesQuery =
      query.length === 0 ||
      normalize(user.name).includes(query) ||
      normalize(user.email).includes(query);
    const matchesRole =
      role === "all" ||
      user.staffRoles.some((item) => normalize(item).includes(role)) ||
      user.chapterMemberships.some((item) => normalize(item.roleKey).includes(role));
    const matchesChapter =
      !filters.chapterId ||
      user.chapterMemberships.some((item) => item.chapterId === filters.chapterId) ||
      user.portfolioChapterIds.includes(filters.chapterId);
    const matchesStatus =
      !filters.status || filters.status === "all" || user.status === filters.status;

    return matchesQuery && matchesRole && matchesChapter && matchesStatus;
  });
}

export function searchManagedChapters(
  chapters: readonly ManagedChapter[],
  filters: ChapterSearchFilters,
): ManagedChapter[] {
  const query = normalize(filters.query ?? "");
  const region = normalize(filters.region ?? "all");

  return chapters.filter((chapter) => {
    const matchesQuery =
      query.length === 0 ||
      normalize(chapter.name).includes(query) ||
      normalize(chapter.school).includes(query);
    const matchesRegion = region === "all" || normalize(chapter.region).includes(region);
    const matchesCoach =
      !filters.coachOwnerId || chapter.coachOwnerId === filters.coachOwnerId;
    const matchesStatus =
      !filters.status || filters.status === "all" || chapter.status === filters.status;

    return matchesQuery && matchesRegion && matchesCoach && matchesStatus;
  });
}

export function getManagedUserAccess(user: ManagedUser): ManagedUserAccessSummary {
  const accessUser = toWorkspaceAccessUser(user);
  const workspaces = getAllowedWorkspaces(accessUser);

  return {
    userId: user.id,
    allowedWorkspaces: workspaces.map((workspace) => workspace.key),
    defaultWorkspace: getDefaultWorkspace(accessUser),
    previewWorkspaces: workspaces
      .filter((workspace) => workspace.readOnly)
      .map((workspace) => workspace.key),
  };
}

export function buildUnauthorizedAdminAttemptAudit({
  actor,
  attemptedPath,
  environment = "local",
  now = new Date().toISOString(),
}: {
  actor: LocalActorContext;
  attemptedPath: string;
  environment?: string;
  now?: string;
}): AdminAuditRecord {
  return buildAudit({
    actor,
    action: "access.denied",
    environment,
    newValue: attemptedPath,
    now,
    oldValue: "not_authorized",
    reason: "Unauthorized manual admin URL attempt.",
    targetId: actor.user.id,
    targetLabel: actor.user.email,
    targetType: "access",
  });
}

export function buildPreviewWorkspaceAccessAudit({
  actor,
  environment = "local",
  now = new Date().toISOString(),
  workspace,
}: {
  actor: LocalActorContext;
  workspace: WorkspaceKey;
  environment?: string;
  now?: string;
}): AdminAuditRecord {
  return buildAudit({
    actor,
    action: "access.preview_viewed",
    environment,
    newValue: workspace,
    now,
    oldValue: "read_only_preview",
    reason: "Staff/admin opened a read-only workspace preview.",
    targetId: actor.user.id,
    targetLabel: actor.user.email,
    targetType: "access",
  });
}

export function changeManagedUserAccess({
  actor,
  environment = "local",
  nextChapterMemberships,
  nextPortfolioChapterIds,
  nextStaffRoles,
  now = new Date().toISOString(),
  reason,
  user,
}: AdminMutationBase & {
  user: ManagedUser;
  nextChapterMemberships?: ManagedChapterMembership[];
  nextStaffRoles?: string[];
  nextPortfolioChapterIds?: string[];
}): AdminMutationResult<ManagedUser> {
  const guard = getAdminGuardFailure(actor);
  if (guard) return guard;

  const reasonFailure = getReasonFailure(reason);
  if (reasonFailure) return reasonFailure;

  if (isSuperAdminUser(user) && actor.audience !== "super_admin") {
    return protectedSuperAdminFailure();
  }

  const before = summarizeUserAccess(user);
  const updated: ManagedUser = {
    ...user,
    chapterMemberships: nextChapterMemberships ?? user.chapterMemberships,
    staffRoles: nextStaffRoles ?? user.staffRoles,
    portfolioChapterIds: nextPortfolioChapterIds ?? user.portfolioChapterIds,
  };

  return {
    ok: true,
    value: updated,
    audit: buildAudit({
      actor,
      action: "user.access_change",
      environment,
      newValue: summarizeUserAccess(updated),
      now,
      oldValue: before,
      reason,
      targetId: user.id,
      targetLabel: user.email,
      targetType: "user",
    }),
    warnings: [],
  };
}

export function setManagedUserStatus({
  actor,
  confirmation,
  environment = "local",
  nextStatus,
  now = new Date().toISOString(),
  reason,
  user,
}: AdminMutationBase & {
  user: ManagedUser;
  nextStatus: Extract<ManagedUserStatus, "disabled" | "deactivated">;
  confirmation: string;
}): AdminMutationResult<ManagedUser> {
  const guard = getAdminGuardFailure(actor);
  if (guard) return guard;

  const reasonFailure = getReasonFailure(reason);
  if (reasonFailure) return reasonFailure;

  if (confirmation !== "CONFIRM USER STATUS CHANGE") {
    return confirmationFailure("Type CONFIRM USER STATUS CHANGE to disable or deactivate a user.");
  }

  if (actor.user.email.toLowerCase() === user.email.toLowerCase()) {
    return {
      ok: false,
      code: "self_destructive_action_blocked",
      message: "Admins cannot disable or deactivate their own account.",
      warnings: [],
    };
  }

  if (isSuperAdminUser(user) && actor.audience !== "super_admin") {
    return protectedSuperAdminFailure();
  }

  const updated = { ...user, status: nextStatus };

  return {
    ok: true,
    value: updated,
    audit: buildAudit({
      actor,
      action: `user.${nextStatus}`,
      environment,
      newValue: nextStatus,
      now,
      oldValue: user.status,
      reason,
      targetId: user.id,
      targetLabel: user.email,
      targetType: "user",
    }),
    warnings: ["Historical event, attendance, and points records remain preserved."],
  };
}

export function deleteManagedUser({
  actor,
  confirmation,
  environment = "local",
  hardDelete = false,
  now = new Date().toISOString(),
  reason,
  user,
}: AdminMutationBase & {
  user: ManagedUser;
  confirmation: string;
  hardDelete?: boolean;
}): AdminMutationResult<ManagedUser> {
  const guard = getAdminGuardFailure(actor);
  if (guard) return guard;

  const reasonFailure = getReasonFailure(reason);
  if (reasonFailure) return reasonFailure;

  if (confirmation !== "DELETE USER") {
    return confirmationFailure("Type DELETE USER to delete or soft-delete a user.");
  }

  if (actor.user.email.toLowerCase() === user.email.toLowerCase()) {
    return {
      ok: false,
      code: "self_destructive_action_blocked",
      message: "Admins cannot delete their own account.",
      warnings: [],
    };
  }

  if (isSuperAdminUser(user) && actor.audience !== "super_admin") {
    return protectedSuperAdminFailure();
  }

  if (hardDelete && environment === "production" && actor.audience !== "super_admin") {
    return {
      ok: false,
      code: "production_hard_delete_blocked",
      message: "Production hard delete requires Super Admin confirmation.",
      warnings: ["Use deactivation or soft-delete unless legal deletion is approved."],
    };
  }

  const updated = { ...user, status: "deleted" as const };

  return {
    ok: true,
    value: updated,
    audit: buildAudit({
      actor,
      action: hardDelete ? "user.hard_delete_requested" : "user.soft_deleted",
      environment,
      newValue: updated.status,
      now,
      oldValue: user.status,
      reason,
      targetId: user.id,
      targetLabel: user.email,
      targetType: "user",
    }),
    warnings: ["Historical event, attendance, and points records remain preserved."],
  };
}

export function createManagedChapter({
  actor,
  chapter,
  environment = "local",
  now = new Date().toISOString(),
  reason,
}: AdminMutationBase & {
  chapter: ManagedChapter;
}): AdminMutationResult<ManagedChapter> {
  const guard = getAdminGuardFailure(actor);
  if (guard) return guard;

  const reasonFailure = getReasonFailure(reason);
  if (reasonFailure) return reasonFailure;

  return {
    ok: true,
    value: chapter,
    audit: buildAudit({
      actor,
      action: "chapter.created",
      environment,
      newValue: summarizeChapter(chapter),
      now,
      oldValue: "none",
      reason,
      targetId: chapter.id,
      targetLabel: chapter.name,
      targetType: "chapter",
    }),
    warnings: [],
  };
}

export function updateManagedChapter({
  actor,
  chapter,
  environment = "local",
  next,
  now = new Date().toISOString(),
  reason,
}: AdminMutationBase & {
  chapter: ManagedChapter;
  next: Partial<
    Pick<
      ManagedChapter,
      | "activeModules"
      | "coachOwnerId"
      | "name"
      | "region"
      | "school"
      | "staffOwnerIds"
      | "studentLeaderIds"
    >
  >;
}): AdminMutationResult<ManagedChapter> {
  const guard = getAdminGuardFailure(actor);
  if (guard) return guard;

  const reasonFailure = getReasonFailure(reason);
  if (reasonFailure) return reasonFailure;

  const updated = { ...chapter, ...next };

  return {
    ok: true,
    value: updated,
    audit: buildAudit({
      actor,
      action: "chapter.updated",
      environment,
      newValue: summarizeChapter(updated),
      now,
      oldValue: summarizeChapter(chapter),
      reason,
      targetId: chapter.id,
      targetLabel: chapter.name,
      targetType: "chapter",
    }),
    warnings: [],
  };
}

export function archiveManagedChapter({
  actor,
  chapter,
  confirmation,
  environment = "local",
  now = new Date().toISOString(),
  reason,
}: AdminMutationBase & {
  chapter: ManagedChapter;
  confirmation: string;
}): AdminMutationResult<ManagedChapter> {
  const guard = getAdminGuardFailure(actor);
  if (guard) return guard;

  const reasonFailure = getReasonFailure(reason);
  if (reasonFailure) return reasonFailure;

  if (confirmation !== "ARCHIVE CHAPTER") {
    return confirmationFailure("Type ARCHIVE CHAPTER to archive this chapter.");
  }

  const updated = { ...chapter, status: "archived" as const };

  return {
    ok: true,
    value: updated,
    audit: buildAudit({
      actor,
      action: "chapter.archived",
      environment,
      newValue: updated.status,
      now,
      oldValue: chapter.status,
      reason,
      targetId: chapter.id,
      targetLabel: chapter.name,
      targetType: "chapter",
    }),
    warnings: getChapterDataWarnings(chapter),
  };
}

export function deleteManagedChapter({
  actor,
  chapter,
  confirmation,
  environment = "local",
  hardDelete = false,
  now = new Date().toISOString(),
  reason,
}: AdminMutationBase & {
  chapter: ManagedChapter;
  confirmation: string;
  hardDelete?: boolean;
}): AdminMutationResult<ManagedChapter> {
  const guard = getAdminGuardFailure(actor);
  if (guard) return guard;

  const reasonFailure = getReasonFailure(reason);
  if (reasonFailure) return reasonFailure;

  if (confirmation !== "DELETE CHAPTER") {
    return confirmationFailure("Type DELETE CHAPTER to delete or soft-delete this chapter.");
  }

  const warnings = getChapterDataWarnings(chapter);

  if (hardDelete && environment === "production" && actor.audience !== "super_admin") {
    return {
      ok: false,
      code: "production_hard_delete_blocked",
      message: "Production chapter hard delete requires Super Admin confirmation.",
      warnings,
    };
  }

  if (hardDelete && warnings.length > 0) {
    return {
      ok: false,
      code: "chapter_has_active_data",
      message: "Hard delete is blocked while the chapter has active or historical data.",
      warnings,
    };
  }

  const updated = { ...chapter, status: "deleted" as const };

  return {
    ok: true,
    value: updated,
    audit: buildAudit({
      actor,
      action: hardDelete ? "chapter.hard_delete_requested" : "chapter.soft_deleted",
      environment,
      newValue: updated.status,
      now,
      oldValue: chapter.status,
      reason,
      targetId: chapter.id,
      targetLabel: chapter.name,
      targetType: "chapter",
    }),
    warnings,
  };
}

function getAdminGuardFailure(actor: LocalActorContext): AdminMutationFailure | null {
  if (actor.audience === "ds_admin" || actor.audience === "super_admin") {
    return null;
  }

  return {
    ok: false,
    code: "admin_access_required",
    message: "Only DS Admin and Super Admin can manage users, access, and chapters.",
    warnings: [],
  };
}

function getReasonFailure(reason: string): AdminMutationFailure | null {
  if (reason.trim().length >= 8) {
    return null;
  }

  return {
    ok: false,
    code: "reason_required",
    message: "A clear audit reason is required.",
    warnings: [],
  };
}

function confirmationFailure(message: string): AdminMutationFailure {
  return {
    ok: false,
    code: "confirmation_required",
    message,
    warnings: [],
  };
}

function protectedSuperAdminFailure(): AdminMutationFailure {
  return {
    ok: false,
    code: "super_admin_protected",
    message: "Only a Super Admin can disable, delete, or demote another Super Admin.",
    warnings: [],
  };
}

function buildAudit(input: {
  actor: LocalActorContext;
  action: string;
  environment: string;
  newValue: string;
  now: string;
  oldValue: string;
  reason: string;
  targetId: string;
  targetLabel: string;
  targetType: AdminAuditRecord["targetType"];
}): AdminAuditRecord {
  return {
    actor: input.actor.user.email,
    actorRole: input.actor.audienceLabel,
    targetType: input.targetType,
    targetId: input.targetId,
    targetLabel: input.targetLabel,
    action: input.action,
    oldValue: input.oldValue,
    newValue: input.newValue,
    reason: input.reason.trim(),
    timestamp: input.now,
    environment: input.environment,
  };
}

function toWorkspaceAccessUser(user: ManagedUser): WorkspaceAccessUser {
  return {
    chapterRoles: user.chapterMemberships.map((membership) => membership.roleKey),
    staffRoles: user.staffRoles,
  };
}

function summarizeUserAccess(user: ManagedUser): string {
  return JSON.stringify({
    chapterMemberships: user.chapterMemberships,
    staffRoles: user.staffRoles,
    portfolioChapterIds: user.portfolioChapterIds,
  });
}

function summarizeChapter(chapter: ManagedChapter): string {
  return JSON.stringify({
    name: chapter.name,
    school: chapter.school,
    region: chapter.region,
    status: chapter.status,
    coachOwnerId: chapter.coachOwnerId,
    staffOwnerIds: chapter.staffOwnerIds,
    studentLeaderIds: chapter.studentLeaderIds,
    activeModules: chapter.activeModules,
  });
}

function isSuperAdminUser(user: ManagedUser): boolean {
  return user.staffRoles.some((role) => normalize(role) === "super_admin");
}

function getChapterDataWarnings(chapter: ManagedChapter): string[] {
  const warnings: string[] = [];

  if (chapter.activeMemberCount > 0) {
    warnings.push("Chapter has active members.");
  }

  if (chapter.activeEventCount > 0) {
    warnings.push("Chapter has active events.");
  }

  if (chapter.historicalRecordCount > 0) {
    warnings.push("Historical events, attendance, and points records must be preserved.");
  }

  return warnings;
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}
