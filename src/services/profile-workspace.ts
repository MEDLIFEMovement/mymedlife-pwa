import { getActorPrimaryRoleLabel, getActorSurfaceLabel } from "@/services/actor-role-display";
import type { LocalActorContext } from "@/services/local-actor-context";
import { buildMemberActionRouteHref } from "@/services/member-action-route-href";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { getRoleNextActionBrief } from "@/services/role-next-actions";
import {
  getActorSurfaceFamily,
} from "@/services/role-visibility";
import type { IntegrationEvent } from "@/shared/types/domain";

export type ProfileScopeRow = {
  label: string;
  value: string;
  detail: string;
};

export type ProfileWorkspace = {
  title: string;
  summary: string;
  profileLabel: string;
  nextStep: {
    label: string;
    href: string;
    detail: string;
  };
  identityRows: ProfileScopeRow[];
  scopeRows: ProfileScopeRow[];
  futureStructuredEvents: IntegrationEvent[];
  safetyNotes: string[];
  counts: {
    chapterRoles: number;
    staffRoles: number;
    chapterScopes: number;
    coachPortfolioChapters: number;
    profileWritesExpected: 0;
    membershipWritesExpected: 0;
    roleWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

export function getProfileWorkspace(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): ProfileWorkspace {
  const nextAction = getRoleNextActionBrief(actor, data);

  return {
    title: getTitle(actor),
    summary:
      "Keep your role, chapter context, and next step easy to understand from one place.",
    profileLabel: getProfileLabel(actor),
    nextStep: {
      label: getProfileNextStepLabel(actor, nextAction.primaryLabel),
      href: getProfileNextStepHref(actor, nextAction.primaryHref),
      detail: nextAction.title,
    },
    identityRows: buildIdentityRows(actor),
    scopeRows: buildScopeRows(actor),
    futureStructuredEvents: buildFutureEvents(actor),
    safetyNotes: [
      "No profile save runs from this route.",
      "No join request, role approval, membership change, or coach assignment runs from this route.",
      "No HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI write runs from this route.",
      "Production profile and role truth must come from approved Supabase Auth, membership, RLS, and audit paths.",
    ],
    counts: {
      chapterRoles: actor.chapterRoles.length,
      staffRoles: actor.staffRoles.length,
      chapterScopes: actor.chapterNames.length,
      coachPortfolioChapters: actor.coachPortfolioChapterNames.length,
      profileWritesExpected: 0,
      membershipWritesExpected: 0,
      roleWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function buildIdentityRows(actor: LocalActorContext): ProfileScopeRow[] {
  return [
    {
      label: "Name",
      value: actor.user.displayName,
      detail: "How your name appears across myMEDLIFE.",
    },
    {
      label: "Email",
      value: actor.user.email,
      detail: "Email connected to this myMEDLIFE profile.",
    },
    {
      label: "Sign-in status",
      value: getIdentitySourceLabel(actor),
      detail: getIdentityStatusDetail(actor),
    },
    {
      label: "Primary role",
      value: getActorPrimaryRoleLabel(actor),
      detail: getPrimaryRoleDetail(actor),
    },
    {
      label: "Surface",
      value: getActorSurfaceLabel(actor),
      detail: getSurfaceDetail(actor),
    },
  ];
}

function buildScopeRows(actor: LocalActorContext): ProfileScopeRow[] {
  if (getActorSurfaceFamily(actor) === "ds_admin") {
    return [
      {
        label: "Systems scope",
        value: "Integration posture only",
        detail:
          "DS Admin can inspect disabled integration and outbox posture without owning student truth.",
      },
      {
        label: "Student data",
        value: "Hidden",
        detail: "Assignments, proof, points, KPIs, and chapter event truth stay app-owned.",
      },
    ];
  }

  const rows: ProfileScopeRow[] = [
    {
      label: "Chapter roles",
      value: actor.chapterRoles.length > 0 ? actor.chapterRoles.join(", ") : "None",
      detail:
        actor.chapterRoles.length > 0
          ? "Chapter-scoped roles decide what student and leader surfaces are visible."
          : "No chapter-scoped role is attached to this local actor.",
    },
    {
      label: "Staff roles",
      value: actor.staffRoles.length > 0 ? actor.staffRoles.join(", ") : "None",
      detail:
        actor.staffRoles.length > 0
          ? "Staff roles open coach, admin, or super-admin review surfaces."
          : "No staff role is attached to this local actor.",
    },
  ];

  if (actor.chapterNames.length > 0) {
    rows.push({
      label: "Chapter scope",
      value: actor.chapterNames.join(", "),
      detail: "Chapter-scoped data should remain limited to approved memberships.",
    });
  }

  if (actor.coachPortfolioChapterNames.length > 0) {
    rows.push({
      label: "Coach portfolio",
      value: actor.coachPortfolioChapterNames.join(", "),
      detail: "Coach visibility should stay limited to assigned portfolio chapters.",
    });
  }

  if (rows.length === 2) {
    rows.push({
      label: "Chapter scope",
      value: "No chapter",
      detail: "This actor uses staff or admin scope instead of chapter membership.",
    });
  }

  return rows;
}

function buildFutureEvents(actor: LocalActorContext): IntegrationEvent[] {
  return [
    {
      id: `${actor.user.id}-profile-viewed`,
      eventType: "profile_viewed",
      title: "Future profile viewed",
      destination: "internal",
      status: "disabled",
      detail:
        "A future production profile view can be audited after auth, privacy, and retention rules are approved.",
      occurredAt: "local-mock-time",
    },
    {
      id: `${actor.user.id}-profile-updated`,
      eventType: "profile_updated",
      title: "Future profile update",
      destination: "internal",
      status: "disabled",
      detail:
        "Display-name, contact, or preference changes must use an approved server-side profile write path.",
      occurredAt: "local-mock-time",
    },
    {
      id: `${actor.user.id}-membership-requested`,
      eventType: "membership_join_requested",
      title: "Future chapter join request",
      destination: "internal",
      status: "disabled",
      detail:
        "Future chapter join requests must create audit records and stay separate from direct role grants.",
      occurredAt: "local-mock-time",
    },
    {
      id: `${actor.user.id}-role-change-requested`,
      eventType: "role_change_requested",
      title: "Future role change requested",
      destination: "internal",
      status: "disabled",
      detail:
        "Future role changes require approved membership workflows and must not be self-granted from the browser.",
      occurredAt: "local-mock-time",
    },
  ];
}

function getTitle(actor: LocalActorContext): string {
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return "Your myMEDLIFE profile";
    case "leader":
      return "Leader profile and role scope";
    case "coach":
      return "Coach profile and portfolio scope";
    case "staff":
      return "Admin profile and support scope";
    case "ds_admin":
      return "DS Admin profile and integration scope";
    case "super_admin":
      return "Super Admin profile and oversight scope";
  }
}

function getProfileLabel(actor: LocalActorContext): string {
  return getActorPrimaryRoleLabel(actor);
}

function getProfileNextStepHref(actor: LocalActorContext, href: string) {
  if (getActorSurfaceFamily(actor) !== "member") {
    return href;
  }

  const match = href.match(/^\/rush-month\/actions\/([^/?#]+)/);

  if (!match) {
    return href;
  }

  return buildMemberActionRouteHref(match[1], { source: "profile" });
}

function getProfileNextStepLabel(actor: LocalActorContext, label: string) {
  if (getActorSurfaceFamily(actor) === "member" && label === "Open my action") {
    return "Start next action";
  }

  return label;
}

function getIdentitySourceLabel(actor: LocalActorContext): string {
  if (actor.identitySource === "local_auth_session") {
    return actor.authSessionStatus === "signed_in" ? "Signed in" : "Sign-in needs attention";
  }

  if (actor.identitySource === "local_preview_cookie") {
    return "Preview sign-in";
  }

  return "Preview profile";
}

function getIdentityStatusDetail(actor: LocalActorContext): string {
  if (actor.identitySource === "local_auth_session") {
    return actor.authSessionStatus === "signed_in"
      ? "Your signed-in session is active for this view."
      : "Your account is visible here, but live sign-in still needs follow-through.";
  }

  return "This preview keeps your chapter role and next steps visible in the current app flow.";
}

function getPrimaryRoleDetail(actor: LocalActorContext): string {
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return "Your role shapes the actions, events, and points you see first.";
    case "leader":
      return "Your role opens chapter planning, people, and follow-through views.";
    case "coach":
      return "Your role focuses this surface on chapter support and staff follow-through.";
    case "staff":
      return "Your role opens portfolio, review, and operations context across chapters.";
    case "ds_admin":
      return "Your role stays focused on systems posture, auditability, and integration safety.";
    case "super_admin":
      return "Your role can inspect cross-platform operations and backend configuration lanes.";
  }
}

function getSurfaceDetail(actor: LocalActorContext): string {
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return "Your home, campaigns, events, points, and profile all stay inside the member loop.";
    case "leader":
      return "Leadership views keep chapter health, members, events, and succession in one command center.";
    case "coach":
      return "Staff views stay centered on assigned chapters, risks, and support notes.";
    case "staff":
      return "Staff views stay centered on chapter oversight, proof review, and operational follow-through.";
    case "ds_admin":
      return "DS Admin views keep the focus on audit logs, system posture, and integration safety.";
    case "super_admin":
      return "Super Admin views connect backend controls, workflows, and oversight in one lane.";
  }
}
