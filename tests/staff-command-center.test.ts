import { describe, expect, it } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaffCommandCenter } from "@/services/staff-command-center";

describe("staff command center", () => {
  const data = getMockReadOnlyAppData("Mock staff review");

  it("allows coach, admin, and super admin to read the staff surface", () => {
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const superAdmin = getMockLocalActorContext("super.admin@mymedlife.test");

    expect(getStaffCommandCenter(coach, data).canReadCommandCenter).toBe(true);
    expect(getStaffCommandCenter(admin, data).canReadCommandCenter).toBe(true);
    expect(getStaffCommandCenter(superAdmin, data).canReadCommandCenter).toBe(true);
    expect(getStaffCommandCenter(admin, data).viewOptions.map((item) => item.label)).toContain(
      "Admin",
    );
  });

  it("keeps the route hidden from member-facing roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");

    expect(getStaffCommandCenter(member, data).canReadCommandCenter).toBe(false);
    expect(getStaffCommandCenter(leader, data).canReadCommandCenter).toBe(false);
  });

  it("filters portfolio rows by risk and search query", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const highRisk = getStaffCommandCenter(admin, data, { risk: "high" });
    const riverside = getStaffCommandCenter(admin, data, {
      query: "Riverside",
      view: "chapters",
    });

    expect(highRisk.chapterRows).toHaveLength(2);
    expect(highRisk.chapterRows.map((row) => row.chapterName)).toContain(
      "Riverside State MEDLIFE",
    );
    expect(highRisk.chapterRows.map((row) => row.chapterName)).toContain(
      "UCLA MEDLIFE",
    );
    expect(riverside.chapterRows).toHaveLength(1);
    expect(riverside.chapterRows[0]?.chapterName).toBe("Riverside State MEDLIFE");
  });

  it("selects the chapter drawer from the route state", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      chapterId: "chapter-lakeside",
      view: "chapters",
    });

    expect(commandCenter.selectedChapter?.chapterName).toBe(
      "Lakeside University MEDLIFE",
    );
    expect(commandCenter.selectedChapter?.quickLinks.map((item) => item.href)).toContain(
      "/coach",
    );
  });

  it("builds proof, hubspot, and outbox summaries from the mock-safe data model", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "proof_ugc",
    });

    expect(
      commandCenter.proofReviewItems.some(
        (item) => item.consentStatusLabel === "Consent check needed",
      ),
    ).toBe(true);
    expect(commandCenter.hubspotSignals.some((item) => item.title.includes("HubSpot"))).toBe(
      true,
    );
    expect(commandCenter.outboxSummary).toMatchObject({
      total: 3,
      disabled: 1,
      mocked: 2,
      hubspot: 1,
      luma: 1,
      n8n: 1,
      warehouse: 0,
    });
  });

  it("preserves the detailed outbox boundary for non-ds staff roles", () => {
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const superAdmin = getMockLocalActorContext("super.admin@mymedlife.test");

    expect(getStaffCommandCenter(coach, data).canReadDetailedOutbox).toBe(false);
    expect(getStaffCommandCenter(admin, data).canReadDetailedOutbox).toBe(false);
    expect(getStaffCommandCenter(superAdmin, data).canReadDetailedOutbox).toBe(true);
  });
});
