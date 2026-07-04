import { describe, expect, it } from "vitest";

import {
  classifySubmittedContentUrl,
  getApprovedEmbedDomains,
  sanitizeUserTextContent,
  validateUserGeneratedUploadMetadata,
} from "@/services/user-generated-content-safety";

describe("user-generated content safety", () => {
  it("documents the approved embed domain allowlist", () => {
    const domains = getApprovedEmbedDomains();

    expect(domains.instagram).toContain("instagram.com");
    expect(domains.linkedin).toContain("linkedin.com");
    expect(domains.facebook).toContain("facebook.com");
    expect(domains.loom).toContain("loom.com");
    expect(domains.youtube).toContain("youtube.com");
    expect(domains.youtube).toContain("youtu.be");
  });

  it("sanitizes script tags, event handlers, and dangerous URL schemes from text", () => {
    const sanitized = sanitizeUserTextContent(
      '<script>alert("xss")</script><img src=x onerror=alert("xss")>[click](javascript:alert("xss"))',
    );

    expect(sanitized).not.toContain("<script");
    expect(sanitized).not.toContain("onerror");
    expect(sanitized).not.toContain("javascript:");
    expect(sanitized).toContain("[blocked-url]:");
  });

  it("allows safe known media URLs as app-generated embeds", () => {
    const result = classifySubmittedContentUrl("https://www.youtube.com/watch?v=abc123");

    expect(result).toMatchObject({
      kind: "embed_allowed",
      provider: "youtube",
      host: "www.youtube.com",
    });
  });

  it("keeps unknown domains as regular links rather than embeds", () => {
    const result = classifySubmittedContentUrl("https://example.edu/rush-month-recap");

    expect(result).toMatchObject({
      kind: "link_only",
      host: "example.edu",
      reason: "domain_not_allowlisted_for_embed",
    });
  });

  it("blocks raw iframe/embed HTML pasted by a user", () => {
    const result = classifySubmittedContentUrl(
      '<iframe src="https://www.youtube.com/embed/abc123"></iframe>',
    );

    expect(result).toEqual({
      kind: "blocked",
      reason: "raw_html_not_allowed",
    });
  });

  it("blocks dangerous URL schemes", () => {
    const result = classifySubmittedContentUrl("javascript:alert('xss')");

    expect(result).toEqual({
      kind: "blocked",
      reason: "unsafe_url_scheme",
    });
  });

  it("rejects invalid or oversized uploads before storage is enabled", () => {
    expect(
      validateUserGeneratedUploadMetadata({
        fileName: "malware.exe",
        mimeType: "application/x-msdownload",
        byteSize: 12_000,
      }),
    ).toMatchObject({
      accepted: false,
      reasons: [
        "File type is not allowed.",
        "File extension does not match an allowed upload type.",
      ],
    });

    expect(
      validateUserGeneratedUploadMetadata({
        fileName: "bridge-video.mp4",
        mimeType: "video/mp4",
        byteSize: 501 * 1024 * 1024,
      }).accepted,
    ).toBe(false);
  });

  it("accepts allowed upload metadata inside the future size limit", () => {
    expect(
      validateUserGeneratedUploadMetadata({
        fileName: "rush-month-photo.jpg",
        mimeType: "image/jpeg",
        byteSize: 2_500_000,
      }),
    ).toEqual({
      accepted: true,
      reasons: [],
    });
  });
});
