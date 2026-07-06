import type {
  ProductionBootstrapCampaign,
  ProductionBootstrapChapter,
  ProductionBootstrapCoachAssignment,
  ProductionBootstrapLaunchOwner,
  ProductionBootstrapLumaCalendar,
  ProductionBootstrapMembership,
  ProductionBootstrapPilotEventProof,
  ProductionBootstrapSignedInRouteProof,
  ProductionBootstrapStaffRole,
  ProductionBootstrapUser,
  ProductionRolloutBootstrapPacket,
} from "@/services/production-rollout-bootstrap";
import { getFigmaOrTestSeedEvidenceReason } from "@/data/figma-test-seed-map";

export type ProductionRolloutCsvTables = {
  chapters: string;
  users: string;
  memberships: string;
  staffRoles: string;
  coachAssignments: string;
  campaigns: string;
  lumaCalendars: string;
  pilotEventProof: string;
  launchOwners: string;
  signedInRouteProof: string;
};

type CsvRow = Record<string, string>;

const tableHeaders = {
  chapters: {
    required: ["id", "name", "campus"],
    optional: ["region", "status"],
  },
  users: {
    required: ["email", "displayName"],
    optional: [],
  },
  memberships: {
    required: ["email", "chapterId", "roleKey"],
    optional: ["status"],
  },
  staffRoles: {
    required: ["email", "roleKey"],
    optional: ["status"],
  },
  coachAssignments: {
    required: ["coachEmail", "chapterId", "coachType"],
    optional: ["status"],
  },
  campaigns: {
    required: ["chapterId", "name", "slug"],
    optional: ["status"],
  },
  lumaCalendars: {
    required: ["chapterId", "calendarId"],
    optional: ["calendarName", "status"],
  },
  pilotEventProof: {
    required: [
      "chapterId",
      "eventName",
      "lumaEventId",
      "rsvpCount",
      "attendanceCount",
      "pointsAwardedCount",
      "auditEvidence",
      "outboxStatus",
    ],
    optional: [
      "status",
      "eventRoute",
      "attendanceRoute",
      "pointsRoute",
      "auditRoute",
      "outboxRoute",
      "checkedAt",
      "reviewedByEmail",
      "notes",
    ],
  },
  launchOwners: {
    required: ["email", "ownerType"],
    optional: ["displayName", "status"],
  },
  signedInRouteProof: {
    required: ["email", "workspace", "expectedPath", "observedPath", "status"],
    optional: ["checkedAt", "notes"],
  },
} as const;

const allowedValues = {
  chapterStatus: ["active", "inactive", "archived"],
  membershipRole: [
    "general_member",
    "action_committee_member",
    "action_committee_chair",
    "e_board_member",
    "president_vp",
  ],
  membershipStatus: ["requested", "approved", "rejected", "inactive"],
  staffRole: ["coach", "admin", "ds_admin", "super_admin"],
  staffStatus: ["active", "inactive", "ended"],
  coachType: ["expansion", "portfolio"],
  campaignStatus: ["draft", "active", "complete", "archived"],
  lumaCalendarStatus: ["linked", "needs_setup", "inactive"],
  pilotAuditEvidence: ["recorded", "missing"],
  pilotOutboxStatus: ["zero_sends", "sends_detected", "not_checked"],
  pilotStatus: ["ready", "needs_review", "blocked"],
  launchOwnerType: ["production_apply", "support", "rollback", "launch_decision"],
  launchOwnerStatus: ["active", "backup", "inactive"],
  signedInWorkspace: [
    "student_app",
    "leader_command_center",
    "staff_command_center",
    "admin_backend",
  ],
  signedInRouteStatus: ["passed", "failed", "not_checked"],
} as const;

export function buildProductionRolloutPacketFromCsvTables(
  tables: ProductionRolloutCsvTables,
): ProductionRolloutBootstrapPacket {
  return {
    chapters: parseCsvTable(
      tables.chapters,
      "chapters",
      tableHeaders.chapters,
    ).map(toChapter),
    users: parseCsvTable(tables.users, "users", tableHeaders.users).map(toUser),
    memberships: parseCsvTable(
      tables.memberships,
      "memberships",
      tableHeaders.memberships,
    ).map(toMembership),
    staffRoles: parseCsvTable(
      tables.staffRoles,
      "staffRoles",
      tableHeaders.staffRoles,
    ).map(toStaffRole),
    coachAssignments: parseCsvTable(
      tables.coachAssignments,
      "coachAssignments",
      tableHeaders.coachAssignments,
    ).map(toCoachAssignment),
    campaigns: parseCsvTable(
      tables.campaigns,
      "campaigns",
      tableHeaders.campaigns,
    ).map(toCampaign),
    lumaCalendars: parseCsvTable(
      tables.lumaCalendars,
      "lumaCalendars",
      tableHeaders.lumaCalendars,
    ).map(toLumaCalendar),
    pilotEventProof: parseCsvTable(
      tables.pilotEventProof,
      "pilotEventProof",
      tableHeaders.pilotEventProof,
    ).map(toPilotEventProof),
    launchOwners: parseCsvTable(
      tables.launchOwners,
      "launchOwners",
      tableHeaders.launchOwners,
    ).map(toLaunchOwner),
    signedInRouteProof: parseCsvTable(
      tables.signedInRouteProof,
      "signedInRouteProof",
      tableHeaders.signedInRouteProof,
    ).map(toSignedInRouteProof),
  };
}

function parseCsvTable(
  csv: string,
  tableName: keyof ProductionRolloutCsvTables,
  headers: {
    required: readonly string[];
    optional: readonly string[];
  },
): CsvRow[] {
  const rows = parseCsvRows(csv);

  if (rows.length === 0) {
    throw new Error(`${tableName} CSV is empty.`);
  }

  const [headerRow, ...bodyRows] = rows;
  const allowedHeaders = new Set([...headers.required, ...headers.optional]);
  const normalizedHeaders = headerRow.map((header) => header.trim());

  for (const requiredHeader of headers.required) {
    if (!normalizedHeaders.includes(requiredHeader)) {
      throw new Error(`${tableName} CSV is missing required column ${requiredHeader}.`);
    }
  }

  for (const header of normalizedHeaders) {
    if (!allowedHeaders.has(header)) {
      throw new Error(`${tableName} CSV has unsupported column ${header}.`);
    }
  }

  return bodyRows
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row, rowIndex) => {
      if (row.length !== normalizedHeaders.length) {
        throw new Error(
          `${tableName} CSV row ${rowIndex + 2} has ${row.length} cells; expected ${normalizedHeaders.length}.`,
        );
      }

      const parsedRow = Object.fromEntries(
        normalizedHeaders.map((header, index) => [header, row[index].trim()]),
      );

      for (const requiredHeader of headers.required) {
        if (!parsedRow[requiredHeader]) {
          throw new Error(
            `${tableName} CSV row ${rowIndex + 2} is missing required value ${requiredHeader}.`,
          );
        }
      }

      for (const [header, value] of Object.entries(parsedRow)) {
        validateProductionRolloutCsvValue({
          tableName,
          rowNumber: rowIndex + 2,
          header,
          value,
        });
      }

      return parsedRow;
    });
}

function validateProductionRolloutCsvValue({
  tableName,
  rowNumber,
  header,
  value,
}: {
  tableName: keyof ProductionRolloutCsvTables;
  rowNumber: number;
  header: string;
  value: string;
}) {
  if (!value) {
    return;
  }

  if (/<[^>\n]+>/.test(value) || /\b(TODO|TBD|PLACEHOLDER)\b/i.test(value)) {
    throw new Error(
      `${tableName} CSV row ${rowNumber} column ${header} contains placeholder text; replace it with approved production rollout data.`,
    );
  }

  const testSeedReason = getFigmaOrTestSeedEvidenceReason(value);
  if (testSeedReason) {
    throw new Error(
      `${tableName} CSV row ${rowNumber} column ${header} contains Test/Figma sandbox data (${testSeedReason}); replace it with approved production rollout data.`,
    );
  }

  if (header.toLowerCase().includes("email")) {
    validateProductionRolloutEmail({
      tableName,
      rowNumber,
      header,
      value,
    });
  }
}

function validateProductionRolloutEmail({
  tableName,
  rowNumber,
  header,
  value,
}: {
  tableName: keyof ProductionRolloutCsvTables;
  rowNumber: number;
  header: string;
  value: string;
}) {
  const normalized = value.trim().toLowerCase();
  const emailParts = normalized.split("@");

  if (
    emailParts.length !== 2 ||
    !emailParts[0] ||
    !emailParts[1] ||
    !emailParts[1].includes(".")
  ) {
    throw new Error(
      `${tableName} CSV row ${rowNumber} column ${header} must contain a real email address.`,
    );
  }

  const [localPart, domain] = emailParts;
  const blockedLocalParts = new Set(["fake", "placeholder", "todo", "tbd"]);
  const blockedDomains = new Set([
    "example.com",
    "example.org",
    "example.net",
    "localhost",
    "mymedlife.test",
  ]);

  if (
    blockedLocalParts.has(localPart) ||
    localPart.startsWith("fake+") ||
    localPart.startsWith("placeholder+") ||
    blockedDomains.has(domain) ||
    domain.endsWith(".test")
  ) {
    throw new Error(
      `${tableName} CSV row ${rowNumber} column ${header} uses test or placeholder email data; replace it with an approved production email.`,
    );
  }
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (inQuotes) {
    throw new Error("CSV has an unclosed quoted cell.");
  }

  row.push(cell);

  if (row.some((value) => value.trim())) {
    rows.push(row);
  }

  return rows.filter((csvRow) => csvRow.some((value) => value.trim()));
}

function toChapter(row: CsvRow): ProductionBootstrapChapter {
  requireOptionalValue(row.status, allowedValues.chapterStatus, "chapter status");

  return omitEmpty({
    id: row.id,
    name: row.name,
    campus: row.campus,
    region: row.region,
    status: row.status as ProductionBootstrapChapter["status"],
  });
}

function toUser(row: CsvRow): ProductionBootstrapUser {
  return {
    email: row.email,
    displayName: row.displayName,
  };
}

function toMembership(row: CsvRow): ProductionBootstrapMembership {
  requireValue(row.roleKey, allowedValues.membershipRole, "membership roleKey");
  requireOptionalValue(
    row.status,
    allowedValues.membershipStatus,
    "membership status",
  );

  return omitEmpty({
    email: row.email,
    chapterId: row.chapterId,
    roleKey: row.roleKey as ProductionBootstrapMembership["roleKey"],
    status: row.status as ProductionBootstrapMembership["status"],
  });
}

function toStaffRole(row: CsvRow): ProductionBootstrapStaffRole {
  requireValue(row.roleKey, allowedValues.staffRole, "staff roleKey");
  requireOptionalValue(row.status, allowedValues.staffStatus, "staff role status");

  return omitEmpty({
    email: row.email,
    roleKey: row.roleKey as ProductionBootstrapStaffRole["roleKey"],
    status: row.status as ProductionBootstrapStaffRole["status"],
  });
}

function toCoachAssignment(row: CsvRow): ProductionBootstrapCoachAssignment {
  requireValue(row.coachType, allowedValues.coachType, "coach assignment coachType");
  requireOptionalValue(
    row.status,
    allowedValues.staffStatus,
    "coach assignment status",
  );

  return omitEmpty({
    coachEmail: row.coachEmail,
    chapterId: row.chapterId,
    coachType: row.coachType as ProductionBootstrapCoachAssignment["coachType"],
    status: row.status as ProductionBootstrapCoachAssignment["status"],
  });
}

function toCampaign(row: CsvRow): ProductionBootstrapCampaign {
  requireOptionalValue(row.status, allowedValues.campaignStatus, "campaign status");

  return omitEmpty({
    chapterId: row.chapterId,
    name: row.name,
    slug: row.slug,
    status: row.status as ProductionBootstrapCampaign["status"],
  });
}

function toLumaCalendar(row: CsvRow): ProductionBootstrapLumaCalendar {
  requireOptionalValue(
    row.status,
    allowedValues.lumaCalendarStatus,
    "Luma calendar status",
  );

  return omitEmpty({
    chapterId: row.chapterId,
    calendarId: row.calendarId,
    calendarName: row.calendarName,
    status: row.status as ProductionBootstrapLumaCalendar["status"],
  });
}

function toPilotEventProof(row: CsvRow): ProductionBootstrapPilotEventProof {
  requireValue(
    row.auditEvidence,
    allowedValues.pilotAuditEvidence,
    "pilot event auditEvidence",
  );
  requireValue(
    row.outboxStatus,
    allowedValues.pilotOutboxStatus,
    "pilot event outboxStatus",
  );
  requireOptionalValue(row.status, allowedValues.pilotStatus, "pilot event status");

  return omitEmpty({
    chapterId: row.chapterId,
    eventName: row.eventName,
    lumaEventId: row.lumaEventId,
    rsvpCount: parseWholeNumber(row.rsvpCount, "pilot event rsvpCount"),
    attendanceCount: parseWholeNumber(
      row.attendanceCount,
      "pilot event attendanceCount",
    ),
    pointsAwardedCount: parseWholeNumber(
      row.pointsAwardedCount,
      "pilot event pointsAwardedCount",
    ),
    auditEvidence: row.auditEvidence as ProductionBootstrapPilotEventProof["auditEvidence"],
    outboxStatus: row.outboxStatus as ProductionBootstrapPilotEventProof["outboxStatus"],
    status: row.status as ProductionBootstrapPilotEventProof["status"],
    eventRoute: row.eventRoute,
    attendanceRoute: row.attendanceRoute,
    pointsRoute: row.pointsRoute,
    auditRoute: row.auditRoute,
    outboxRoute: row.outboxRoute,
    checkedAt: row.checkedAt,
    reviewedByEmail: row.reviewedByEmail,
    notes: row.notes,
  });
}

function toLaunchOwner(row: CsvRow): ProductionBootstrapLaunchOwner {
  requireValue(row.ownerType, allowedValues.launchOwnerType, "launch owner ownerType");
  requireOptionalValue(row.status, allowedValues.launchOwnerStatus, "launch owner status");

  return omitEmpty({
    email: row.email,
    ownerType: row.ownerType as ProductionBootstrapLaunchOwner["ownerType"],
    displayName: row.displayName,
    status: row.status as ProductionBootstrapLaunchOwner["status"],
  });
}

function toSignedInRouteProof(row: CsvRow): ProductionBootstrapSignedInRouteProof {
  requireValue(
    row.workspace,
    allowedValues.signedInWorkspace,
    "signed-in route workspace",
  );
  requireValue(
    row.status,
    allowedValues.signedInRouteStatus,
    "signed-in route status",
  );

  return omitEmpty({
    email: row.email,
    workspace: row.workspace as ProductionBootstrapSignedInRouteProof["workspace"],
    expectedPath: row.expectedPath,
    observedPath: row.observedPath,
    status: row.status as ProductionBootstrapSignedInRouteProof["status"],
    checkedAt: row.checkedAt,
    notes: row.notes,
  });
}

function requireOptionalValue(
  value: string | undefined,
  allowed: readonly string[],
  label: string,
) {
  if (!value) {
    return;
  }

  requireValue(value, allowed, label);
}

function requireValue(value: string, allowed: readonly string[], label: string) {
  if (allowed.includes(value)) {
    return;
  }

  throw new Error(
    `Invalid ${label} "${value}". Expected one of: ${allowed.join(", ")}.`,
  );
}

function parseWholeNumber(value: string, label: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${label} must be a zero-or-greater whole number.`);
  }

  return parsed;
}

function omitEmpty<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entryValue]) => entryValue !== "" && entryValue !== undefined,
    ),
  ) as T;
}
