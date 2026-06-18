import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getProfileWorkspace } from "@/services/profile-workspace";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing profile workspace.");

describe("profile workspace", () => {
  it("shows members their local profile, chapter scope, and next action", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getProfileWorkspace(actor, data);

    expect(workspace.title).toBe("Your myMEDLIFE profile");
    expect(workspace.profileLabel).toBe("General Member");
    expect(workspace.nextStep.href).toBe("/rush-month/actions/member-push");
    expect(workspace.identityRows.map((row) => row.label)).toEqual([
      "Name",
      "Email",
      "Identity source",
      "Audience",
    ]);
    expect(workspace.scopeRows.find((row) => row.label === "Chapter scope")?.value).toBe(
      "UCLA MEDLIFE",
    );
    expect(workspace.counts.profileWritesExpected).toBe(0);
    expect(workspace.counts.roleWritesExpected).toBe(0);
    expect(workspace.counts.externalWritesExpected).toBe(0);
  });

  it("shows coach portfolio scope without enabling coach assignment writes", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const workspace = getProfileWorkspace(actor, data);

    expect(workspace.title).toBe("Coach profile and portfolio scope");
    expect(workspace.profileLabel).toBe("Coach");
    expect(
      workspace.scopeRows.find((row) => row.label === "Coach portfolio")?.value,
    ).toBe("UCLA MEDLIFE");
    expect(workspace.nextStep.href).toBe("/coach");
    expect(workspace.counts.coachPortfolioChapters).toBe(1);
    expect(workspace.counts.membershipWritesExpected).toBe(0);
  });

  it("keeps DS Admin scoped to integration posture rather than student truth", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getProfileWorkspace(actor, data);

    expect(workspace.title).toBe("DS Admin profile and integration scope");
    expect(workspace.profileLabel).toBe("DS Admin");
    expect(workspace.scopeRows.map((row) => row.value)).toContain(
      "Integration posture only",
    );
    expect(workspace.scopeRows.map((row) => row.value)).toContain("Hidden");
    expect(workspace.nextStep.href).toBe("/admin");
    expect(workspace.counts.chapterRoles).toBe(0);
  });

  it("names future profile events without enabling profile writes", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const workspace = getProfileWorkspace(actor, data);

    expect(workspace.futureStructuredEvents.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "profile_viewed",
        "profile_updated",
        "membership_join_requested",
        "role_change_requested",
      ]),
    );
    expect(
      workspace.futureStructuredEvents.every((event) => event.status === "disabled"),
    ).toBe(true);
    expect(workspace.safetyNotes.join(" ")).toContain("No profile save");
  });
});
