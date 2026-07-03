import type {
  ProductionBootstrapCampaign,
  ProductionBootstrapChapter,
  ProductionBootstrapCoachAssignment,
  ProductionBootstrapMembership,
  ProductionBootstrapStaffRole,
  ProductionBootstrapUser,
  ProductionRolloutBootstrapPacket,
} from "@/services/production-rollout-bootstrap";

export type ProductionRolloutCsvTables = {
  chapters: string;
  users: string;
  memberships: string;
  staffRoles: string;
  coachAssignments: string;
  campaigns: string;
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

      return parsedRow;
    });
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

function omitEmpty<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entryValue]) => entryValue !== "" && entryValue !== undefined,
    ),
  ) as T;
}
