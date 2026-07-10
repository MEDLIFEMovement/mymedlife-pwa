type StaffAdminProofRehearsalWorkspace = "staff" | "admin";
type StaffAdminProofRehearsalStatus = "passed" | "failed" | "not_checked";

export type StaffAdminProofRehearsalInputRow = {
  email: string;
  workspace: StaffAdminProofRehearsalWorkspace;
  observedPath: string;
  status: StaffAdminProofRehearsalStatus;
  checkedAt: string;
  notes: string;
};

export type StaffAdminProofRehearsalMappedRow = StaffAdminProofRehearsalInputRow & {
  normalizedWorkspace: "staff_command_center" | "admin_backend";
  expectedPath: "/staff?view=chapters" | "/admin";
  testOnly: true;
  productionEvidenceAllowed: false;
};

export type StaffAdminProofRehearsalValidation = {
  ready: boolean;
  rows: StaffAdminProofRehearsalMappedRow[];
  checks: Array<{
    key: string;
    passed: boolean;
    message: string;
  }>;
  summary: {
    staffRows: number;
    adminRows: number;
    passedRows: number;
    failedRows: number;
    testOnlyRows: number;
  };
};

const workspaceMap: Record<
  StaffAdminProofRehearsalWorkspace,
  StaffAdminProofRehearsalMappedRow["normalizedWorkspace"]
> = {
  staff: "staff_command_center",
  admin: "admin_backend",
};

const expectedPathMap: Record<
  StaffAdminProofRehearsalWorkspace,
  StaffAdminProofRehearsalMappedRow["expectedPath"]
> = {
  staff: "/staff?view=chapters",
  admin: "/admin",
};

export function buildStaffAdminProofRehearsalValidation(
  csv: string,
): StaffAdminProofRehearsalValidation {
  const rows = parseCsv(csv).map((row, index) => normalizeRow(row, index + 2));
  const checks = [
    {
      key: "contains_staff_rehearsal_row",
      passed: rows.some((row) => row.normalizedWorkspace === "staff_command_center"),
      message: "The packet includes a staff/support rehearsal row that maps to /staff?view=chapters.",
    },
    {
      key: "contains_admin_rehearsal_rows",
      passed: rows.filter((row) => row.normalizedWorkspace === "admin_backend").length >= 2,
      message: "The packet includes DS Admin and Super Admin rehearsal rows that map to /admin.",
    },
    {
      key: "contains_negative_member_row",
      passed:
        rows.some((row) => row.email.endsWith(".test") && row.status === "failed") &&
        rows.some((row) => row.observedPath === "/app" && row.status === "failed"),
      message: "The packet keeps the unauthorized member row visible and clearly failed.",
    },
    {
      key: "all_rows_are_test_only",
      passed: rows.every((row) => row.testOnly && row.notes.includes("TEST")),
      message: "Every rehearsal row stays explicitly TEST-only and non-production.",
    },
    {
      key: "all_rows_map_cleanly",
      passed: rows.every((row) => row.expectedPath === row.observedPath || row.status === "failed"),
      message:
        "Passed rows map cleanly to the member-facing staff/admin routes while the negative row stays failed.",
    },
  ];

  return {
    ready: checks.every((check) => check.passed),
    rows,
    checks,
    summary: {
      staffRows: rows.filter((row) => row.normalizedWorkspace === "staff_command_center").length,
      adminRows: rows.filter((row) => row.normalizedWorkspace === "admin_backend").length,
      passedRows: rows.filter((row) => row.status === "passed").length,
      failedRows: rows.filter((row) => row.status === "failed").length,
      testOnlyRows: rows.filter((row) => row.testOnly).length,
    },
  };
}

function normalizeRow(
  row: Record<string, string>,
  rowNumber: number,
): StaffAdminProofRehearsalMappedRow {
  const workspace = normalizeWorkspace(row.workspace, rowNumber);
  const observedPath = row.observedPath.trim();
  const status = normalizeStatus(row.status, rowNumber);
  const notes = row.notes.trim();
  const email = row.email.trim().toLowerCase();
  const checkedAt = row.checkedAt.trim();
  const expectedPath = expectedPathMap[workspace];
  const normalizedWorkspace = workspaceMap[workspace];
  const testOnly = Boolean(
    email.endsWith(".test") ||
      notes.includes("TEST") ||
      notes.includes("test-only") ||
      notes.includes("test only"),
  ) as true;

  return {
    email,
    workspace,
    observedPath,
    status,
    checkedAt,
    notes,
    normalizedWorkspace,
    expectedPath,
    testOnly,
    productionEvidenceAllowed: false,
  };
}

function normalizeWorkspace(
  value: string,
  rowNumber: number,
): StaffAdminProofRehearsalWorkspace {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue !== "staff" && normalizedValue !== "admin") {
    throw new Error(
      `Staff/Admin rehearsal CSV row ${rowNumber} has unsupported workspace ${value}. Use staff or admin.`,
    );
  }

  return normalizedValue;
}

function normalizeStatus(value: string, rowNumber: number): StaffAdminProofRehearsalStatus {
  const normalizedValue = value.trim().toLowerCase() as StaffAdminProofRehearsalStatus;

  if (
    normalizedValue !== "passed" &&
    normalizedValue !== "failed" &&
    normalizedValue !== "not_checked"
  ) {
    throw new Error(
      `Staff/Admin rehearsal CSV row ${rowNumber} has unsupported status ${value}. Use passed, failed, or not_checked.`,
    );
  }

  return normalizedValue;
}

function parseCsv(csv: string): Array<Record<string, string>> {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error("Staff/Admin rehearsal CSV needs a header and at least one row.");
  }

  const headers = lines[0].split(",").map((header) => header.trim());

  if (
    headers.join(",") !== "email,workspace,observedPath,status,checkedAt,notes"
  ) {
    throw new Error(
      "Staff/Admin rehearsal CSV must use the exact columns email, workspace, observedPath, status, checkedAt, and notes.",
    );
  }

  return lines.slice(1).map((line, index) => {
    const cells = splitCsvLine(line);

    if (cells.length !== headers.length) {
      throw new Error(
        `Staff/Admin rehearsal CSV row ${index + 2} has ${cells.length} cells; expected ${headers.length}.`,
      );
    }

    return Object.fromEntries(
      headers.map((header, headerIndex) => [header, cells[headerIndex] ?? ""]),
    );
  });
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}
