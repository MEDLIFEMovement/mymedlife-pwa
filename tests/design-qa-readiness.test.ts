import { describe, expect, it } from "vitest";
import { getDesignQaReadiness } from "@/services/design-qa-readiness";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("design QA readiness", () => {
  it("gives admin a Figma and mobile QA checklist with zero writes and sends", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const readiness = getDesignQaReadiness(actor);

    expect(readiness.canReadReadiness).toBe(true);
    expect(readiness.title).toBe("Admin design QA readiness");
    expect(readiness.figmaTarget).toContain("figma.com/make");
    expect(readiness.mobileViewport).toContain("390px");
    expect(readiness.counts.total).toBe(11);
    expect(readiness.counts.mobileSmokeChecks).toBe(8);
    expect(readiness.counts.accessibilitySmokeChecks).toBe(7);
    expect(readiness.counts.devicePwaSmokeChecks).toBe(7);
    expect(readiness.counts.browserWritesExpected).toBe(0);
    expect(readiness.counts.externalWritesExpected).toBe(0);
  });

  it("keeps final visual QA blocked before launch", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const readiness = getDesignQaReadiness(actor);
    const productionVisualQa = readiness.items.find(
      (item) => item.key === "production_visual_qa",
    );

    expect(productionVisualQa?.status).toBe("blocked_before_launch");
    expect(productionVisualQa?.plainEnglish).toContain("Final polish");
    expect(productionVisualQa?.plainEnglish).toContain("offline PWA recovery");
    expect(productionVisualQa?.reviewerPrompt).toContain("Do not call");
    expect(productionVisualQa?.evidence).toContain("/offline");
  });

  it("tracks student clarity, role complexity, accessibility, and safety", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const readiness = getDesignQaReadiness(actor);
    const keys = readiness.items.map((item) => item.key);

    expect(keys).toEqual(
      expect.arrayContaining([
        "mobile_next_action",
        "role_complexity",
        "accessibility_baseline",
        "accessibility_smoke_plan",
        "device_pwa_smoke_plan",
        "pilot_safety_copy",
        "mobile_visual_smoke_plan",
      ]),
    );
    expect(readiness.counts.readyForLocalReview).toBeGreaterThan(0);
    expect(readiness.counts.needsVisualReview).toBeGreaterThan(0);
    expect(readiness.counts.blockedBeforeLaunch).toBe(1);
  });

  it("defines the phone-sized visual smoke route plan", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const readiness = getDesignQaReadiness(actor);
    const routes = readiness.mobileSmokeChecks.map((check) => check.route);
    const actors = readiness.mobileSmokeChecks.map(
      (check) => check.reviewerActorEmail,
    );

    expect(routes).toEqual(
      expect.arrayContaining([
        "/rush-month",
        "/rush-month/actions",
        "/rush-month/evidence",
        "/rush-month/dashboard",
        "/coach",
        "/admin/nick-review",
        "/offline",
        "/proof-library/upload",
      ]),
    );
    expect(actors).toEqual(
      expect.arrayContaining([
        "member.a@mymedlife.test",
        "leader.a@mymedlife.test",
        "coach@mymedlife.test",
        "admin@mymedlife.test",
      ]),
    );
    expect(
      readiness.mobileSmokeChecks.every((check) =>
        check.viewport.includes("390px"),
      ),
    ).toBe(true);
    expect(
      readiness.mobileSmokeChecks.every((check) =>
        check.blockedUntil.includes("approved"),
      ),
    ).toBe(true);
  });

  it("defines the keyboard and screen-reader accessibility smoke plan", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const readiness = getDesignQaReadiness(actor);
    const routes = readiness.accessibilitySmokeChecks.map((check) => check.route);
    const actors = readiness.accessibilitySmokeChecks.map(
      (check) => check.reviewerActorEmail,
    );

    expect(routes).toEqual(
      expect.arrayContaining([
        "/",
        "/rush-month/actions",
        "/proof-library/upload",
        "/rush-month/dashboard",
        "/coach",
        "/offline",
        "/admin/design-qa",
      ]),
    );
    expect(actors).toEqual(
      expect.arrayContaining([
        "member.a@mymedlife.test",
        "leader.a@mymedlife.test",
        "coach@mymedlife.test",
        "admin@mymedlife.test",
      ]),
    );
    expect(
      readiness.accessibilitySmokeChecks.every(
        (check) => check.interaction.length > 20 && check.passSignal.length > 20,
      ),
    ).toBe(true);
    expect(
      readiness.accessibilitySmokeChecks.some((check) =>
        check.targetSignal.includes("skip link"),
      ),
    ).toBe(true);
    expect(
      readiness.accessibilitySmokeChecks.some((check) =>
        check.passSignal.includes("color alone"),
      ),
    ).toBe(true);
  });

  it("defines the real-device and PWA smoke matrix", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const readiness = getDesignQaReadiness(actor);
    const routes = readiness.devicePwaSmokeChecks.map((check) => check.route);
    const devices = readiness.devicePwaSmokeChecks.map(
      (check) => check.deviceBrowser,
    );

    expect(routes).toEqual(
      expect.arrayContaining([
        "/rush-month",
        "/rush-month/actions",
        "/admin",
        "/offline",
        "/rush-month/dashboard",
        "/admin/design-qa",
      ]),
    );
    expect(devices).toEqual(
      expect.arrayContaining([
        "iPhone Safari",
        "Android Chrome",
        "Desktop Chrome",
        "iPhone installed PWA",
        "Android installed PWA",
        "iPad Safari",
        "Staging Safari, Chrome, and Edge",
      ]),
    );
    expect(
      readiness.devicePwaSmokeChecks.every(
        (check) => check.scenario.length > 30 && check.passSignal.length > 30,
      ),
    ).toBe(true);
    expect(
      readiness.devicePwaSmokeChecks.some((check) =>
        check.passSignal.includes("stale private data"),
      ),
    ).toBe(true);
    expect(
      readiness.devicePwaSmokeChecks.some((check) =>
        check.blockedUntil.includes("Staging cross-browser smoke"),
      ),
    ).toBe(true);
  });

  it("hides design QA from operating roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getDesignQaReadiness(member).canReadReadiness).toBe(false);
    expect(getDesignQaReadiness(member).mobileSmokeChecks).toEqual([]);
    expect(getDesignQaReadiness(member).accessibilitySmokeChecks).toEqual([]);
    expect(getDesignQaReadiness(member).devicePwaSmokeChecks).toEqual([]);
    expect(getDesignQaReadiness(leader).canReadReadiness).toBe(false);
    expect(getDesignQaReadiness(coach).canReadReadiness).toBe(false);
  });
});
