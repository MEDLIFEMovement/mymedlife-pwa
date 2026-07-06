export type ProductionRolloutLaunchOwnerImportResult = {
  launchOwnersCsv: string;
  counts: {
    owners: number;
    activeOwners: number;
    ownerTypes: number;
  };
};

type LaunchOwnerCsvRow = Record<string, string>;

const launchOwnerHeaders = {
  required: ["email", "ownerType"],
  optional: ["displayName", "status"],
} as const;

const allowedOwnerTypes = new Set([
  "production_apply",
  "support",
  "rollback",
  "launch_decision",
]);
const requiredActiveOwnerTypes = new Set([
  "production_apply",
  "support",
  "rollback",
]);
const allowedStatuses = new Set(["active", "backup", "inactive"]);

export function buildProductionRolloutLaunchOwnerImport(
  launchOwnersCsv: string,
): ProductionRolloutLaunchOwnerImportResult {
  const rows = parseLaunchOwnerCsv(launchOwnersCsv);
  const owners = new Map<
    string,
    {
      email: string;
      ownerType: string;
      displayName: string;
      status: string;
    }
  >();
  const activeOwnerTypes = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const email = normalizeEmail(row.email);
    const ownerType = row.ownerType.trim();
    const displayName = row.displayName?.trim() ?? "";
    const status = row.status?.trim() || "active";

    for (const [header, value] of Object.entries({
      email,
      ownerType,
      displayName,
      status,
    })) {
      validateLaunchOwnerValue("launch owner import", rowNumber, header, value);
    }

    if (!allowedOwnerTypes.has(ownerType)) {
      throw new Error(
        `Launch owner CSV row ${rowNumber} has unsupported ownerType ${ownerType}. Use one of: ${Array.from(allowedOwnerTypes).join(", ")}.`,
      );
    }

    if (!allowedStatuses.has(status)) {
      throw new Error(
        `Launch owner CSV row ${rowNumber} has unsupported status ${status}. Use one of: ${Array.from(allowedStatuses).join(", ")}.`,
      );
    }

    const ownerKey = `${email}|${ownerType}`;
    const existingOwner = owners.get(ownerKey);

    if (
      existingOwner &&
      (existingOwner.displayName !== displayName || existingOwner.status !== status)
    ) {
      throw new Error(
        `Launch owner CSV row ${rowNumber} conflicts with another row for ${email} as ${ownerType}. Keep one displayName/status per owner type before importing.`,
      );
    }

    owners.set(ownerKey, {
      email,
      ownerType,
      displayName,
      status,
    });

    if (status === "active") {
      activeOwnerTypes.add(ownerType);
    }
  });

  const missingRequiredOwnerTypes = Array.from(requiredActiveOwnerTypes).filter(
    (ownerType) => !activeOwnerTypes.has(ownerType),
  );

  if (missingRequiredOwnerTypes.length > 0) {
    throw new Error(
      `Launch owner CSV is missing active required ownerType(s): ${missingRequiredOwnerTypes.join(", ")}.`,
    );
  }

  return {
    launchOwnersCsv: formatCsv([
      ["email", "ownerType", "displayName", "status"],
      ...Array.from(owners.values()).map((owner) => [
        owner.email,
        owner.ownerType,
        owner.displayName,
        owner.status,
      ]),
    ]),
    counts: {
      owners: owners.size,
      activeOwners: Array.from(owners.values()).filter(
        (owner) => owner.status === "active",
      ).length,
      ownerTypes: new Set(Array.from(owners.values()).map((owner) => owner.ownerType))
        .size,
    },
  };
}

function parseLaunchOwnerCsv(csv: string): LaunchOwnerCsvRow[] {
  const rows = parseCsvRows(csv);

  if (rows.length === 0) {
    throw new Error("Launch owner CSV is empty.");
  }

  const [headerRow, ...bodyRows] = rows;
  const headers = headerRow.map((header) => header.trim());
  const allowedHeaders = new Set<string>([
    ...launchOwnerHeaders.required,
    ...launchOwnerHeaders.optional,
  ]);

  for (const requiredHeader of launchOwnerHeaders.required) {
    if (!headers.includes(requiredHeader)) {
      throw new Error(
        `Launch owner CSV is missing required column ${requiredHeader}.`,
      );
    }
  }

  for (const header of headers) {
    if (!allowedHeaders.has(header)) {
      throw new Error(
        `Launch owner CSV has unsupported column ${header}. Keep the launch owner import limited to email, ownerType, displayName, and status.`,
      );
    }
  }

  return bodyRows
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row, index) => {
      if (row.length !== headers.length) {
        throw new Error(
          `Launch owner CSV row ${index + 2} has ${row.length} cells; expected ${headers.length}.`,
        );
      }

      const parsedRow = Object.fromEntries(
        headers.map((header, headerIndex) => [header, row[headerIndex].trim()]),
      );

      for (const requiredHeader of launchOwnerHeaders.required) {
        if (!parsedRow[requiredHeader]) {
          throw new Error(
            `Launch owner CSV row ${index + 2} is missing required value ${requiredHeader}.`,
          );
        }
      }

      return parsedRow;
    });
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function validateLaunchOwnerValue(
  tableName: string,
  rowNumber: number,
  header: string,
  value: string,
) {
  if (!value) {
    return;
  }

  if (/<[^>\n]+>/.test(value) || /\b(TODO|TBD|PLACEHOLDER)\b/i.test(value)) {
    throw new Error(
      `${tableName} CSV row ${rowNumber} column ${header} contains placeholder text; replace it with approved production rollout data.`,
    );
  }

  if (/(password|api[_-]?key|secret|token|bearer|service[_-]?role|sk_live|sk_test|gho_)/i.test(value)) {
    throw new Error(
      `${tableName} CSV row ${rowNumber} column ${header} looks like a key or token; keep secrets out of rollout files.`,
    );
  }

  if (header.toLowerCase().includes("email")) {
    validateLaunchOwnerEmail(tableName, rowNumber, header, value);
  }
}

function validateLaunchOwnerEmail(
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
  return `${rows
    .map((row) => row.map(formatCsvCell).join(","))
    .join("\n")}\n`;
}

function formatCsvCell(value: string) {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll("\"", "\"\"")}"`;
}
