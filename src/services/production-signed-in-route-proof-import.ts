export type ProductionSignedInRouteProofImportResult = {
  signedInRouteProofCsv: string;
  counts: {
    proofRows: number;
    passedRows: number;
    workspaces: number;
  };
};

type SignedInRouteProofSourceRow = Record<string, string>;

type SignedInRouteWorkspace =
  | "student_app"
  | "leader_command_center"
  | "staff_command_center"
  | "admin_backend";

type SignedInRouteStatus = "passed" | "failed" | "not_checked";

const proofImportHeaders = {
  required: ["email", "workspace", "observedPath", "status", "checkedAt"],
  optional: ["notes"],
} as const;

const allowedStatuses = new Set<SignedInRouteStatus>([
  "passed",
  "failed",
  "not_checked",
]);

const workspaceExpectedPaths: Record<SignedInRouteWorkspace, string> = {
  student_app: "/app",
  leader_command_center: "/leader?view=overview",
  staff_command_center: "/staff?view=chapters",
  admin_backend: "/admin",
};

const workspaceAliases: Record<string, SignedInRouteWorkspace> = {
  student_app: "student_app",
  student: "student_app",
  member: "student_app",
  general_member: "student_app",
  app: "student_app",
  leader_command_center: "leader_command_center",
  leader: "leader_command_center",
  student_leader: "leader_command_center",
  chapter_leader: "leader_command_center",
  staff_command_center: "staff_command_center",
  staff: "staff_command_center",
  coach: "staff_command_center",
  sales_coach: "staff_command_center",
  admin_backend: "admin_backend",
  admin: "admin_backend",
  ds_admin: "admin_backend",
  super_admin: "admin_backend",
};

const blockedProductionProofSourceMarkers = [
  "preview cookie",
  "preview-cookie",
  "local preview",
  "local sandbox",
  "sandbox review",
  "sandbox role exercise",
  "figma-sandbox-role-exercise",
  "figma",
  "figma_seed",
  "test data",
  "test user",
  "sop sample",
  "sample data",
  "localhost",
  "127.0.0.1",
  ".vercel.app",
  "staging.mymedlife.org",
  "staging proof",
  "auth_profile_missing",
  "profile setup required",
] as const;

export function buildProductionSignedInRouteProofImport(
  proofCsv: string,
): ProductionSignedInRouteProofImportResult {
  const rows = parseSignedInRouteProofSourceCsv(proofCsv);
  const proofRows = rows.map((row, index) => {
    const rowNumber = index + 2;
    const email = normalizeEmail(row.email);
    const workspace = normalizeWorkspace(row.workspace, rowNumber);
    const expectedPath = workspaceExpectedPaths[workspace];
    const observedPath = row.observedPath.trim();
    const status = normalizeStatus(row.status, rowNumber);
    const checkedAt = row.checkedAt.trim();
    const notes = row.notes?.trim() ?? "";

    for (const [header, value] of Object.entries({
      email,
      workspace,
      observedPath,
      checkedAt,
      notes,
    })) {
      validateSignedInProofValue(rowNumber, header, value);
    }

    if (status === "passed" && observedPath !== expectedPath) {
      throw new Error(
        `Signed-in proof CSV row ${rowNumber} is marked passed but observedPath is ${observedPath}; expected ${expectedPath}.`,
      );
    }

    return {
      email,
      workspace,
      expectedPath,
      observedPath,
      status,
      checkedAt,
      notes,
    };
  });
  const workspaces = new Set(proofRows.map((row) => row.workspace));

  return {
    signedInRouteProofCsv: formatCsv([
      [
        "email",
        "workspace",
        "expectedPath",
        "observedPath",
        "status",
        "checkedAt",
        "notes",
      ],
      ...proofRows.map((row) => [
        row.email,
        row.workspace,
        row.expectedPath,
        row.observedPath,
        row.status,
        row.checkedAt,
        row.notes,
      ]),
    ]),
    counts: {
      proofRows: proofRows.length,
      passedRows: proofRows.filter((row) => row.status === "passed").length,
      workspaces: workspaces.size,
    },
  };
}

function parseSignedInRouteProofSourceCsv(
  csv: string,
): SignedInRouteProofSourceRow[] {
  const rows = parseCsvRows(csv);

  if (rows.length === 0) {
    throw new Error("Signed-in proof CSV is empty.");
  }

  const [headerRow, ...bodyRows] = rows;
  const headers = headerRow.map((header) => header.trim());
  const allowedHeaders = new Set<string>([
    ...proofImportHeaders.required,
    ...proofImportHeaders.optional,
  ]);

  for (const requiredHeader of proofImportHeaders.required) {
    if (!headers.includes(requiredHeader)) {
      throw new Error(
        `Signed-in proof CSV is missing required column ${requiredHeader}.`,
      );
    }
  }

  for (const header of headers) {
    if (!allowedHeaders.has(header)) {
      throw new Error(
        `Signed-in proof CSV has unsupported column ${header}. Keep the import limited to email, workspace, observedPath, status, checkedAt, and notes.`,
      );
    }
  }

  return bodyRows
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row, index) => {
      if (row.length !== headers.length) {
        throw new Error(
          `Signed-in proof CSV row ${index + 2} has ${row.length} cells; expected ${headers.length}.`,
        );
      }

      const parsedRow = Object.fromEntries(
        headers.map((header, headerIndex) => [header, row[headerIndex].trim()]),
      );

      for (const requiredHeader of proofImportHeaders.required) {
        if (!parsedRow[requiredHeader]) {
          throw new Error(
            `Signed-in proof CSV row ${index + 2} is missing required value ${requiredHeader}.`,
          );
        }
      }

      return parsedRow;
    });
}

function normalizeWorkspace(value: string, rowNumber: number): SignedInRouteWorkspace {
  const normalizedValue = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const workspace = workspaceAliases[normalizedValue];

  if (!workspace) {
    throw new Error(
      `Signed-in proof CSV row ${rowNumber} has unsupported workspace ${value}. Use student_app, leader_command_center, staff_command_center, admin_backend, or aliases member, leader, staff, admin.`,
    );
  }

  return workspace;
}

function normalizeStatus(value: string, rowNumber: number): SignedInRouteStatus {
  const normalizedValue = value.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (!allowedStatuses.has(normalizedValue as SignedInRouteStatus)) {
    throw new Error(
      `Signed-in proof CSV row ${rowNumber} has unsupported status ${value}. Use passed, failed, or not_checked.`,
    );
  }

  return normalizedValue as SignedInRouteStatus;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function validateSignedInProofValue(
  rowNumber: number,
  header: string,
  value: string,
) {
  if (/<[^>\n]+>/.test(value) || /\b(TODO|TBD|PLACEHOLDER)\b/i.test(value)) {
    throw new Error(
      `Signed-in proof CSV row ${rowNumber} column ${header} contains placeholder text; replace it with approved production route evidence.`,
    );
  }

  if (header.toLowerCase().includes("email")) {
    validateEmail(rowNumber, header, value);
  }

  if (header === "observedPath") {
    validateObservedPath(rowNumber, header, value);
  }

  if (["observedPath", "notes"].includes(header)) {
    validateNoSecretLikeValue(rowNumber, header, value);
    validateProductionProofSource(rowNumber, header, value);
  }

  if (header === "checkedAt" && !Number.isFinite(Date.parse(value))) {
    throw new Error(
      `Signed-in proof CSV row ${rowNumber} column checkedAt must be a valid timestamp.`,
    );
  }
}

function validateEmail(rowNumber: number, header: string, value: string) {
  const emailParts = value.split("@");

  if (
    emailParts.length !== 2 ||
    !emailParts[0] ||
    !emailParts[1] ||
    !emailParts[1].includes(".")
  ) {
    throw new Error(
      `Signed-in proof CSV row ${rowNumber} column ${header} must contain a real email address.`,
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
      `Signed-in proof CSV row ${rowNumber} column ${header} uses test or placeholder email data; replace it with an approved production email.`,
    );
  }
}

function validateObservedPath(rowNumber: number, header: string, value: string) {
  if (!value.startsWith("/")) {
    throw new Error(
      `Signed-in proof CSV row ${rowNumber} column ${header} must be an app route starting with /.`,
    );
  }
}

function validateNoSecretLikeValue(rowNumber: number, header: string, value: string) {
  const normalizedValue = value.toLowerCase();

  if (/(api[_-]?key|secret|token|password|bearer\s+)/i.test(value)) {
    throw new Error(
      `Signed-in proof CSV row ${rowNumber} column ${header} looks like it may contain a credential. Keep secrets out of route evidence.`,
    );
  }

  if (
    normalizedValue.startsWith("sk_") ||
    normalizedValue.startsWith("pk_") ||
    normalizedValue.startsWith("eyj")
  ) {
    throw new Error(
      `Signed-in proof CSV row ${rowNumber} column ${header} looks like a key or token. Keep secrets out of route evidence.`,
    );
  }
}

function validateProductionProofSource(
  rowNumber: number,
  header: string,
  value: string,
) {
  const matchedMarker = getBlockedProductionSignedInProofSourceMarker(value);

  if (matchedMarker) {
    throw new Error(
      `Signed-in proof CSV row ${rowNumber} column ${header} references ${matchedMarker}, which is local, preview, staging, sample, or setup-only evidence and cannot count as approved production signed-in proof.`,
    );
  }
}

export function getBlockedProductionSignedInProofSourceMarker(
  value: string | undefined | null,
): string | null {
  const normalizedValue = value?.toLowerCase() ?? "";

  return (
    blockedProductionProofSourceMarkers.find((marker) =>
      normalizedValue.includes(marker),
    ) ?? null
  );
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

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((parsedRow) =>
    parsedRow.some((parsedCell) => parsedCell.trim()),
  );
}

function formatCsv(rows: string[][]) {
  return `${rows.map((row) => row.map(formatCsvCell).join(",")).join("\n")}\n`;
}

function formatCsvCell(cell: string) {
  if (/[",\n\r]/.test(cell)) {
    return `"${cell.replace(/"/g, "\"\"")}"`;
  }

  return cell;
}
