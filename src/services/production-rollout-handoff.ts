import {
  getProductionRolloutBootstrapReadiness,
  type ProductionRolloutBootstrapPacket,
  type ProductionRolloutBootstrapReadiness,
} from "@/services/production-rollout-bootstrap";

export type ProductionRolloutHandoff = {
  ready: boolean;
  title: string;
  summary: string;
  sections: Array<{
    title: string;
    items: string[];
  }>;
};

export function getProductionRolloutHandoff(
  packet: ProductionRolloutBootstrapPacket,
): ProductionRolloutHandoff {
  const readiness = getProductionRolloutBootstrapReadiness(packet);
  const activeChapters = packet.chapters.filter(
    (chapter) => (chapter.status ?? "active") === "active",
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
  const approvedMemberships = packet.memberships.filter(
    (membership) => (membership.status ?? "approved") === "approved",
  );

  return {
    ready: readiness.ready,
    title: readiness.ready
      ? "Production rollout handoff: READY FOR HUMAN APPLY"
      : "Production rollout handoff: NOT READY",
    summary: readiness.ready
      ? [
          `${activeChapters.length} chapters are ready for the first production data apply.`,
          "This report is a review handoff only; it does not create users, write rows, or send invitations.",
        ].join(" ")
      : "Fix the readiness blockers before creating production users or app data.",
    sections: [
      createReadinessSection(readiness),
      {
        title: "Supabase Auth users to create",
        items: packet.users.map(
          (user) => `${user.email} - ${user.displayName}`,
        ),
      },
      {
        title: "Chapter rows to create",
        items: activeChapters.map(
          (chapter) =>
            `${chapter.id} - ${chapter.name} (${chapter.campus}${chapter.region ? `, ${chapter.region}` : ""})`,
        ),
      },
      {
        title: "Approved memberships to create",
        items: approvedMemberships.map(
          (membership) =>
            `${membership.email} -> ${membership.chapterId} as ${membership.roleKey}`,
        ),
      },
      {
        title: "Staff roles to create",
        items: activeStaffRoles.map((role) => `${role.email} -> ${role.roleKey}`),
      },
      {
        title: "Coach assignments to create",
        items: activeCoachAssignments.map(
          (assignment) =>
            `${assignment.coachEmail} -> ${assignment.chapterId} (${assignment.coachType})`,
        ),
      },
      {
        title: "Launch campaigns to create",
        items: activeCampaigns.map(
          (campaign) =>
            `${campaign.chapterId} -> ${campaign.name} (${campaign.slug})`,
        ),
      },
      {
        title: "Safety rules",
        items: [
          "Do not include passwords, API keys, tokens, or secrets in the packet.",
          "Create Auth users through the approved production Supabase path only.",
          "Keep HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI writes disabled during this apply.",
          "Run signed-in route checks for /app, /leader, and /staff before inviting all chapters.",
        ],
      },
    ],
  };
}

export function formatProductionRolloutHandoff(
  handoff: ProductionRolloutHandoff,
): string {
  const lines = [handoff.title, "", handoff.summary];

  for (const section of handoff.sections) {
    lines.push("", section.title + ":");

    if (section.items.length === 0) {
      lines.push("- None");
      continue;
    }

    lines.push(...section.items.map((item) => `- ${item}`));
  }

  return lines.join("\n");
}

function createReadinessSection(readiness: ProductionRolloutBootstrapReadiness) {
  const statusItems = [
    `active chapters: ${readiness.counts.activeChapters}`,
    `users: ${readiness.counts.users}`,
    `approved memberships: ${readiness.counts.approvedMemberships}`,
    `active staff roles: ${readiness.counts.activeStaffRoles}`,
    `active coach assignments: ${readiness.counts.activeCoachAssignments}`,
    `active campaigns: ${readiness.counts.activeCampaigns}`,
  ];

  return {
    title: "Readiness result",
    items: [
      readiness.ready ? "ready: yes" : "ready: no",
      ...statusItems,
      ...readiness.blockers.map((blocker) => `blocker: ${blocker}`),
      ...readiness.warnings.map((warning) => `warning: ${warning}`),
      ...readiness.nextSteps.map((nextStep) => `next step: ${nextStep}`),
    ],
  };
}
