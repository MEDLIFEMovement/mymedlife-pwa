import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("@/app/login/actions", () => ({
  signOut: async () => undefined,
}));

describe("workspace account menu", () => {
  it("shows identity, current workspace, available views, and logout for a student leader", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const html = renderToStaticMarkup(
      <WorkspaceAccountMenu actor={actor} currentWorkspace="leader_command_center" />,
    );

    expect(html).toContain("Priya President");
    expect(html).toContain("leader.a@mymedlife.test");
    expect(html).toContain("Role:");
    expect(html).toContain("Current workspace:");
    expect(html).toContain("Student Command Center");
    expect(html).toContain("General Student App");
    expect(html).toContain("Log out");
  });

  it("marks staff student and leader workspaces as preview views", () => {
    const actor = getMockLocalActorContext("sales.coach@mymedlife.test");
    const html = renderToStaticMarkup(
      <WorkspaceAccountMenu actor={actor} currentWorkspace="staff_command_center" />,
    );

    expect(html).toContain("Sky Sales Coach");
    expect(html).toContain("Staff Command Center");
    expect(html).toContain("General Student App");
    expect(html).toContain("Student Command Center");
    expect(html.match(/TEST Preview/g)?.length).toBe(2);
  });
});
