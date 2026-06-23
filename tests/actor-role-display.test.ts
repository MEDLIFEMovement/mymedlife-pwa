import { describe, expect, it } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getActorPrimaryRoleLabel,
  getActorSurfaceLabel,
  getActorSurfaceNounLabel,
} from "@/services/actor-role-display";

describe("actor role display helpers", () => {
  it("keeps traveler labels distinct from the standard member surface", () => {
    const traveler = getMockLocalActorContext("traveler.a@mymedlife.test");

    expect(getActorPrimaryRoleLabel(traveler)).toBe("General Member");
    expect(getActorSurfaceLabel(traveler)).toBe("Traveler view");
    expect(getActorSurfaceNounLabel(traveler)).toBe("Traveler");
  });

  it("surfaces the explicit local role label when one exists", () => {
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const salesCoach = getMockLocalActorContext("sales.coach@mymedlife.test");

    expect(getActorPrimaryRoleLabel(leader)).toBe("President / VP");
    expect(getActorSurfaceLabel(leader)).toBe("Leader view");
    expect(getActorPrimaryRoleLabel(salesCoach)).toBe("Sales Coach");
    expect(getActorSurfaceNounLabel(salesCoach)).toBe("Coach");
  });
});
