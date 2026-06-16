import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getRouteSmokeManifest } from "@/services/route-smoke-manifest";

describe("route smoke manifest", () => {
  it("gives admin a route-level smoke manifest with zero writes or sends expected", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const manifest = getRouteSmokeManifest(actor);

    expect(manifest.canReadManifest).toBe(true);
    expect(manifest.title).toBe("Admin route smoke manifest");
    expect(manifest.counts.totalRoutes).toBe(20);
    expect(manifest.counts.criticalRoutes).toBeGreaterThan(0);
    expect(manifest.counts.browserWritesExpected).toBe(0);
    expect(manifest.counts.externalWritesExpected).toBe(0);
  });

  it("includes core Rush Month routes and safety assertions", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const manifest = getRouteSmokeManifest(actor);
    const paths = manifest.routes.map((route) => route.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        "/",
        "/chapter/members",
        "/proof-library/upload",
        "/rush-month",
        "/rush-month/dashboard",
        "/rush-month/events",
        "/rush-month/actions",
        "/rush-month/loop",
        "/coach",
        "/admin",
        "/admin/first-write",
        "/admin/write-sequence",
        "/admin/proof-write",
        "/admin/hq-proof-write",
        "/admin/assignment-write",
        "/admin/pilot-scope",
        "/admin/staff-dry-run",
      ]),
    );
    expect(
      manifest.routes.every((route) => route.safetyAssertion.length > 0),
    ).toBe(true);
  });

  it("gives DS Admin the safety manifest", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const manifest = getRouteSmokeManifest(actor);

    expect(manifest.canReadManifest).toBe(true);
    expect(manifest.title).toBe("DS Admin route safety manifest");
    expect(
      manifest.routes.find((route) => route.path === "/admin")?.audiences,
    ).toContain("ds_admin");
  });

  it("hides the route manifest from chapter and coach roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getRouteSmokeManifest(member).canReadManifest).toBe(false);
    expect(getRouteSmokeManifest(leader).canReadManifest).toBe(false);
    expect(getRouteSmokeManifest(coach).canReadManifest).toBe(false);
  });
});
