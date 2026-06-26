import { describe, expect, it } from "vitest";

import { normalizeLocalRoleSwitcherReturnTo } from "@/components/local-role-switcher/return-to";

describe("local role switcher returnTo", () => {
  it("accepts safe internal review destinations", () => {
    expect(normalizeLocalRoleSwitcherReturnTo("/leader?view=overview&source=member_home")).toBe(
      "/leader?view=overview&source=member_home",
    );
    expect(normalizeLocalRoleSwitcherReturnTo("/staff?view=chapters&source=member_home")).toBe(
      "/staff?view=chapters&source=member_home",
    );
    expect(normalizeLocalRoleSwitcherReturnTo("/staff?source=member_home")).toBe(
      "/staff?source=member_home",
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
