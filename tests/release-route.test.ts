import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getReleaseProvenance: vi.fn(),
}));

vi.mock("@/services/release-provenance", () => ({
  getReleaseProvenance: mocks.getReleaseProvenance,
}));

import { GET } from "@/app/api/release/route";

describe("release provenance route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns no-store release metadata and the matching release header", async () => {
    mocks.getReleaseProvenance.mockReturnValue({
      service: "mymedlife-pwa",
      releaseSha: "9798e2be63f277480122d6ccc48126df84a38065",
      deploymentEnvironment: "production",
      gitRef: "main",
      ready: true,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    expect(response.headers.get("x-mymedlife-release")).toBe(
      "9798e2be63f277480122d6ccc48126df84a38065",
    );
    await expect(response.json()).resolves.toMatchObject({
      service: "mymedlife-pwa",
      ready: true,
    });
  });

  it("returns 503 without a release header when provenance is unavailable", async () => {
    mocks.getReleaseProvenance.mockReturnValue({
      service: "mymedlife-pwa",
      releaseSha: null,
      deploymentEnvironment: "unknown",
      gitRef: null,
      ready: false,
    });

    const response = await GET();

    expect(response.status).toBe(503);
    expect(response.headers.has("x-mymedlife-release")).toBe(false);
  });
});
