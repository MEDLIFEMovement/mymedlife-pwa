export type ProductionRolloutRosterImportResult = {
  usersCsv: string;
  membershipsCsv: string;
  counts: {
    users: number;
    memberships: number;
    chapters: number;
  };
};

type RosterCsvRow = Record<string, string>;

const rosterHeaders = {
  required: ["email", "displayName", "chapterId", "roleKey"],
  optional: ["status", "chapterName"],
} as const;

const allowedRoleKeys = new Set([
  "general_member",
  "action_committee_member",
  "action_committee_chair",
  "e_board_member",
  "president_vp",
]);

const allowedStatuses = new Set(["requested", "approved", "rejected", "inactive"]);

export function buildProductionRolloutRosterImport(
  rosterCsv: string,
): ProductionRolloutRosterImportResult {
  const rows = parseRosterCsv(rosterCsv);
  const users = new Map<string, string>();
  const memberships = new Map<
    string,
    {
      email: string;
      chapterId: string;
      roleKey: string;
      status: string;
    }
  >();
  const chapterIds = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const email = normalizeEmail(row.email);
    const displayName = row.displayName.trim();
    const chapterId = row.chapterId.trim();
    const roleKey = row.roleKey.trim();
    const status = row.status?.trim() || "approved";

    validateRosterValue("roster", rowNumber, "email", email);
    validateRosterValue("roster", rowNumber, "displayName", displayName);
    validateRosterValue("roster", rowNumber, "chapterId", chapterId);
    validateRosterValue("roster", rowNumber, "roleKey", roleKey);
    validateRosterValue("roster", rowNumber, "status", status);

    if (!allowedRoleKeys.has(roleKey)) {
      throw new Error(
        `Roster CSV row ${rowNumber} has unsupported roleKey ${roleKey}. Use one of: ${Array.from(allowedRoleKeys).join(", ")}.`,
      );
    }

    if (!allowedStatuses.has(status)) {
      throw new Error(
        `Roster CSV row ${rowNumber} has unsupported status ${status}. Use one of: ${Array.from(allowedStatuses).join(", ")}.`,
      );
    }

    const existingDisplayName = users.get(email);

    if (existingDisplayName && existingDisplayName !== displayName) {
      throw new Error(
        `Roster CSV row ${rowNumber} gives ${email} a different displayName. Keep one display name per email before importing.`,
      );
    }

    users.set(email, displayName);
    chapterIds.add(chapterId);

    const membershipKey = `${email}|${chapterId}`;
    const existingMembership = memberships.get(membershipKey);

    if (
      existingMembership &&
      (existingMembership.roleKey !== roleKey || existingMembership.status !== status)
    ) {
      throw new Error(
        `Roster CSV row ${rowNumber} conflicts with another row for ${email} in ${chapterId}. Keep one role/status per user per chapter before importing.`,
      );
    }

    memberships.set(membershipKey, {
      email,
      chapterId,
      roleKey,
      status,
    });
  });

  return {
    usersCsv: formatCsv([
      ["email", "displayName"],
      ...Array.from(users.entries()).map(([email, displayName]) => [
        email,
        displayName,
      ]),
    ]),
    membershipsCsv: formatCsv([
      ["email", "chapterId", "roleKey", "status"],
      ...Array.from(memberships.values()).map((membership) => [
        membership.email,
        membership.chapterId,
        membership.roleKey,
        membership.status,
      ]),
    ]),
    counts: {
      users: users.size,
      memberships: memberships.size,
      chapters: chapterIds.size,
    },
  };
}

function parseRosterCsv(csv: string): RosterCsvRow[] {
  const rows = parseCsvRows(csv);

  if (rows.length === 0) {
    throw new Error("Roster CSV is empty.");
  }

  const [headerRow, ...bodyRows] = rows;
  const headers = headerRow.map((header) => header.trim());
  const allowedHeaders = new Set<string>([
    ...rosterHeaders.required,
    ...rosterHeaders.optional,
  ]);

  for (const requiredHeader of rosterHeaders.required) {
    if (!headers.includes(requiredHeader)) {
      throw new Error(`Roster CSV is missing required column ${requiredHeader}.`);
    }
  }

  for (const header of headers) {
    if (!allowedHeaders.has(header)) {
      throw new Error(
        `Roster CSV has unsupported column ${header}. Keep the roster import limited to email, displayName, chapterId, roleKey, status, and chapterName.`,
      );
    }
  }

  return bodyRows
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row, index) => {
      if (row.length !== headers.length) {
        throw new Error(
          `Roster CSV row ${index + 2} has ${row.length} cells; expected ${headers.length}.`,
        );
      }

      const parsedRow = Object.fromEntries(
        headers.map((header, headerIndex) => [header, row[headerIndex].trim()]),
      );

      for (const requiredHeader of rosterHeaders.required) {
        if (!parsedRow[requiredHeader]) {
          throw new Error(
            `Roster CSV row ${index + 2} is missing required value ${requiredHeader}.`,
          );
        }
      }

      return parsedRow;
    });
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function validateRosterValue(
  tableName: string,
  rowNumber: number,
  header: string,
  value: string,
) {
  if (/<[^>\n]+>/.test(value) || /\b(TODO|TBD|PLACEHOLDER)\b/i.test(value)) {
    throw new Error(
      `${tableName} CSV row ${rowNumber} column ${header} contains placeholder text; replace it with approved production rollout data.`,
    );
  }

  if (header.toLowerCase().includes("email")) {
    validateRosterEmail(tableName, rowNumber, header, value);
  }
}

function validateRosterEmail(
  tableName: string,
  rowNumber: number,
  header: string,
  value: string,
) {
  const emailParts = value.split("@");

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

    if (char === "\"" && inQuotes && nextChar === "\"") {
      cell += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
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

function formatCsv(rows: string[][]) {
  return `${rows.map((row) => row.map(formatCsvCell).join(",")).join("\n")}\n`;
}

function formatCsvCell(value: string) {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll("\"", "\"\"")}"`;
}
