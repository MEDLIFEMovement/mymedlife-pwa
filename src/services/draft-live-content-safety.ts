export type DraftLiveContentStatus =
  | "draft"
  | "reviewed"
  | "scheduled"
  | "live"
  | "archived";

type DraftLiveFieldContext = {
  tableName: string;
  header: string;
  value: string;
};

const nonLiveStatuses = new Set<DraftLiveContentStatus>([
  "draft",
  "reviewed",
  "scheduled",
  "archived",
]);

const sampleContentMarkers = [
  "sop sample",
  "sample content",
  "sample data",
  "template draft",
  "draft only",
  "review only",
  "not live",
];

const templateSourceKinds = new Set(["builder_definition", "template_version"]);

export function normalizeDraftLiveContentStatus(
  value: string | null | undefined,
): DraftLiveContentStatus | null {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  switch (normalized) {
    case "draft":
    case "reviewed":
    case "scheduled":
    case "live":
    case "archived":
      return normalized;
    default:
      return null;
  }
}

export function isLiveDraftContentStatus(
  value: string | null | undefined,
): boolean {
  return normalizeDraftLiveContentStatus(value) === "live";
}

export function getDraftLiveContentStringEvidenceReason(
  value: string | null | undefined,
  path: string,
): string | null {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  for (const marker of sampleContentMarkers) {
    if (normalized.includes(marker)) {
      return `${path} contains ${marker}`;
    }
  }

  return null;
}

export function getDraftLiveContentFieldEvidenceReason(
  input: DraftLiveFieldContext,
): string | null {
  const normalizedHeader = input.header.trim().toLowerCase();
  const normalizedValue = input.value.trim().toLowerCase();

  const stringReason = getDraftLiveContentStringEvidenceReason(
    input.value,
    `${input.tableName}.${input.header}`,
  );

  if (stringReason) {
    return stringReason;
  }

  if (
    input.tableName === "campaigns" &&
    normalizedHeader === "status" &&
    nonLiveStatuses.has(normalizedValue as DraftLiveContentStatus)
  ) {
    return `${input.tableName}.${input.header} is marked ${normalizedValue}`;
  }

  if (
    ["template_status", "templatestatus", "contentstatus", "lifecyclestatus"].includes(
      normalizedHeader,
    ) &&
    nonLiveStatuses.has(normalizedValue as DraftLiveContentStatus)
  ) {
    return `${input.tableName}.${input.header} is marked ${normalizedValue}`;
  }

  if (
    normalizedHeader === "sourcekind" &&
    templateSourceKinds.has(normalizedValue)
  ) {
    return `${input.tableName}.${input.header} is marked ${normalizedValue}`;
  }

  return null;
}

export function getDraftLiveContentObjectEvidenceReason(
  value: unknown,
  path = "packet",
): string | null {
  if (typeof value === "string") {
    return getDraftLiveContentStringEvidenceReason(value, path);
  }

  if (typeof value === "boolean" || !value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const [index, child] of value.entries()) {
      const reason = getDraftLiveContentObjectEvidenceReason(
        child,
        `${path}[${index}]`,
      );
      if (reason) {
        return reason;
      }
    }
    return null;
  }

  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = key.trim().toLowerCase();

    if (
      normalizedKey === "istemplate" &&
      child === true
    ) {
      return `${path}.${key} is marked isTemplate=true`;
    }

    if (
      normalizedKey === "sourcekind" &&
      typeof child === "string" &&
      templateSourceKinds.has(child.trim().toLowerCase())
    ) {
      return `${path}.${key} is marked ${child.trim()}`;
    }

    if (
      isDraftStatusKey(normalizedKey, path) &&
      typeof child === "string" &&
      nonLiveStatuses.has(child.trim().toLowerCase() as DraftLiveContentStatus)
    ) {
      return `${path}.${key} is marked ${child.trim().toLowerCase()}`;
    }

    const reason = getDraftLiveContentObjectEvidenceReason(child, `${path}.${key}`);
    if (reason) {
      return reason;
    }
  }

  return null;
}

function isDraftStatusKey(normalizedKey: string, path: string) {
  if (
    ![
      "status",
      "template_status",
      "templatestatus",
      "content_status",
      "contentstatus",
      "lifecycle_status",
      "lifecyclestatus",
    ].includes(normalizedKey)
  ) {
    return false;
  }

  const normalizedPath = path.toLowerCase();
  return (
    normalizedPath.includes("campaign") ||
    normalizedPath.includes("template") ||
    normalizedPath.includes("workflow") ||
    normalizedPath.includes("sop")
  );
}
