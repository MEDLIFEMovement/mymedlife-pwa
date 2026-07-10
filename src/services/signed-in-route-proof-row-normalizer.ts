import { getBlockedProductionSignedInProofSourceMarker } from "./production-signed-in-route-proof-import.ts";

export type SignedInRouteProofSourceRowInput = {
  email: string;
  workspace: string;
  observedPath: string;
  status?: string;
  checkedAt?: string;
  notes?: string;
};

export type SignedInRouteProofNormalizedRow = {
  email: string;
  workspace:
    | "student_app"
    | "leader_command_center"
    | "staff_command_center"
    | "admin_backend";
  observedPath: string;
  status: "passed" | "failed" | "not_checked";
  checkedAt: string;
  notes: string;
};

const workspaceAliases: Record<string, SignedInRouteProofNormalizedRow["workspace"]> = {
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

const allowedStatuses = new Set<SignedInRouteProofNormalizedRow["status"]>([
  "passed",
  "failed",
  "not_checked",
]);

export function normalizeSignedInRouteProofSourceRows(
  rows: ReadonlyArray<SignedInRouteProofSourceRowInput>,
): SignedInRouteProofNormalizedRow[] {
  return rows.map((row, index) => normalizeSignedInRouteProofSourceRow(row, index + 2));
}

export function normalizeSignedInRouteProofSourceRow(
  row: SignedInRouteProofSourceRowInput,
  rowNumber: number,
): SignedInRouteProofNormalizedRow {
  const email = normalizeEmail(row.email, rowNumber);
  const workspace = normalizeWorkspace(row.workspace, rowNumber);
  const observedPath = row.observedPath.trim();
  const status = normalizeStatus(row.status, rowNumber);
  const checkedAt = row.checkedAt?.trim() ?? "";
  const notes = row.notes?.trim() ?? "";

  validateRowShapeValue(rowNumber, "observedPath", observedPath);
  validateRowShapeValue(rowNumber, "checkedAt", checkedAt);
  validateRowShapeValue(rowNumber, "notes", notes);

  if (!observedPath.startsWith("/")) {
    throw new Error(
      `Signed-in proof source row ${rowNumber} column observedPath must be an app route starting with /.`,
    );
  }

  if (!Number.isFinite(Date.parse(checkedAt))) {
    throw new Error(
      `Signed-in proof source row ${rowNumber} column checkedAt must be a valid timestamp.`,
    );
  }

  const matchedMarker =
    getBlockedProductionSignedInProofSourceMarker(observedPath) ??
    getBlockedProductionSignedInProofSourceMarker(notes);

  if (matchedMarker) {
    throw new Error(
      `Signed-in proof source row ${rowNumber} references ${matchedMarker}, which is local, preview, staging, sample, or setup-only evidence and cannot count as approved production signed-in proof.`,
    );
  }

  if (status === "passed" && observedPath.length === 0) {
    throw new Error(
      `Signed-in proof source row ${rowNumber} column observedPath cannot be empty for a passed proof row.`,
    );
  }

  return {
    email,
    workspace,
    observedPath,
    status,
    checkedAt,
    notes,
  };
}

function normalizeEmail(value: string, rowNumber: number) {
  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) {
    throw new Error(
      `Signed-in proof source row ${rowNumber} column email is required.`,
    );
  }

  const emailParts = normalizedValue.split("@");
  if (
    emailParts.length !== 2 ||
    !emailParts[0] ||
    !emailParts[1] ||
    !emailParts[1].includes(".")
  ) {
    throw new Error(
      `Signed-in proof source row ${rowNumber} column email must contain a real email address.`,
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
      `Signed-in proof source row ${rowNumber} column email uses test or placeholder data; replace it with approved production evidence.`,
    );
  }

  return normalizedValue;
}

function normalizeWorkspace(
  value: string,
  rowNumber: number,
): SignedInRouteProofNormalizedRow["workspace"] {
  const normalizedValue = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const workspace = workspaceAliases[normalizedValue];

  if (!workspace) {
    throw new Error(
      `Signed-in proof source row ${rowNumber} has unsupported workspace ${value}. Use student_app, leader_command_center, staff_command_center, admin_backend, or aliases member, leader, staff, admin.`,
    );
  }

  return workspace;
}

function normalizeStatus(
  value: string | undefined,
  rowNumber: number,
): SignedInRouteProofNormalizedRow["status"] {
  const normalizedValue = (value ?? "passed").trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (!allowedStatuses.has(normalizedValue as SignedInRouteProofNormalizedRow["status"])) {
    throw new Error(
      `Signed-in proof source row ${rowNumber} has unsupported status ${value}. Use passed, failed, or not_checked.`,
    );
  }

  return normalizedValue as SignedInRouteProofNormalizedRow["status"];
}

function validateRowShapeValue(
  rowNumber: number,
  header: string,
  value: string,
) {
  if (/<[^>\n]+>/.test(value) || /\b(TODO|TBD|PLACEHOLDER)\b/i.test(value)) {
    throw new Error(
      `Signed-in proof source row ${rowNumber} column ${header} contains placeholder text; replace it with approved production evidence.`,
    );
  }

  if (/(api[_-]?key|secret|token|password|bearer\s+)/i.test(value)) {
    throw new Error(
      `Signed-in proof source row ${rowNumber} column ${header} looks like it may contain a credential. Keep secrets out of route evidence.`,
    );
  }

  const normalizedValue = value.toLowerCase();
  if (
    normalizedValue.startsWith("sk_") ||
    normalizedValue.startsWith("pk_") ||
    normalizedValue.startsWith("eyj")
  ) {
    throw new Error(
      `Signed-in proof source row ${rowNumber} column ${header} looks like a key or token. Keep secrets out of route evidence.`,
    );
  }
}
