import { describe, expect, it } from "vitest";

import { normalizeLocalRoleSwitcherReturnTo } from "@/components/local-role-switcher/return-to";

describe("local role switcher returnTo", () => {
  it("accepts safe internal review destinations", () => {
    expect(normalizeLocalRoleSwitcherReturnTo("/chapter?view=overview&source=member_home")).toBe(
      "/chapter?view=overview&source=member_home",
    );
    expect(normalizeLocalRoleSwitcherReturnTo("/coach?view=chapters&source=member_home")).toBe(
      "/coach?view=chapters&source=member_home",
    );
    expect(normalizeLocalRoleSwitcherReturnTo("/staff?view=admin&source=member_home")).toBe(
      "/staff?view=admin&source=member_home",
    );
  });

  it("rejects unsafe or malformed destinations", () => {
    expect(normalizeLocalRoleSwitcherReturnTo(null)).toBeNull();
    expect(normalizeLocalRoleSwitcherReturnTo("chapter")).toBeNull();
    expect(normalizeLocalRoleSwitcherReturnTo("//staff")).toBeNull();
    expect(normalizeLocalRoleSwitcherReturnTo("/staff\n/admin")).toBeNull();
  });
});
