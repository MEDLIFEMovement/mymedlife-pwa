import { describe, expect, it } from "vitest";
import { getAdminGlossary } from "@/services/admin-glossary";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("admin glossary", () => {
  it("gives admin roles plain-English review definitions", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const glossary = getAdminGlossary(actor);

    expect(glossary.canReadGlossary).toBe(true);
    expect(glossary.terms).toHaveLength(8);
    expect(glossary.terms.map((item) => item.term)).toEqual(
      expect.arrayContaining([
        "Local actor",
        "Mock data",
        "Browser write",
        "External send",
        "Outbox",
        "Proof",
        "RLS",
        "Stakeholder review",
      ]),
    );
  });

  it("keeps DS Admin and Super Admin eligible for glossary review", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const superAdmin = getMockLocalActorContext("super.admin@mymedlife.test");

    expect(getAdminGlossary(dsAdmin).canReadGlossary).toBe(true);
    expect(getAdminGlossary(superAdmin).canReadGlossary).toBe(true);
  });

  it("hides the glossary from operating roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getAdminGlossary(member).canReadGlossary).toBe(false);
    expect(getAdminGlossary(leader).canReadGlossary).toBe(false);
    expect(getAdminGlossary(coach).canReadGlossary).toBe(false);
  });
});
