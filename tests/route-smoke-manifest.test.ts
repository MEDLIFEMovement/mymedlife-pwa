import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getRouteSmokeManifest } from "@/services/route-smoke-manifest";

describe("route smoke manifest", () => {
  it("gives admin a route-level smoke manifest with zero writes or sends expected", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const manifest = getRouteSmokeManifest(actor);

    expect(manifest.canReadManifest).toBe(true);
    expect(manifest.title).toBe("Admin route smoke manifest");
    expect(manifest.counts.totalRoutes).toBe(47);
    expect(manifest.counts.criticalRoutes).toBeGreaterThan(0);
    expect(manifest.counts.mobileVisualChecks).toBe(8);
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
        "/login",
        "/profile",
        "/onboarding",
        "/chapter",
        "/chapter/members",
        "/slt-prep",
        "/slt-prep/staff",
        "/proof-library/upload",
        "/rush-month",
        "/rush-month/dashboard",
        "/rush-month/leaderboard",
        "/rush-month/events",
        "/rush-month/events/event-rush-social-001",
        "/rush-month/actions",
        "/rush-month/actions/member-push",
        "/rush-month/evidence",
        "/rush-month/loop",
        "/coach",
        "/admin",
        "/admin/review-path",
        "/admin/nick-review",
        "/admin/release-readiness",
        "/admin/launch-gate",
        "/admin/audit-log",
        "/admin/integration-outbox",
        "/admin/master-data",
        "/admin/permissions",
        "/admin/committees",
        "/admin/workflows",
        "/admin/sop-library",
        "/admin/sop-builder/rush-month?tab=steps",
        "/admin/database-security",
        "/admin/system-health",
        "/admin/design-qa",
        "/admin/operations",
        "/admin/first-write",
        "/admin/write-sequence",
        "/admin/proof-write",
        "/admin/hq-proof-write",
        "/admin/assignment-write",
        "/admin/coach-write",
        "/admin/pilot-scope",
        "/admin/staff-dry-run",
      ]),
    );
    expect(
      manifest.routes.every((route) => route.safetyAssertion.length > 0),
    ).toBe(true);
    expect(
      manifest.routes.find((route) => route.path === "/coach")?.expectedResult,
    ).toContain("support notes");
    expect(
      manifest.routes.find((route) => route.path === "/coach")?.expectedResult,
    ).toContain("Goal 154 intervention checklist");
    expect(
      manifest.routes.find((route) => route.path === "/offline")?.expectedResult,
    ).toContain("mobile recovery shell");
    expect(
      manifest.routes.find((route) => route.path === "/offline")?.safetyAssertion,
    ).toContain("cache private data");
    expect(
      manifest.routes.find((route) => route.path === "/login")?.expectedResult,
    ).toContain("fake local seed-user sign-in");
    expect(
      manifest.routes.find((route) => route.path === "/login")?.safetyAssertion,
    ).toContain("Production auth");
    expect(
      manifest.routes.find((route) => route.path === "/profile")?.expectedResult,
    ).toContain("next safe action");
    expect(
      manifest.routes.find((route) => route.path === "/profile")?.safetyAssertion,
    ).toContain("Profile saves");
    expect(
      manifest.routes.find((route) => route.path === "/onboarding")
        ?.expectedResult,
    ).toContain("future sign-in");
    expect(
      manifest.routes.find((route) => route.path === "/onboarding")
        ?.expectedResult,
    ).toContain("staff role assignment");
    expect(
      manifest.routes.find((route) => route.path === "/onboarding")
        ?.expectedResult,
    ).toContain("Goal 157 staff production auth preflight");
    expect(
      manifest.routes.find((route) => route.path === "/onboarding")
        ?.safetyAssertion,
    ).toContain("Live auth");
    expect(
      manifest.routes.find((route) => route.path === "/onboarding")
        ?.safetyAssertion,
    ).toContain("browser writes");
    expect(
      manifest.routes.find((route) => route.path === "/chapter")?.expectedResult,
    ).toContain("current campaign");
    expect(
      manifest.routes.find((route) => route.path === "/chapter")?.expectedResult,
    ).toContain("read-only points");
    expect(
      manifest.routes.find((route) => route.path === "/chapter")?.safetyAssertion,
    ).toContain("Chapter membership writes");
    expect(
      manifest.routes.find((route) => route.path === "/chapter/members")
        ?.expectedResult,
    ).toContain("Goal 160 membership approval packet");
    expect(
      manifest.routes.find((route) => route.path === "/chapter/members")
        ?.expectedResult,
    ).toContain("Goal 161 membership result states");
    expect(
      manifest.routes.find((route) => route.path === "/chapter/members")
        ?.safetyAssertion,
    ).toContain("Join approvals");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month")?.expectedResult,
    ).toContain("active Rush Month objective");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month")?.expectedResult,
    ).toContain("operating path");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month")?.safetyAssertion,
    ).toContain("No campaign phase advance");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/actions")
        ?.expectedResult,
    ).toContain("assigned-action list");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/actions")
        ?.expectedResult,
    ).toContain("links into action detail");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/actions")
        ?.safetyAssertion,
    ).toContain("Assignment creation");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/evidence")
        ?.expectedResult,
    ).toContain("proof prep checklist");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/evidence")
        ?.expectedResult,
    ).toContain("Goal 158 proof submission packet");
    expect(
      manifest.routes.find((route) => route.path === "/coach")?.safetyAssertion,
    ).toContain("Coach note saves");
    expect(
      manifest.routes.find((route) => route.path === "/coach")?.safetyAssertion,
    ).toContain("external automation");
    expect(
      manifest.routes.find((route) => route.path === "/admin/review-path")
        ?.expectedResult,
    ).toContain("no-code stakeholder review path");
    expect(
      manifest.routes.find((route) => route.path === "/admin/review-path")
        ?.safetyAssertion,
    ).toContain("Review path");
    expect(
      manifest.routes.find((route) => route.path === "/admin/nick-review")
        ?.expectedResult,
    ).toContain("final local MVP review packet");
    expect(
      manifest.routes.find((route) => route.path === "/admin/nick-review")
        ?.expectedResult,
    ).toContain("pilot scope");
    expect(
      manifest.routes.find((route) => route.path === "/admin/nick-review")
        ?.safetyAssertion,
    ).toContain("Nick review");
    expect(
      manifest.routes.find((route) => route.path === "/admin/release-readiness")
        ?.expectedResult,
    ).toContain("local review yes");
    expect(
      manifest.routes.find((route) => route.path === "/admin/release-readiness")
        ?.safetyAssertion,
    ).toContain("Release readiness review");
    expect(
      manifest.routes.find((route) => route.path === "/admin/launch-gate")
        ?.expectedResult,
    ).toContain("eight production launch gates");
    expect(
      manifest.routes.find((route) => route.path === "/admin/launch-gate")
        ?.expectedResult,
    ).toContain("Goal 150 launch evidence checklist");
    expect(
      manifest.routes.find((route) => route.path === "/admin/launch-gate")
        ?.safetyAssertion,
    ).toContain("Launch gate review");
    expect(
      manifest.routes.find((route) => route.path === "/admin/audit-log")
        ?.expectedResult,
    ).toContain("audit readback posture");
    expect(
      manifest.routes.find((route) => route.path === "/admin/audit-log")
        ?.expectedResult,
    ).toContain("Goal 156 write-audit preflight checklist");
    expect(
      manifest.routes.find((route) => route.path === "/admin/audit-log")
        ?.safetyAssertion,
    ).toContain("Audit row edits");
    expect(
      manifest.routes.find((route) => route.path === "/admin/audit-log")
        ?.safetyAssertion,
    ).toContain("retention changes");
    expect(
      manifest.routes.find((route) => route.path === "/admin/integration-outbox")
        ?.expectedResult,
    ).toContain("structured integration events");
    expect(
      manifest.routes.find((route) => route.path === "/admin/integration-outbox")
        ?.expectedResult,
    ).toContain("Goal 155 live-send preflight checklist");
    expect(
      manifest.routes.find((route) => route.path === "/admin/integration-outbox")
        ?.safetyAssertion,
    ).toContain("live-send approvals");
    expect(
      manifest.routes.find((route) => route.path === "/admin/integration-outbox")
        ?.safetyAssertion,
    ).toContain("external workers");
    expect(
      manifest.routes.find((route) => route.path === "/admin/master-data")
        ?.expectedResult,
    ).toContain("fake users");
    expect(
      manifest.routes.find((route) => route.path === "/admin/master-data")
        ?.safetyAssertion,
    ).toContain("Production user creation");
    expect(
      manifest.routes.find((route) => route.path === "/admin/database-security")
        ?.expectedResult,
    ).toContain("Supabase Postgres/Auth/Storage");
    expect(
      manifest.routes.find((route) => route.path === "/admin/database-security")
        ?.safetyAssertion,
    ).toContain("Database security review");
    expect(
      manifest.routes.find((route) => route.path === "/admin/system-health")
        ?.expectedResult,
    ).toContain("route registry");
    expect(
      manifest.routes.find((route) => route.path === "/admin/system-health")
        ?.safetyAssertion,
    ).toContain("Live launch");
    expect(
      manifest.routes.find((route) => route.path === "/admin/design-qa")
        ?.expectedResult,
    ).toContain("Figma target");
    expect(
      manifest.routes.find((route) => route.path === "/admin/design-qa")
        ?.expectedResult,
    ).toContain("eight-route mobile visual smoke plan");
    expect(
      manifest.routes.find((route) => route.path === "/admin/design-qa")
        ?.safetyAssertion,
    ).toContain("Design review");
    expect(
      manifest.routes.find((route) => route.path === "/admin/operations")
        ?.expectedResult,
    ).toContain("incident triage");
    expect(
      manifest.routes.find((route) => route.path === "/admin/operations")
        ?.safetyAssertion,
    ).toContain("Operations review");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/actions/member-push")
        ?.expectedResult,
    ).toContain("one assigned action");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/actions/member-push")
        ?.safetyAssertion,
    ).toContain("Action-start saves");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/evidence")
        ?.expectedResult,
    ).toContain("next proof item");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/evidence")
        ?.safetyAssertion,
    ).toContain("Proof metadata saves");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/events")
        ?.expectedResult,
    ).toContain("attend-reflect-share bridge");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/events")
        ?.safetyAssertion,
    ).toContain("proof upload");
    expect(
      manifest.routes.find((route) => route.path === "/proof-library/upload")
        ?.expectedResult,
    ).toContain("Goal 159 proof storage intake packet");
    expect(
      manifest.routes.find((route) => route.path === "/proof-library/upload")
        ?.safetyAssertion,
    ).toContain("storage bucket write");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/review")
        ?.expectedResult,
    ).toContain("approve/request/reject");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/review")
        ?.expectedResult,
    ).toContain("Goal 153 review rubric");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/review")
        ?.expectedResult,
    ).toContain("leader proof decision result states");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/review")
        ?.safetyAssertion,
    ).toContain("Production leader proof decision saves");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/review")
        ?.safetyAssertion,
    ).toContain("result-state saves");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/leaderboard")
        ?.expectedResult,
    ).toContain("points, rank, recognition");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/leaderboard")
        ?.safetyAssertion,
    ).toContain("No points ledger write");
    expect(
      manifest.routes.find(
        (route) => route.path === "/rush-month/events/event-rush-social-001",
      )?.expectedResult,
    ).toContain("NPS prompt");
    expect(
      manifest.routes.find(
        (route) => route.path === "/rush-month/events/event-rush-social-001",
      )?.safetyAssertion,
    ).toContain("No Luma write");
  });

  it("connects the Goal 146 mobile visual smoke checks to route smoke rows", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const manifest = getRouteSmokeManifest(actor);
    const mobileRoutes = manifest.routes.filter((route) => route.mobileReview);

    expect(mobileRoutes.map((route) => route.path)).toEqual(
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
    expect(
      mobileRoutes.every((route) =>
        route.mobileReview?.viewport.includes("390px"),
      ),
    ).toBe(true);
    expect(
      mobileRoutes.every((route) => route.mobileReview?.passSignal.length),
    ).toBe(true);
    expect(
      mobileRoutes.every((route) =>
        route.mobileReview?.blockedUntil.includes("approved"),
      ),
    ).toBe(true);
    expect(
      manifest.routes.find((route) => route.path === "/rush-month")
        ?.mobileReview?.reviewerActorEmail,
    ).toBe("member.a@mymedlife.test");
    expect(
      manifest.routes.find((route) => route.path === "/rush-month/dashboard")
        ?.mobileReview?.reviewerActorEmail,
    ).toBe("leader.a@mymedlife.test");
    expect(
      manifest.routes.find((route) => route.path === "/coach")?.mobileReview
        ?.reviewerActorEmail,
    ).toBe("coach@mymedlife.test");
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
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getRouteSmokeManifest(member).canReadManifest).toBe(false);
    expect(getRouteSmokeManifest(committeeMember).canReadManifest).toBe(false);
    expect(getRouteSmokeManifest(committeeChair).canReadManifest).toBe(false);
    expect(getRouteSmokeManifest(leader).canReadManifest).toBe(false);
    expect(getRouteSmokeManifest(coach).canReadManifest).toBe(false);
  });
});
