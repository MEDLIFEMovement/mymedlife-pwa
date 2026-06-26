import type { LocalActorContext } from "@/services/local-actor-context";
import { getActorSurfaceFamily } from "@/services/role-visibility";

export function getActorPrimaryRoleLabel(actor: LocalActorContext): string {
  const explicitRoles = [...actor.chapterRoles, ...actor.staffRoles];

  if (explicitRoles.length > 0) {
    return explicitRoles.join(" / ");
  }

  switch (actor.primaryCanonicalRole) {
    case "student_member":
      return "General Member";
    case "traveler":
      return "Traveler";
    case "committee_member":
      return "Action Committee Member";
    case "committee_chair":
      return "Action Committee Chair";
    case "eboard_officer":
      return "E-Board Member";
    case "vice_president":
      return "Vice President";
    case "president":
      return "President / VP";
    case "coach":
      return "Coach";
    case "department_staff":
      return "Staff";
    case "sales_coach":
      return "Sales Coach";
    case "sales_admin":
      return "Sales Admin";
    case "ds_admin":
      return "DS Admin";
    case "super_admin":
      return "Super Admin";
  }
}

export function getActorSurfaceLabel(actor: LocalActorContext): string {
  const surfaceFamily = getActorSurfaceFamily(actor);

  switch (surfaceFamily) {
    case "member":
      return actor.primaryCanonicalRole === "traveler" ? "Traveler view" : "Member view";
    case "leader":
      return "Leader view";
    case "coach":
      return "Staff view";
    case "staff":
      return "Staff view";
    case "ds_admin":
      return "DS Admin view";
    case "super_admin":
      return "Super Admin view";
  }
}

export function getActorSurfaceNounLabel(actor: LocalActorContext): string {
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return actor.primaryCanonicalRole === "traveler" ? "Traveler" : "Member";
    case "leader":
      return "Leader";
    case "coach":
      return "Coach";
    case "staff":
      return "Staff";
    case "ds_admin":
      return "DS Admin";
    case "super_admin":
      return "Super Admin";
  }
}
