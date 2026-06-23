import { describe, expect, it } from "vitest";
import {
  appendLandingRouteSource,
  getLandingRouteForActor,
  getLandingRouteForLocalActorEmail,
} from "@/services/landing-route";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("landing route service", () => {
  it("maps current local personas to their owned default surfaces", () => {
    expect(getLandingRouteForActor(getMockLocalActorContext("member.a@mymedlife.test"))).toBe(
      "/",
    );
    expect(getLandingRouteForActor(getMockLocalActorContext("traveler.a@mymedlife.test"))).toBe(
      "/slt-prep",
    );
    expect(getLandingRouteForActor(getMockLocalActorContext("leader.a@mymedlife.test"))).toBe(
      "/chapter?view=overview",
    );
    expect(getLandingRouteForActor(getMockLocalActorContext("vice.president@mymedlife.test"))).toBe(
      "/chapter?view=overview",
    );
    expect(getLandingRouteForActor(getMockLocalActorContext("coach@mymedlife.test"))).toBe(
      "/coach?view=chapters",
    );
    expect(getLandingRouteForActor(getMockLocalActorContext("sales.coach@mymedlife.test"))).toBe(
      "/coach?view=chapters",
    );
    expect(getLandingRouteForActor(getMockLocalActorContext("admin@mymedlife.test"))).toBe(
      "/staff?view=chapters",
    );
    expect(getLandingRouteForActor(getMockLocalActorContext("sales.admin@mymedlife.test"))).toBe(
      "/staff?view=chapters",
    );
    expect(getLandingRouteForActor(getMockLocalActorContext("ds.admin@mymedlife.test"))).toBe(
      "/admin",
    );
  });

  it("can derive a landing route directly from a preview actor email", () => {
    expect(getLandingRouteForLocalActorEmail("traveler.a@mymedlife.test")).toBe(
      "/slt-prep",
    );
    expect(getLandingRouteForLocalActorEmail("leader.a@mymedlife.test")).toBe(
      "/chapter?view=overview",
    );
    expect(getLandingRouteForLocalActorEmail("sales.coach@mymedlife.test")).toBe(
      "/coach?view=chapters",
    );
    expect(getLandingRouteForLocalActorEmail("admin@mymedlife.test")).toBe(
      "/staff?view=chapters",
    );
    expect(getLandingRouteForLocalActorEmail("sales.admin@mymedlife.test")).toBe(
      "/staff?view=chapters",
    );
  });

  it("adds source query params without dropping existing route state", () => {
    expect(appendLandingRouteSource("/staff?view=chapters", "member_home")).toBe(
      "/staff?view=chapters&source=member_home",
    );
    expect(appendLandingRouteSource("/", "member_home")).toBe("/?source=member_home");
  });
});
