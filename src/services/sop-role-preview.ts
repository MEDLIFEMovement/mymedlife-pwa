import { buildLocalPreviewHref } from "@/services/local-preview-route";
import type { SopRole } from "@/shared/types/sop-builder";

export function getLocalPreviewEmailForSopRole(role: SopRole) {
  switch (role) {
    case "student_member":
      return "member.a@mymedlife.test";
    case "traveler":
      return "traveler.a@mymedlife.test";
    case "committee_member":
      return "committee.member@mymedlife.test";
    case "committee_chair":
      return "committee.chair@mymedlife.test";
    case "eboard_officer":
      return "eboard.a@mymedlife.test";
    case "vice_president":
      return "vice.president@mymedlife.test";
    case "president":
      return "leader.a@mymedlife.test";
    case "coach":
      return "coach@mymedlife.test";
    case "sales_coach":
      return "sales.coach@mymedlife.test";
    case "department_staff":
      return "admin@mymedlife.test";
    case "sales_admin":
      return "sales.admin@mymedlife.test";
    case "ds_admin":
      return "ds.admin@mymedlife.test";
    case "super_admin":
      return "super.admin@mymedlife.test";
  }
}

export function getSopRolePreviewLabel(role: SopRole) {
  return role.replaceAll("_", " ");
}

export function buildSopRolePreviewHref(role: SopRole, returnTo: string) {
  return buildLocalPreviewHref(getLocalPreviewEmailForSopRole(role), returnTo);
}
