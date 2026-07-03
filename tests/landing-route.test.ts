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
      "/app",
    );
    expect(getLandingRouteForActor(getMockLocalActorContext("traveler.a@mymedlife.test"))).toBe(
      "/app",
    );
    expect(getLandingRouteForActor(getMockLocalActorContext("leader.a@mymedlife.test"))).toBe(
      "/leader?view=overview",
    );
    expect(getLandingRouteForActor(getMockLocalActorContext("vice.president@mymedlife.test"))).toBe(
      "/leader?view=overview",
    );
    expect(getLandingRouteForActor(getMockLocalActorContext("coach@mymedlife.test"))).toBe(
      "/staff?view=chapters",
    );
    expect(
      getLandingRouteForActor(getMockLocalActorContext("general.staff@mymedlife.test")),
    ).toBe("/staff?view=chapters");
    expect(getLandingRouteForActor(getMockLocalActorContext("sales.coach@mymedlife.test"))).toBe(
      "/staff?view=chapters",
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
      "/app",
    );
    expect(getLandingRouteForLocalActorEmail("leader.a@mymedlife.test")).toBe(
      "/leader?view=overview",
    );
    expect(getLandingRouteForLocalActorEmail("sales.coach@mymedlife.test")).toBe(
      "/staff?view=chapters",
    );
    expect(getLandingRouteForLocalActorEmail("general.staff@mymedlife.test")).toBe(
      "/staff?view=chapters",
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
    expect(appendLandingRouteSource("/app", "member_home")).toBe("/app?source=member_home");
  });
});
