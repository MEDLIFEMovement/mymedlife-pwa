import {
  getProofStoragePlan,
  isAllowedProofMimeType,
} from "@/services/proof-storage-readiness";

export type SafeEmbedProvider =
  | "instagram"
  | "linkedin"
  | "facebook"
  | "loom"
  | "youtube"
  | "vimeo";

export type SubmittedUrlClassification =
  | {
      kind: "embed_allowed";
      provider: SafeEmbedProvider;
      normalizedUrl: string;
      host: string;
    }
  | {
      kind: "link_only";
      normalizedUrl: string;
      host: string;
      reason: "domain_not_allowlisted_for_embed";
    }
  | {
      kind: "blocked";
      reason:
        | "empty"
        | "raw_html_not_allowed"
        | "invalid_url"
        | "unsafe_url_scheme";
    };

export type UploadMetadataValidation = {
  accepted: boolean;
  reasons: string[];
};

const approvedEmbedDomains: Record<SafeEmbedProvider, readonly string[]> = {
  instagram: ["instagram.com"],
  linkedin: ["linkedin.com"],
  facebook: ["facebook.com"],
  loom: ["loom.com"],
  youtube: ["youtube.com", "youtu.be"],
  vimeo: ["vimeo.com"],
};

const dangerousSchemePattern = /\b(?:javascript|data|vbscript)\s*:/gi;
const rawHtmlPattern = /<\/?[a-z][\s\S]*>/i;

export function getApprovedEmbedDomains() {
  return approvedEmbedDomains;
}

export function sanitizeUserTextContent(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/<\/?[a-z][\s\S]*?>/gi, "")
    .replace(dangerousSchemePattern, "[blocked-url]:")
    .trim();
}

export function classifySubmittedContentUrl(input: string): SubmittedUrlClassification {
  const value = input.trim();

  if (!value) {
    return { kind: "blocked", reason: "empty" };
  }

  if (rawHtmlPattern.test(value)) {
    return { kind: "blocked", reason: "raw_html_not_allowed" };
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { kind: "blocked", reason: "invalid_url" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { kind: "blocked", reason: "unsafe_url_scheme" };
  }

  const host = parsed.hostname.toLowerCase();
  const provider = getEmbedProviderForHost(host);

  if (!provider) {
    return {
      kind: "link_only",
      normalizedUrl: parsed.toString(),
      host,
      reason: "domain_not_allowlisted_for_embed",
    };
  }

  return {
    kind: "embed_allowed",
    provider,
    normalizedUrl: parsed.toString(),
    host,
  };
}

export function validateUserGeneratedUploadMetadata(input: {
  fileName: string;
  mimeType: string;
  byteSize: number;
}): UploadMetadataValidation {
  const plan = getProofStoragePlan();
  const maxBytes = plan.maxFileSizeMb * 1024 * 1024;
  const reasons: string[] = [];

  if (!isAllowedProofMimeType(input.mimeType)) {
    reasons.push("File type is not allowed.");
  }

  if (input.byteSize <= 0 || input.byteSize > maxBytes) {
    reasons.push(`File size must be between 1 byte and ${plan.maxFileSizeMb} MB.`);
  }

  if (!hasAllowedExtension(input.fileName, input.mimeType)) {
    reasons.push("File extension does not match an allowed upload type.");
  }

  return {
    accepted: reasons.length === 0,
    reasons,
  };
}

function getEmbedProviderForHost(host: string): SafeEmbedProvider | null {
  for (const [provider, domains] of Object.entries(approvedEmbedDomains) as Array<
    [SafeEmbedProvider, readonly string[]]
  >) {
    if (domains.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
      return provider;
    }
  }

  return null;
}

function hasAllowedExtension(fileName: string, mimeType: string): boolean {
  const extension = fileName.toLowerCase().split(".").pop() ?? "";

  const extensionByMimeType: Record<string, readonly string[]> = {
    "video/mp4": ["mp4"],
    "video/quicktime": ["mov", "qt"],
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
    "application/pdf": ["pdf"],
  };

  return extensionByMimeType[mimeType]?.includes(extension) ?? false;
}
