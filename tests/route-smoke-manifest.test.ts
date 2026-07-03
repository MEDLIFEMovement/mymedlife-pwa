import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getRouteSmokeManifest } from "@/services/route-smoke-manifest";

describe("route smoke manifest", () => {
  it("keeps the admin smoke checklist centered on the events-and-points launch lane", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const manifest = getRouteSmokeManifest(actor);

    expect(manifest.canReadManifest).toBe(true);
    expect(manifest.title).toBe("Admin route smoke manifest");
    expect(manifest.summary).toContain("events-and-points launch lane");
    expect(manifest.counts.totalRoutes).toBe(15);
    expect(manifest.counts.criticalRoutes).toBeGreaterThan(10);
    expect(manifest.counts.mobileVisualChecks).toBe(1);
    expect(manifest.counts.browserWritesExpected).toBe(0);
    expect(manifest.counts.externalWritesExpected).toBe(0);
  });

  it("tracks only the visible launch-lane routes and leaves non-core modules out of review", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const manifest = getRouteSmokeManifest(actor);
    const paths = manifest.routes.map((route) => route.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        "/",
        "/offline",
        "/login",
        "/profile",
        "/app",
        "/app/events",
        "/app/events/chapter-event-ucla-kickoff",
        "/app/points",
        "/leader",
        "/staff",
        "/admin",
        "/admin/launch-gate",
        "/admin/audit-log",
        "/admin/integration-outbox",
        "/admin/pilot-scope",
      ]),
    );

    expect(paths).not.toEqual(
      expect.arrayContaining([
        "/chapter",
        "/coach",
        "/slt-prep",
        "/rush-month",
        "/proof-library/upload",
        "/admin/phase-2",
        "/admin/sop-library",
      ]),
    );

    expect(
      manifest.routes.find((route) => route.path === "/login")?.expectedResult,
    ).toContain("one sign-in surface");
    expect(
      manifest.routes.find((route) => route.path === "/app")?.expectedResult,
    ).toContain("mobile-first");
    expect(
      manifest.routes.find((route) => route.path === "/leader")?.expectedResult,
    ).toContain("create or link events");
    expect(
      manifest.routes.find((route) => route.path === "/staff")?.expectedResult,
    ).toContain("leaderboard movement");
    expect(
      manifest.routes.find((route) => route.path === "/admin/integration-outbox")
        ?.safetyAssertion,
    ).toContain("must not trigger sends");
    expect(
      manifest.routes.every((route) => route.safetyAssertion.length > 0),
    ).toBe(true);
  });
});
