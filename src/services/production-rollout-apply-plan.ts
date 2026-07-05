import {
  getProductionRolloutBootstrapReadiness,
  type ProductionBootstrapPilotEventProof,
  type ProductionRolloutBootstrapPacket,
} from "@/services/production-rollout-bootstrap";

export type ProductionRolloutApplyPlanSection = {
  title: string;
  status: "ready" | "blocked" | "review" | "manual";
  items: string[];
};

export type ProductionRolloutApplyPlan = {
  ready: boolean;
  title: string;
  summary: string;
  sections: ProductionRolloutApplyPlanSection[];
};

export function getProductionRolloutApplyPlan(
  packet: ProductionRolloutBootstrapPacket,
): ProductionRolloutApplyPlan {
  const readiness = getProductionRolloutBootstrapReadiness(packet);
  const activeChapters = packet.chapters.filter(
    (chapter) => (chapter.status ?? "active") === "active",
  );
  const approvedMemberships = packet.memberships.filter(
    (membership) => (membership.status ?? "approved") === "approved",
  );
  const activeStaffRoles = packet.staffRoles.filter(
    (role) => (role.status ?? "active") === "active",
  );
  const activeCoachAssignments = packet.coachAssignments.filter(
    (assignment) => (assignment.status ?? "active") === "active",
  );
  const activeCampaigns = packet.campaigns.filter(
    (campaign) => (campaign.status ?? "active") === "active",
  );
  const linkedLumaCalendars = (packet.lumaCalendars ?? []).filter(
    (calendar) => (calendar.status ?? "linked") === "linked",
  );
  const activeLaunchOwners = (packet.launchOwners ?? []).filter(
    (owner) => (owner.status ?? "active") === "active",
  );
  const readyPilotProof = (packet.pilotEventProof ?? []).filter(
    (proof) => (proof.status ?? "ready") === "ready",
  );
  const routeProof = packet.signedInRouteProof ?? [];

  return {
    ready: readiness.ready,
    title: readiness.ready
      ? "Production apply plan: READY FOR HUMAN APPLY REVIEW"
      : "Production apply plan: NOT READY",
    summary: readiness.ready
      ? [
          "This is a review-only production apply plan.",
          "It does not create Supabase Auth users, write database rows, send invitations, or turn on integrations.",
          "Use it to review the exact apply order and owner-owned decisions before production data is written.",
        ].join(" ")
      : "Fix the packet blockers before creating production users or app data.",
    sections: [
      {
        title: "Readiness snapshot",
        status: readiness.ready ? "ready" : "blocked",
        items: [
          `active chapters: ${readiness.counts.activeChapters}`,
          `approved student/leader users: ${readiness.counts.approvedStudentMemberships}`,
          `active coach assignments: ${readiness.counts.activeCoachAssignments}`,
          `linked Luma calendars: ${readiness.counts.linkedLumaCalendars}`,
          `ready pilot event-loop chapters: ${readiness.counts.readyPilotEventProofChapters}`,
          `active launch owners: ${readiness.counts.activeLaunchOwners}`,
          ...readiness.blockers.map((blocker) => `blocker: ${blocker}`),
          ...readiness.warnings.map((warning) => `warning: ${warning}`),
        ],
      },
      {
        title: "Apply sequence",
        status: readiness.ready ? "review" : "blocked",
        items: [
          "1. Re-run rollout:check against the final packet.",
          "2. Create Supabase Auth users through the approved production invite/admin path.",
          "3. Read back Auth users by email and confirm each has a production auth user id.",
          "4. Upsert app.profiles using auth.users.id as app.profiles.id.",
          "5. Create chapter rows and record the packet chapter handle to production chapter UUID map.",
          "6. Create memberships, staff roles, coach assignments, campaigns, and Luma calendar mappings using the resolved UUID map.",
          "7. Run signed-in route proof for one member, one leader, one staff user, one admin, and member/leader access for each ready pilot chapter.",
          "8. Complete five-chapter Luma RSVP, attendance, points, audit, and zero-send proof before broad invitations.",
          "9. Run production:invite-gate before inviting the full 30-chapter cohort.",
        ],
      },
      {
        title: "Supabase Auth users to invite",
        status: readiness.ready ? "ready" : "blocked",
        items: packet.users.map(
          (user) =>
            `${normalizeEmail(user.email)} - ${user.displayName}; password: not in packet; auth id: resolve after invite`,
        ),
      },
      {
        title: "App profiles to upsert after Auth users exist",
        status: readiness.ready ? "manual" : "blocked",
        items: packet.users.map(
          (user) =>
            `${normalizeEmail(user.email)} -> app.profiles(id = auth.users.id, display_name = ${user.displayName}, status = active)`,
        ),
      },
      {
        title: "Chapter rows and UUID map",
        status: readiness.ready ? "manual" : "blocked",
        items: activeChapters.map(
          (chapter) =>
            `${chapter.id} -> app.chapters UUID to be created/resolved; name = ${chapter.name}; campus = ${chapter.campus}${chapter.region ? `; region = ${chapter.region}` : ""}`,
        ),
      },
      {
        title: "Approved memberships to create",
        status: readiness.ready ? "manual" : "blocked",
        items: approvedMemberships.map(
          (membership) =>
            `${normalizeEmail(membership.email)} -> ${membership.chapterId} as ${membership.roleKey}; requires email -> profile UUID and chapter handle -> chapter UUID`,
        ),
      },
      {
        title: "Staff roles to create",
        status: readiness.ready ? "manual" : "blocked",
        items: activeStaffRoles.map(
          (role) =>
            `${normalizeEmail(role.email)} -> ${role.roleKey}; requires email -> profile UUID`,
        ),
      },
      {
        title: "Coach assignments to create",
        status: readiness.ready ? "manual" : "blocked",
        items: activeCoachAssignments.map(
          (assignment) =>
            `${normalizeEmail(assignment.coachEmail)} -> ${assignment.chapterId} (${assignment.coachType}); requires coach profile UUID, chapter UUID, and starts_at = approved apply date`,
        ),
      },
      {
        title: "Launch campaigns to create",
        status: readiness.ready ? "manual" : "blocked",
        items: activeCampaigns.map(
          (campaign) =>
            `${campaign.chapterId} -> ${campaign.name} (${campaign.slug}); objective = launch Luma events, RSVP, attendance, points, and leaderboard loop unless owner changes it before apply`,
        ),
      },
      {
        title: "Luma calendar mappings to apply",
        status: readiness.ready ? "manual" : "blocked",
        items: linkedLumaCalendars.map(
          (calendar) =>
            `${calendar.chapterId} -> ${calendar.calendarId}${calendar.calendarName ? ` (${calendar.calendarName})` : ""}; target chapter_luma_calendars when production table exists, otherwise approved MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON registry`,
        ),
      },
      {
        title: "Pilot event-loop proof to review",
        status: readyPilotProof.length > 0 ? "review" : "blocked",
        items: readyPilotProof.map(
          (proof) =>
            `${proof.chapterId} -> ${proof.eventName} (${proof.lumaEventId}); RSVPs ${proof.rsvpCount}, attendance ${proof.attendanceCount}, points ${proof.pointsAwardedCount}, audit ${proof.auditEvidence}, outbox ${proof.outboxStatus}; routes ${formatPilotProofRoutes(proof)}; reviewed by ${proof.reviewedByEmail ?? "pending"}${proof.checkedAt ? ` at ${proof.checkedAt}` : ""}`,
        ),
      },
      {
        title: "Signed-in route proof to complete after apply",
        status: routeProof.some((proof) => proof.status === "passed") ? "review" : "manual",
        items:
          routeProof.length > 0
            ? routeProof.map(
                (proof) =>
                  `${normalizeEmail(proof.email)} -> ${proof.workspace}; expected ${proof.expectedPath}; observed ${proof.observedPath || "pending"}; status ${proof.status ?? "not_checked"}`,
              )
            : [
                "Add one passed real member proof for /app.",
                "Add one passed real chapter leader proof for /leader?view=overview.",
                "Add one passed real staff/coach proof for /staff?view=chapters.",
                "Add one passed real DS Admin or Super Admin proof for /admin.",
              ],
      },
      {
        title: "Launch owners to confirm",
        status: activeLaunchOwners.length > 0 ? "review" : "blocked",
        items: activeLaunchOwners.map(
          (owner) =>
            `${owner.ownerType} -> ${normalizeEmail(owner.email)}${owner.displayName ? ` (${owner.displayName})` : ""}`,
        ),
      },
      {
        title: "Safety rules that stay blocked",
        status: "manual",
        items: [
          "Do not include passwords, API keys, bearer tokens, refresh tokens, private keys, or webhook secrets in the packet or plan.",
          "Do not send HubSpot, n8n, warehouse, Power BI, SMS, email, or AI writes during this production apply.",
          "Do not invite the broad 30-chapter cohort until signed-in route proof and the five-chapter event-loop proof pass.",
          "Do not treat packet chapter handles as database UUIDs unless they are changed to real UUID values by the approved apply owner.",
          "Do not mark production rollout complete until production:invite-gate returns READY against the final packet and public URL.",
        ],
      },
      {
        title: "Rollback checklist",
        status: "manual",
        items: [
          "Pause or cancel new Auth invitations through the approved Supabase production owner.",
          "Deactivate launch memberships, staff roles, and coach assignments instead of deleting audit-relevant rows.",
          "Disable Luma event writes and RSVP/check-in writes if event-loop proof shows incorrect behavior.",
          "Keep audit rows and outbox evidence for the rollback review.",
          "Re-run production smoke and invite-gate checks after rollback.",
        ],
      },
    ],
  };
}

export function formatProductionRolloutApplyPlan(
  plan: ProductionRolloutApplyPlan,
): string {
  const lines = [plan.title, "", plan.summary];

  for (const section of plan.sections) {
    lines.push("", `${section.title} (${section.status}):`);

    if (section.items.length === 0) {
      lines.push("- None");
      continue;
    }

    lines.push(...section.items.map((item) => `- ${item}`));
  }

  return lines.join("\n");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function formatPilotProofRoutes(proof: ProductionBootstrapPilotEventProof) {
  return [
    `event ${proof.eventRoute ?? "pending"}`,
    `attendance ${proof.attendanceRoute ?? "pending"}`,
    `points ${proof.pointsRoute ?? "pending"}`,
    `audit ${proof.auditRoute ?? "pending"}`,
    `outbox ${proof.outboxRoute ?? "pending"}`,
  ].join(", ");
}
