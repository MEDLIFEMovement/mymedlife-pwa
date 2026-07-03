import { describe, expect, it } from "vitest";
import {
  formatProductionDomainReadinessResult,
  getProductionDomainReadiness,
  type ProductionDomainReadinessSnapshot,
} from "@/services/production-domain-readiness";

describe("production domain readiness", () => {
  it("passes when the public domain resolves to Vercel and serves the app", () => {
    const result = getProductionDomainReadiness(createReadySnapshot());

    expect(result.ready).toBe(true);
    expect(result.checks.every((check) => check.passed)).toBe(true);
    expect(formatProductionDomainReadinessResult(result, "https://www.mymedlife.org"))
      .toContain("Production domain readiness: READY");
  });

  it("fails while GoDaddy parking DNS is still active", () => {
    const result = getProductionDomainReadiness({
      ...createReadySnapshot(),
      apex: {
        domain: "mymedlife.org",
        addresses: ["15.197.148.33", "3.33.130.190"],
        cnames: [],
      },
      www: {
        domain: "www.mymedlife.org",
        addresses: ["15.197.148.33", "3.33.130.190"],
        cnames: ["mymedlife.org"],
      },
    });

    expect(result.ready).toBe(false);
    expect(result.checks).toContainEqual({
      label: "Root domain no longer points to GoDaddy parking",
      passed: false,
      detail: "found GoDaddy parking address 15.197.148.33, 3.33.130.190",
    });
  });

  it("fails when the public login page still serves the GoDaddy lander", () => {
    const result = getProductionDomainReadiness({
      ...createReadySnapshot(),
      login: {
        url: "https://www.mymedlife.org/login",
        status: 200,
        finalUrl: "https://www.mymedlife.org/login",
        html: '<!DOCTYPE html><script>window.location.href="/lander"</script>',
      },
    });

    expect(result.ready).toBe(false);
    expect(result.checks).toContainEqual({
      label: "Public login page is not the GoDaddy lander",
      passed: false,
      detail: 'found parking-page marker "window.location.href="/lander""',
    });
  });
});

function createReadySnapshot(): ProductionDomainReadinessSnapshot {
  return {
    apex: {
      domain: "mymedlife.org",
      addresses: ["76.76.21.21"],
      cnames: [],
    },
    www: {
      domain: "www.mymedlife.org",
      addresses: ["76.76.21.21"],
      cnames: ["cname.vercel-dns.com"],
    },
    login: {
      url: "https://www.mymedlife.org/login",
      status: 200,
      finalUrl: "https://www.mymedlife.org/login",
      html: "<main>myMEDLIFE Use one account</main>",
    },
  };
}
