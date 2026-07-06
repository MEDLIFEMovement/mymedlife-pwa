export type ProductionRolloutChapterImportResult = {
  chaptersCsv: string;
  coachAssignmentsCsv: string;
  campaignsCsv: string;
  lumaCalendarsCsv: string;
  counts: {
    chapters: number;
    coachAssignments: number;
    campaigns: number;
    lumaCalendars: number;
    uniqueCoaches: number;
  };
};

type ChapterCsvRow = Record<string, string>;

const chapterHeaders = {
  required: ["chapterId", "chapterName", "campus", "coachEmail", "calendarId"],
  optional: [
    "region",
    "chapterStatus",
    "coachType",
    "coachAssignmentStatus",
    "campaignName",
    "campaignSlug",
    "campaignStatus",
    "calendarName",
    "calendarStatus",
  ],
} as const;

const allowedChapterStatuses = new Set(["active", "inactive", "archived"]);
const allowedCoachTypes = new Set(["portfolio", "expansion"]);
const allowedCoachStatuses = new Set(["active", "inactive", "ended"]);
const allowedCampaignStatuses = new Set(["draft", "active", "complete", "archived"]);
const allowedCalendarStatuses = new Set(["linked", "needs_setup", "inactive"]);

export function buildProductionRolloutChapterImport(
  chapterCsv: string,
): ProductionRolloutChapterImportResult {
  const rows = parseChapterCsv(chapterCsv);
  const chapters = new Map<
    string,
    {
      id: string;
      name: string;
      campus: string;
      region: string;
      status: string;
    }
  >();
  const coachAssignments = new Map<
    string,
    {
      coachEmail: string;
      chapterId: string;
      coachType: string;
      status: string;
    }
  >();
  const campaigns = new Map<
    string,
    {
      chapterId: string;
      name: string;
      slug: string;
      status: string;
    }
  >();
  const lumaCalendars = new Map<
    string,
    {
      chapterId: string;
      calendarId: string;
      calendarName: string;
      status: string;
    }
  >();
  const uniqueCoaches = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const chapterId = row.chapterId.trim();
    const chapterName = row.chapterName.trim();
    const campus = row.campus.trim();
    const region = row.region?.trim() ?? "";
    const chapterStatus = row.chapterStatus?.trim() || "active";
    const coachEmail = normalizeEmail(row.coachEmail);
    const coachType = row.coachType?.trim() || "portfolio";
    const coachAssignmentStatus = row.coachAssignmentStatus?.trim() || "active";
    const campaignName = row.campaignName?.trim() || "Rush Month";
    const campaignSlug =
      row.campaignSlug?.trim() || `${slugify(campaignName)}-${slugify(chapterId)}`;
    const campaignStatus = row.campaignStatus?.trim() || "active";
    const calendarId = row.calendarId.trim();
    const calendarName = row.calendarName?.trim() || `${chapterName} Calendar`;
    const calendarStatus = row.calendarStatus?.trim() || "linked";

    for (const [header, value] of Object.entries({
      chapterId,
      chapterName,
      campus,
      region,
      chapterStatus,
      coachEmail,
      coachType,
      coachAssignmentStatus,
      campaignName,
      campaignSlug,
      campaignStatus,
      calendarId,
      calendarName,
      calendarStatus,
    })) {
      validateChapterImportValue("chapter import", rowNumber, header, value);
    }

    requireAllowedValue(chapterStatus, allowedChapterStatuses, rowNumber, "chapterStatus");
    requireAllowedValue(coachType, allowedCoachTypes, rowNumber, "coachType");
    requireAllowedValue(
      coachAssignmentStatus,
      allowedCoachStatuses,
      rowNumber,
      "coachAssignmentStatus",
    );
    requireAllowedValue(campaignStatus, allowedCampaignStatuses, rowNumber, "campaignStatus");
    requireAllowedValue(calendarStatus, allowedCalendarStatuses, rowNumber, "calendarStatus");
    validateLumaCalendarId(calendarId, rowNumber);

    if (chapters.has(chapterId)) {
      throw new Error(
        `Chapter import CSV row ${rowNumber} repeats chapterId ${chapterId}. Keep one setup row per launch chapter.`,
      );
    }

    chapters.set(chapterId, {
      id: chapterId,
      name: chapterName,
      campus,
      region,
      status: chapterStatus,
    });
    coachAssignments.set(chapterId, {
      coachEmail,
      chapterId,
      coachType,
      status: coachAssignmentStatus,
    });
    campaigns.set(chapterId, {
      chapterId,
      name: campaignName,
      slug: campaignSlug,
      status: campaignStatus,
    });
    lumaCalendars.set(chapterId, {
      chapterId,
      calendarId,
      calendarName,
      status: calendarStatus,
    });
    uniqueCoaches.add(coachEmail);
  });

  return {
    chaptersCsv: formatCsv([
      ["id", "name", "campus", "region", "status"],
      ...Array.from(chapters.values()).map((chapter) => [
        chapter.id,
        chapter.name,
        chapter.campus,
        chapter.region,
        chapter.status,
      ]),
    ]),
    coachAssignmentsCsv: formatCsv([
      ["coachEmail", "chapterId", "coachType", "status"],
      ...Array.from(coachAssignments.values()).map((assignment) => [
        assignment.coachEmail,
        assignment.chapterId,
        assignment.coachType,
        assignment.status,
      ]),
    ]),
    campaignsCsv: formatCsv([
      ["chapterId", "name", "slug", "status"],
      ...Array.from(campaigns.values()).map((campaign) => [
        campaign.chapterId,
        campaign.name,
        campaign.slug,
        campaign.status,
      ]),
    ]),
    lumaCalendarsCsv: formatCsv([
      ["chapterId", "calendarId", "calendarName", "status"],
      ...Array.from(lumaCalendars.values()).map((calendar) => [
        calendar.chapterId,
        calendar.calendarId,
        calendar.calendarName,
        calendar.status,
      ]),
    ]),
    counts: {
      chapters: chapters.size,
      coachAssignments: coachAssignments.size,
      campaigns: campaigns.size,
      lumaCalendars: lumaCalendars.size,
      uniqueCoaches: uniqueCoaches.size,
    },
  };
}

function parseChapterCsv(csv: string): ChapterCsvRow[] {
  const rows = parseCsvRows(csv);

  if (rows.length === 0) {
    throw new Error("Chapter import CSV is empty.");
  }

  const [headerRow, ...bodyRows] = rows;
  const headers = headerRow.map((header) => header.trim());
  const allowedHeaders = new Set<string>([
    ...chapterHeaders.required,
    ...chapterHeaders.optional,
  ]);

  for (const requiredHeader of chapterHeaders.required) {
    if (!headers.includes(requiredHeader)) {
      throw new Error(`Chapter import CSV is missing required column ${requiredHeader}.`);
    }
  }

  for (const header of headers) {
    if (!allowedHeaders.has(header)) {
      throw new Error(
        `Chapter import CSV has unsupported column ${header}. Keep the import limited to chapter setup, coach, campaign, and Luma calendar fields.`,
      );
    }
  }

  return bodyRows
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row, index) => {
      if (row.length !== headers.length) {
        throw new Error(
          `Chapter import CSV row ${index + 2} has ${row.length} cells; expected ${headers.length}.`,
        );
      }

      const parsedRow = Object.fromEntries(
        headers.map((header, headerIndex) => [header, row[headerIndex].trim()]),
      );

      for (const requiredHeader of chapterHeaders.required) {
        if (!parsedRow[requiredHeader]) {
          throw new Error(
            `Chapter import CSV row ${index + 2} is missing required value ${requiredHeader}.`,
          );
        }
      }

      return parsedRow;
    });
}

function validateChapterImportValue(
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

  if (header.toLowerCase().includes("email")) {
    validateEmail(tableName, rowNumber, header, value);
  }
}

function validateEmail(
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

function requireAllowedValue(
  value: string,
  allowedValues: Set<string>,
  rowNumber: number,
  header: string,
) {
  if (allowedValues.has(value)) {
    return;
  }

  throw new Error(
    `Chapter import CSV row ${rowNumber} has unsupported ${header} ${value}. Use one of: ${Array.from(allowedValues).join(", ")}.`,
  );
}

function validateLumaCalendarId(calendarId: string, rowNumber: number) {
  const normalized = calendarId.toLowerCase();

  if (
    normalized.includes("secret") ||
    normalized.includes("token") ||
    normalized.includes("bearer") ||
    normalized.startsWith("sk_") ||
    normalized.startsWith("pk_") ||
    normalized.includes("api_key") ||
    calendarId.split(".").length === 3 ||
    calendarId.length > 160
  ) {
    throw new Error(
      `Chapter import CSV row ${rowNumber} column calendarId looks like a key or token. Use the Luma calendar id only.`,
    );
  }
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
