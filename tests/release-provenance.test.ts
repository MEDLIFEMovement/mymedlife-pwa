import { describe, expect, it } from "vitest";

import { getReleaseProvenance } from "@/services/release-provenance";

describe("release provenance", () => {
  it("returns one exact, public-safe Vercel release identity", () => {
    expect(getReleaseProvenance({
      VERCEL_GIT_COMMIT_SHA: "9798E2BE63F277480122D6CCC48126DF84A38065",
      VERCEL_ENV: "production",
      VERCEL_GIT_COMMIT_REF: "main",
    })).toEqual({
      service: "mymedlife-pwa",
      releaseSha: "9798e2be63f277480122d6ccc48126df84a38065",
      deploymentEnvironment: "production",
      gitRef: "main",
      ready: true,
    });
  });

  it("fails closed for missing or malformed deployment metadata", () => {
    expect(getReleaseProvenance({
      VERCEL_GIT_COMMIT_SHA: "short-sha",
      VERCEL_ENV: "custom",
      VERCEL_GIT_COMMIT_REF: "main<script>",
    })).toEqual({
      service: "mymedlife-pwa",
      releaseSha: null,
      deploymentEnvironment: "unknown",
      gitRef: null,
      ready: false,
    });
  });

  it("supports an explicit local release SHA without overriding Vercel", () => {
    expect(getReleaseProvenance({
      MYMEDLIFE_RELEASE_SHA: "1111111111111111111111111111111111111111",
      NODE_ENV: "development",
    })).toMatchObject({
      releaseSha: "1111111111111111111111111111111111111111",
      deploymentEnvironment: "development",
      ready: true,
    });
    expect(getReleaseProvenance({
      VERCEL_GIT_COMMIT_SHA: "2222222222222222222222222222222222222222",
      MYMEDLIFE_RELEASE_SHA: "1111111111111111111111111111111111111111",
    }).releaseSha).toBe("2222222222222222222222222222222222222222");
  });
});
