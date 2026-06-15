import type {
  ActionTemplate,
  Approval,
  Assignment,
  AuditLog,
  AutomationOutbox,
  Campaign,
  Chapter,
  ChapterRole,
  EvidenceItem,
  IntegrationEvent,
  KPIEvent,
  Membership,
  Phase,
  PointsEvent,
  Role,
  User,
} from "@/shared/types/domain";

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type Schema<T> = {
  name: string;
  parse: (value: unknown) => T;
  safeParse: (value: unknown) => ParseResult<T>;
};

const chapterRoles = [
  "General Member",
  "Action Committee Member",
  "Action Committee Chair",
  "E-Board Member",
  "Chapter President / Vice President",
  "Admin",
  "Super Admin",
  "Coach",
] as const;

const assignmentStatuses = [
  "not_started",
  "in_progress",
  "submitted",
  "approved",
  "changes_requested",
] as const;

const destinations = ["internal", "n8n", "HubSpot", "Luma", "warehouse"] as const;
const outboxDestinations = ["n8n", "HubSpot", "Luma", "warehouse"] as const;
const integrationStatuses = ["recorded", "mocked", "disabled"] as const;

function createSchema<T>(name: string, parse: (value: unknown) => T): Schema<T> {
  return {
    name,
    parse,
    safeParse(value) {
      try {
        return { success: true, data: parse(value) };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : `${name} is invalid`,
        };
      }
    },
  };
}

function asRecord(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }

  return value as Record<string, unknown>;
}

function stringField(record: Record<string, unknown>, key: string): string {
  const value = record[key];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${key} must be a non-empty string`);
  }

  return value;
}

function numberField(record: Record<string, unknown>, key: string): number {
  const value = record[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${key} must be a finite number`);
  }

  return value;
}

function booleanField(record: Record<string, unknown>, key: string): boolean {
  const value = record[key];

  if (typeof value !== "boolean") {
    throw new Error(`${key} must be a boolean`);
  }

  return value;
}

function enumField<const T extends readonly string[]>(
  record: Record<string, unknown>,
  key: string,
  values: T,
): T[number] {
  const value = record[key];

  if (typeof value !== "string" || !(values as readonly string[]).includes(value)) {
    throw new Error(`${key} must be one of ${values.join(", ")}`);
  }

  return value;
}

function stringArrayField(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${key} must be a string array`);
  }

  return value;
}

function isChapterRole(value: string): value is ChapterRole {
  return (chapterRoles as readonly string[]).includes(value);
}

function roleArrayField(record: Record<string, unknown>, key: string): Membership["roles"] {
  const values = stringArrayField(record, key);

  return values.map((value) => {
    if (!isChapterRole(value)) {
      throw new Error(`${key} contains an unknown role`);
    }

    return value;
  });
}

export const userSchema = createSchema<User>("User", (value) => {
  const record = asRecord(value, "User");

  return {
    id: stringField(record, "id"),
    displayName: stringField(record, "displayName"),
    email: stringField(record, "email"),
  };
});

export const chapterSchema = createSchema<Chapter>("Chapter", (value) => {
  const record = asRecord(value, "Chapter");

  return {
    id: stringField(record, "id"),
    name: stringField(record, "name"),
    campus: stringField(record, "campus"),
    region: stringField(record, "region"),
    coachName: stringField(record, "coachName"),
  };
});

export const membershipSchema = createSchema<Membership>("Membership", (value) => {
  const record = asRecord(value, "Membership");

  return {
    id: stringField(record, "id"),
    userId: stringField(record, "userId"),
    chapterId: stringField(record, "chapterId"),
    roles: roleArrayField(record, "roles"),
    status: enumField(record, "status", ["requested", "approved", "inactive"] as const),
  };
});

export const roleSchema = createSchema<Role>("Role", (value) => {
  const record = asRecord(value, "Role");
  const key = enumField(record, "key", chapterRoles);

  return {
    key,
    label: stringField(record, "label"),
    chapterScoped: booleanField(record, "chapterScoped"),
  };
});

export const campaignSchema = createSchema<Campaign>("Campaign", (value) => {
  const record = asRecord(value, "Campaign");

  return {
    id: stringField(record, "id"),
    name: stringField(record, "name"),
    objective: stringField(record, "objective"),
    weekLabel: stringField(record, "weekLabel"),
    status: enumField(record, "status", ["draft", "active", "complete"] as const),
  };
});

export const phaseSchema = createSchema<Phase>("Phase", (value) => {
  const record = asRecord(value, "Phase");

  return {
    id: stringField(record, "id"),
    campaignId: stringField(record, "campaignId"),
    title: stringField(record, "title"),
    objective: stringField(record, "objective"),
    status: enumField(record, "status", ["not_started", "active", "complete"] as const),
  };
});

export const actionTemplateSchema = createSchema<ActionTemplate>("ActionTemplate", (value) => {
  const record = asRecord(value, "ActionTemplate");

  return {
    id: stringField(record, "id"),
    campaignId: stringField(record, "campaignId"),
    title: stringField(record, "title"),
    defaultOwnerRole: enumField(record, "defaultOwnerRole", chapterRoles),
    evidenceRequired: stringField(record, "evidenceRequired"),
    points: numberField(record, "points"),
    kpi: stringField(record, "kpi"),
  };
});

export const assignmentSchema = createSchema<Assignment>("Assignment", (value) => {
  const record = asRecord(value, "Assignment");

  return {
    id: stringField(record, "id"),
    title: stringField(record, "title"),
    ownerRole: enumField(record, "ownerRole", chapterRoles),
    lane: enumField(record, "lane", ["Member", "Leader", "Coach"] as const),
    dueLabel: stringField(record, "dueLabel"),
    status: enumField(record, "status", assignmentStatuses),
    evidenceRequired: stringField(record, "evidenceRequired"),
    instructions: stringField(record, "instructions"),
    points: numberField(record, "points"),
    kpi: stringField(record, "kpi"),
  };
});

export const evidenceItemSchema = createSchema<EvidenceItem>("EvidenceItem", (value) => {
  const record = asRecord(value, "EvidenceItem");

  return {
    id: stringField(record, "id"),
    assignmentId: stringField(record, "assignmentId"),
    submittedBy: stringField(record, "submittedBy"),
    evidenceType: enumField(record, "evidenceType", ["text", "link", "mock_file"] as const),
    summary: stringField(record, "summary"),
    status: enumField(
      record,
      "status",
      ["pending_review", "approved", "changes_requested"] as const,
    ),
  };
});

export const approvalSchema = createSchema<Approval>("Approval", (value) => {
  const record = asRecord(value, "Approval");

  return {
    id: stringField(record, "id"),
    evidenceItemId: stringField(record, "evidenceItemId"),
    reviewerRole: enumField(record, "reviewerRole", chapterRoles),
    decision: enumField(
      record,
      "decision",
      ["approved", "rejected", "changes_requested"] as const,
    ),
    note: stringField(record, "note"),
  };
});

export const pointsEventSchema = createSchema<PointsEvent>("PointsEvent", (value) => {
  const record = asRecord(value, "PointsEvent");

  return {
    id: stringField(record, "id"),
    assignmentId: stringField(record, "assignmentId"),
    userId: stringField(record, "userId"),
    points: numberField(record, "points"),
    reason: stringField(record, "reason"),
  };
});

export const kpiEventSchema = createSchema<KPIEvent>("KPIEvent", (value) => {
  const record = asRecord(value, "KPIEvent");

  return {
    id: stringField(record, "id"),
    assignmentId: stringField(record, "assignmentId"),
    metric: stringField(record, "metric"),
    value: numberField(record, "value"),
  };
});

export const integrationEventSchema = createSchema<IntegrationEvent>(
  "IntegrationEvent",
  (value) => {
    const record = asRecord(value, "IntegrationEvent");

    return {
      id: stringField(record, "id"),
      eventType: stringField(record, "eventType"),
      title: stringField(record, "title"),
      destination: enumField(record, "destination", destinations),
      status: enumField(record, "status", integrationStatuses),
      detail: stringField(record, "detail"),
      occurredAt: stringField(record, "occurredAt"),
    };
  },
);

export const automationOutboxSchema = createSchema<AutomationOutbox>(
  "AutomationOutbox",
  (value) => {
    const record = asRecord(value, "AutomationOutbox");

    return {
      id: stringField(record, "id"),
      sourceEventId: stringField(record, "sourceEventId"),
      destination: enumField(record, "destination", outboxDestinations),
      status: enumField(record, "status", integrationStatuses),
      payloadSummary: stringField(record, "payloadSummary"),
    };
  },
);

export const auditLogSchema = createSchema<AuditLog>("AuditLog", (value) => {
  const record = asRecord(value, "AuditLog");

  return {
    id: stringField(record, "id"),
    actorUserId: stringField(record, "actorUserId"),
    action: stringField(record, "action"),
    targetType: stringField(record, "targetType"),
    targetId: stringField(record, "targetId"),
  };
});
