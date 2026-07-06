export type ProductionPilotEventProofImportResult = {
  pilotEventProofCsv: string;
  counts: {
    proofRows: number;
    readyRows: number;
    chapters: number;
  };
};

type PilotProofSourceRow = Record<string, string>;

const proofImportHeaders = {
  required: [
    "chapterId",
    "eventName",
    "lumaEventId",
    "rsvpCount",
    "attendanceCount",
    "pointsAwardedCount",
    "auditRecorded",
    "zeroExternalSends",
    "eventRoute",
    "attendanceRoute",
    "pointsRoute",
    "auditRoute",
    "outboxRoute",
    "checkedAt",
    "reviewedByEmail",
  ],
  optional: ["status", "notes"],
} as const;

const allowedStatuses = new Set(["ready", "needs_review", "blocked"]);
const routeHeaders = new Set([
  "eventRoute",
  "attendanceRoute",
  "pointsRoute",
  "auditRoute",
  "outboxRoute",
]);

const blockedProductionPilotProofSourceMarkers = [
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

export function getBlockedProductionPilotProofSourceMarkers() {
  return [...blockedProductionPilotProofSourceMarkers];
}

export function buildProductionPilotEventProofImport(
  proofCsv: string,
): ProductionPilotEventProofImportResult {
  const rows = parsePilotProofSourceCsv(proofCsv);
  const proofRows = rows.map((row, index) => {
    const rowNumber = index + 2;
    const status = row.status?.trim() || "ready";
    const rsvpCount = parseWholeNumber(row.rsvpCount, rowNumber, "rsvpCount");
    const attendanceCount = parseWholeNumber(
      row.attendanceCount,
      rowNumber,
      "attendanceCount",
    );
    const pointsAwardedCount = parseWholeNumber(
      row.pointsAwardedCount,
      rowNumber,
      "pointsAwardedCount",
    );
    const auditRecorded = parseYesNo(row.auditRecorded, rowNumber, "auditRecorded");
    const zeroExternalSends = parseYesNo(
      row.zeroExternalSends,
      rowNumber,
      "zeroExternalSends",
    );
    const reviewedByEmail = normalizeEmail(row.reviewedByEmail);

    requireAllowedValue(status, allowedStatuses, rowNumber, "status");

    for (const [header, value] of Object.entries({
      chapterId: row.chapterId,
      eventName: row.eventName,
      lumaEventId: row.lumaEventId,
      eventRoute: row.eventRoute,
      attendanceRoute: row.attendanceRoute,
      pointsRoute: row.pointsRoute,
      auditRoute: row.auditRoute,
      outboxRoute: row.outboxRoute,
      checkedAt: row.checkedAt,
      reviewedByEmail,
      notes: row.notes ?? "",
    })) {
      validateProofImportValue(rowNumber, header, value);
    }

    if (attendanceCount > rsvpCount) {
      throw new Error(
        `Pilot proof CSV row ${rowNumber} attendanceCount cannot exceed rsvpCount until walk-in reconciliation is represented.`,
      );
    }

    if (pointsAwardedCount !== attendanceCount) {
      throw new Error(
        `Pilot proof CSV row ${rowNumber} pointsAwardedCount must match attendanceCount so every checked-in attendee reaches the leaderboard.`,
      );
    }

    if (status === "ready") {
      if (rsvpCount < 1) {
        throw new Error(`Pilot proof CSV row ${rowNumber} needs at least one RSVP.`);
      }

      if (attendanceCount < 1) {
        throw new Error(
          `Pilot proof CSV row ${rowNumber} needs at least one attendance check-in.`,
        );
      }

      if (!auditRecorded) {
        throw new Error(
          `Pilot proof CSV row ${rowNumber} is marked ready but auditRecorded is not yes.`,
        );
      }

      if (!zeroExternalSends) {
        throw new Error(
          `Pilot proof CSV row ${rowNumber} is marked ready but zeroExternalSends is not yes.`,
        );
      }
    }

    return {
      chapterId: row.chapterId.trim(),
      eventName: row.eventName.trim(),
      lumaEventId: row.lumaEventId.trim(),
      rsvpCount: String(rsvpCount),
      attendanceCount: String(attendanceCount),
      pointsAwardedCount: String(pointsAwardedCount),
      auditEvidence: auditRecorded ? "recorded" : "missing",
      outboxStatus: zeroExternalSends ? "zero_sends" : "sends_detected",
      status,
      eventRoute: row.eventRoute.trim(),
      attendanceRoute: row.attendanceRoute.trim(),
      pointsRoute: row.pointsRoute.trim(),
      auditRoute: row.auditRoute.trim(),
      outboxRoute: row.outboxRoute.trim(),
      checkedAt: row.checkedAt.trim(),
      reviewedByEmail,
      notes: row.notes?.trim() ?? "",
    };
  });
  const chapterIds = new Set(proofRows.map((row) => row.chapterId));

  return {
    pilotEventProofCsv: formatCsv([
      [
        "chapterId",
        "eventName",
        "lumaEventId",
        "rsvpCount",
        "attendanceCount",
        "pointsAwardedCount",
        "auditEvidence",
        "outboxStatus",
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
      ...proofRows.map((row) => [
        row.chapterId,
        row.eventName,
        row.lumaEventId,
        row.rsvpCount,
        row.attendanceCount,
        row.pointsAwardedCount,
        row.auditEvidence,
        row.outboxStatus,
        row.status,
        row.eventRoute,
        row.attendanceRoute,
        row.pointsRoute,
        row.auditRoute,
        row.outboxRoute,
        row.checkedAt,
        row.reviewedByEmail,
        row.notes,
      ]),
    ]),
    counts: {
      proofRows: proofRows.length,
      readyRows: proofRows.filter((row) => row.status === "ready").length,
      chapters: chapterIds.size,
    },
  };
}

function parsePilotProofSourceCsv(csv: string): PilotProofSourceRow[] {
  const rows = parseCsvRows(csv);

  if (rows.length === 0) {
    throw new Error("Pilot proof CSV is empty.");
  }

  const [headerRow, ...bodyRows] = rows;
  const headers = headerRow.map((header) => header.trim());
  const allowedHeaders = new Set<string>([
    ...proofImportHeaders.required,
    ...proofImportHeaders.optional,
  ]);

  for (const requiredHeader of proofImportHeaders.required) {
    if (!headers.includes(requiredHeader)) {
      throw new Error(`Pilot proof CSV is missing required column ${requiredHeader}.`);
    }
  }

  for (const header of headers) {
    if (!allowedHeaders.has(header)) {
      throw new Error(
        `Pilot proof CSV has unsupported column ${header}. Keep the import limited to RSVP, attendance, points, audit, zero-send, route, reviewer, timestamp, status, and notes fields.`,
      );
    }
  }

  return bodyRows
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row, index) => {
      if (row.length !== headers.length) {
        throw new Error(
          `Pilot proof CSV row ${index + 2} has ${row.length} cells; expected ${headers.length}.`,
        );
      }

      const parsedRow = Object.fromEntries(
        headers.map((header, headerIndex) => [header, row[headerIndex].trim()]),
      );

      for (const requiredHeader of proofImportHeaders.required) {
        if (!parsedRow[requiredHeader]) {
          throw new Error(
            `Pilot proof CSV row ${index + 2} is missing required value ${requiredHeader}.`,
          );
        }
      }

      return parsedRow;
    });
}

function parseWholeNumber(value: string, rowNumber: number, header: string) {
  const trimmedValue = value.trim();

  if (!/^\d+$/.test(trimmedValue)) {
    throw new Error(
      `Pilot proof CSV row ${rowNumber} column ${header} must be a whole number.`,
    );
  }

  return Number(trimmedValue);
}

function parseYesNo(value: string, rowNumber: number, header: string) {
  const normalizedValue = value.trim().toLowerCase();

  if (["yes", "y", "true", "recorded", "zero_sends"].includes(normalizedValue)) {
    return true;
  }

  if (["no", "n", "false", "missing", "sends_detected", "not_checked"].includes(normalizedValue)) {
    return false;
  }

  throw new Error(
    `Pilot proof CSV row ${rowNumber} column ${header} must be yes/no or true/false.`,
  );
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function requireAllowedValue(
  value: string,
  allowedValues: Set<string>,
  rowNumber: number,
  header: string,
) {
  if (!allowedValues.has(value)) {
    throw new Error(
      `Pilot proof CSV row ${rowNumber} has unsupported ${header} ${value}. Use one of: ${Array.from(allowedValues).join(", ")}.`,
    );
  }
}

function validateProofImportValue(rowNumber: number, header: string, value: string) {
  if (/<[^>\n]+>/.test(value) || /\b(TODO|TBD|PLACEHOLDER)\b/i.test(value)) {
    throw new Error(
      `Pilot proof CSV row ${rowNumber} column ${header} contains placeholder text; replace it with approved production rollout evidence.`,
    );
  }

  if (header.toLowerCase().includes("email")) {
    validateEmail(rowNumber, header, value);
  }

  if (routeHeaders.has(header)) {
    validateRoute(rowNumber, header, value);
  }

  if (["lumaEventId", "notes"].includes(header)) {
    validateNoSecretLikeValue(rowNumber, header, value);
    validateProductionProofSource(rowNumber, header, value);
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
      `Pilot proof CSV row ${rowNumber} column ${header} must contain a real email address.`,
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
      `Pilot proof CSV row ${rowNumber} column ${header} uses test or placeholder email data; replace it with an approved production email.`,
    );
  }
}

function validateRoute(rowNumber: number, header: string, value: string) {
  if (!value.startsWith("/")) {
    throw new Error(
      `Pilot proof CSV row ${rowNumber} column ${header} must be an app route starting with /.`,
    );
  }

  validateNoSecretLikeValue(rowNumber, header, value);
}

function validateNoSecretLikeValue(rowNumber: number, header: string, value: string) {
  const normalizedValue = value.toLowerCase();

  if (/(api[_-]?key|secret|token|password|bearer\s+)/i.test(value)) {
    throw new Error(
      `Pilot proof CSV row ${rowNumber} column ${header} looks like it may contain a credential. Keep secrets out of rollout evidence.`,
    );
  }

  if (
    normalizedValue.startsWith("sk_") ||
    normalizedValue.startsWith("pk_") ||
    normalizedValue.startsWith("eyj")
  ) {
    throw new Error(
      `Pilot proof CSV row ${rowNumber} column ${header} looks like a key or token. Keep secrets out of rollout evidence.`,
    );
  }
}

function validateProductionProofSource(
  rowNumber: number,
  header: string,
  value: string,
) {
  const matchedMarker = getBlockedProductionPilotProofSourceMarker(value);

  if (matchedMarker) {
    throw new Error(
      `Pilot proof CSV row ${rowNumber} column ${header} references ${matchedMarker}, which is local, preview, staging, sample, or setup-only evidence and cannot count as approved production pilot proof.`,
    );
  }
}

export function getBlockedProductionPilotProofSourceMarker(
  value: string | undefined | null,
): string | null {
  const normalizedValue = value?.toLowerCase() ?? "";

  return (
    blockedProductionPilotProofSourceMarkers.find((marker) =>
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
