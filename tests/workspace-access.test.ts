import { describe, expect, it } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  canAccessWorkspace,
  getAllowedWorkspaces,
  getDefaultWorkspace,
  getWorkspaceHref,
  isPreviewWorkspaceAccess,
  isStaffUser,
  isStudentLeader,
} from "@/services/workspace-access";

describe("workspace access", () => {
  it("keeps general members in the student app by default", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");

    expect(getDefaultWorkspace(actor)).toBe("student_app");
    expect(getAllowedWorkspaces(actor).map((workspace) => workspace.key)).toEqual([
      "student_app",
    ]);
    expect(canAccessWorkspace(actor, "student_app")).toBe(true);
    expect(canAccessWorkspace(actor, "leader_command_center")).toBe(false);
  });

  it("keeps action committee members in the student app by default", () => {
    const actor = getMockLocalActorContext("committee.member@mymedlife.test");

    expect(getDefaultWorkspace(actor)).toBe("student_app");
    expect(isStudentLeader(actor)).toBe(false);
    expect(getAllowedWorkspaces(actor).map((workspace) => workspace.key)).toEqual([
      "student_app",
    ]);
  });

  it("lets student leaders switch between leader and student workspaces", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");

    expect(getDefaultWorkspace(actor)).toBe("leader_command_center");
    expect(isStudentLeader(actor)).toBe(true);
    expect(getAllowedWorkspaces(actor).map((workspace) => workspace.key)).toEqual([
      "student_app",
      "leader_command_center",
    ]);
    expect(canAccessWorkspace(actor, "student_app", { intent: "switch" })).toBe(true);
    expect(canAccessWorkspace(actor, "leader_command_center", { intent: "switch" })).toBe(true);
    expect(canAccessWorkspace(actor, "admin_backend")).toBe(false);
  });

  it("recognizes the richer chapter leader role names from the product model", () => {
    const president = {
      roleKeys: ["chapter_president"],
    };
    const proofDirector = {
      roleKeys: ["chapter_marketing_proof_director"],
    };

    expect(isStudentLeader(president)).toBe(true);
    expect(getDefaultWorkspace(president)).toBe("leader_command_center");
    expect(getAllowedWorkspaces(proofDirector).map((workspace) => workspace.key)).toEqual([
      "student_app",
      "leader_command_center",
    ]);
  });

  it("gives staff a staff default and read-only previews of student surfaces", () => {
    const actor = getMockLocalActorContext("sales.coach@mymedlife.test");

    expect(isStaffUser(actor)).toBe(true);
    expect(getDefaultWorkspace(actor)).toBe("staff_command_center");
    expect(getAllowedWorkspaces(actor).map((workspace) => workspace.key)).toEqual([
      "student_app",
      "leader_command_center",
      "staff_command_center",
    ]);
    expect(isPreviewWorkspaceAccess(actor, "student_app")).toBe(true);
    expect(isPreviewWorkspaceAccess(actor, "leader_command_center")).toBe(true);
    expect(canAccessWorkspace(actor, "student_app", { intent: "read" })).toBe(true);
    expect(canAccessWorkspace(actor, "student_app", { intent: "submit" })).toBe(false);
    expect(canAccessWorkspace(actor, "leader_command_center", { intent: "approve" })).toBe(false);
  });

  it("keeps DS and Super Admin defaulted to the backend with preview-only student views", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const superAdmin = getMockLocalActorContext("super.admin@mymedlife.test");

    expect(getDefaultWorkspace(dsAdmin)).toBe("admin_backend");
    expect(getDefaultWorkspace(superAdmin)).toBe("admin_backend");
    expect(getAllowedWorkspaces(dsAdmin).map((workspace) => workspace.key)).toEqual([
      "student_app",
      "leader_command_center",
      "admin_backend",
    ]);
    expect(getAllowedWorkspaces(superAdmin).map((workspace) => workspace.key)).toEqual([
      "student_app",
      "leader_command_center",
      "staff_command_center",
      "admin_backend",
    ]);
    expect(canAccessWorkspace(dsAdmin, "admin_backend")).toBe(true);
    expect(canAccessWorkspace(dsAdmin, "staff_command_center")).toBe(false);
    expect(canAccessWorkspace(superAdmin, "staff_command_center")).toBe(true);
    expect(canAccessWorkspace(superAdmin, "leader_command_center", { intent: "message" })).toBe(false);
  });

  it("adds SLT Prep as an available workspace without stealing the student default", () => {
    const actor = getMockLocalActorContext("traveler.a@mymedlife.test");

    expect(getDefaultWorkspace(actor)).toBe("student_app");
    expect(getAllowedWorkspaces(actor).map((workspace) => workspace.key)).toEqual([
      "student_app",
      "slt_prep",
    ]);
    expect(getWorkspaceHref("slt_prep")).toBe("/app/slt-prep");
  });
});
