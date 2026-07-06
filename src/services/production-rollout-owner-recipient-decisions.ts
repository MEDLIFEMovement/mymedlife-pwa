import type {
  ProductionRolloutOwnerPacketStatus,
} from "./production-rollout-owner-packet-status.ts";
import type {
  ProductionRolloutOwnerRecipientStatus,
} from "./production-rollout-owner-recipient-status.ts";
import type {
  ProductionRolloutOwnerRecipientAssignment,
} from "./production-rollout-owner-send-tracker.ts";

export type ProductionRolloutOwnerRecipientDecisionRow = {
  ownerSlug: string;
  owner: string;
  recipientEmail: string;
  ccEmails: string;
  suggestedAccountableSeat: string;
  whyThisOwnerMatters: string;
  filesOwned: string[];
  folderStatus: string;
  requiredDecision: string;
};

export type ProductionRolloutOwnerRecipientDecisionWorksheet = {
  ready: boolean;
  summary: {
    ownerCount: number;
    assignedOwnerCount: number;
    missingRecipientCount: number;
    issueCount: number;
  };
  rows: ProductionRolloutOwnerRecipientDecisionRow[];
  assignmentIssues: string[];
};

export function parseProductionRolloutOwnerRecipientAnswerBlock(
  content: string,
): ProductionRolloutOwnerRecipientAssignment[] {
  const assignments: ProductionRolloutOwnerRecipientAssignment[] = [];
  const seenOwnerSlugs = new Set<string>();

  for (const [index, rawLine] of content.split(/\r?\n/).entries()) {
    const line = rawLine.trim();

    if (
      !line ||
      line.startsWith("```") ||
      line.startsWith("#") ||
      !line.includes("|") ||
      !line.includes("recipientEmail=")
    ) {
      continue;
    }

    const [ownerSlugPart, ...fieldParts] = line
      .split("|")
      .map((part) => part.trim());
    const ownerSlug = ownerSlugPart ?? "";

    if (!ownerSlug) {
      throw new Error(`Owner recipient answer row ${index + 1} is missing ownerSlug.`);
    }

    if (seenOwnerSlugs.has(ownerSlug)) {
      throw new Error(
        `Owner recipient answer block has duplicate ownerSlug ${ownerSlug}.`,
      );
    }

    seenOwnerSlugs.add(ownerSlug);

    const values: Record<string, string> = {};

    for (const fieldPart of fieldParts) {
      if (!fieldPart) {
        continue;
      }

      const equalsIndex = fieldPart.indexOf("=");

      if (equalsIndex === -1) {
        throw new Error(
          `Owner recipient answer row ${index + 1} has malformed field ${fieldPart}.`,
        );
      }

      const key = fieldPart.slice(0, equalsIndex).trim();
      const value = fieldPart.slice(equalsIndex + 1).trim();

      if (key === "recipientEmail" || key === "ccEmails" || key === "notes") {
        values[key] = value;
      }
    }

    assignments.push({
      ownerSlug,
      owner: "",
      recipientEmail: values.recipientEmail ?? "",
      ccEmails: values.ccEmails ?? "",
      notes: values.notes ?? "",
    });
  }

  if (assignments.length === 0) {
    throw new Error("No owner recipient answer rows found.");
  }

  return assignments;
}

const recipientDecisionGuidance: Record<
  string,
  { suggestedAccountableSeat: string; whyThisOwnerMatters: string }
> = {
  "nick-hq-launch-owner": {
    suggestedAccountableSeat: "Nick or named HQ launch operator",
    whyThisOwnerMatters:
      "Approves the 30 launch chapters and names support, rollback, and production apply owners.",
  },
  "ds-launch-owner": {
    suggestedAccountableSeat: "DS / platform owner",
    whyThisOwnerMatters:
      "Owns production users, staff roles, and post-apply signed-in route proof.",
  },
  "chapter-launch-owners": {
    suggestedAccountableSeat: "Chapter operations lead",
    whyThisOwnerMatters:
      "Owns the student and student-leader roster that determines who can enter each chapter workspace.",
  },
  "sales-coaching-lead": {
    suggestedAccountableSeat: "Sales or coaching lead",
    whyThisOwnerMatters:
      "Owns coach coverage so every launch chapter has a support path.",
  },
  "campaign-launch-owner": {
    suggestedAccountableSeat: "Campaign operations lead",
    whyThisOwnerMatters:
      "Owns the launch campaign rows that power the event, RSVP, attendance, points, and leaderboard loop.",
  },
  "luma-ds-owner": {
    suggestedAccountableSeat: "Luma / DS owner",
    whyThisOwnerMatters:
      "Owns the chapter-to-Luma calendar mapping that keeps events tied to the correct source.",
  },
  "launch-owner-ds": {
    suggestedAccountableSeat: "Launch owner plus DS reviewer",
    whyThisOwnerMatters:
      "Owns the five-chapter event-loop proof before the broader invite gate can open.",
  },
};

export function getProductionRolloutOwnerRecipientDecisionWorksheet({
  status,
  recipientStatus,
}: {
  status: ProductionRolloutOwnerPacketStatus;
  recipientStatus: ProductionRolloutOwnerRecipientStatus;
}): ProductionRolloutOwnerRecipientDecisionWorksheet {
  const recipientByOwnerSlug = new Map(
    recipientStatus.rows.map((row) => [row.ownerSlug, row]),
  );
  const rows = status.owners.map((owner) => {
    const recipient = recipientByOwnerSlug.get(owner.ownerSlug);
    const guidance = recipientDecisionGuidance[owner.ownerSlug] ?? {
      suggestedAccountableSeat: "Named launch owner",
      whyThisOwnerMatters:
        "Owns launch rows required before the 30-chapter invite gate can open.",
    };

    return {
      ownerSlug: owner.ownerSlug,
      owner: owner.owner,
      recipientEmail: recipient?.recipientEmail ?? "",
      ccEmails: recipient?.ccEmails ?? "",
      suggestedAccountableSeat: guidance.suggestedAccountableSeat,
      whyThisOwnerMatters: guidance.whyThisOwnerMatters,
      filesOwned: owner.files.map((file) => file.filename),
      folderStatus: owner.ready
        ? "READY"
        : `NOT READY (${owner.blockers.length} blocker(s))`,
      requiredDecision: recipient?.ready
        ? "Confirm this recipient should receive the owner packet."
        : "Choose one accountable person and add their email to recipientEmail.",
    };
  });

  return {
    ready: recipientStatus.readyForOwnerPacketSend,
    summary: {
      ownerCount: recipientStatus.summary.ownerCount,
      assignedOwnerCount: recipientStatus.summary.assignedOwnerCount,
      missingRecipientCount: recipientStatus.summary.missingRecipientCount,
      issueCount: recipientStatus.summary.issueCount,
    },
    rows,
    assignmentIssues: [...recipientStatus.assignmentIssues],
  };
}

export function formatProductionRolloutOwnerRecipientDecisionWorksheet(
  worksheet: ProductionRolloutOwnerRecipientDecisionWorksheet,
) {
  return [
    `# myMEDLIFE owner recipient decision worksheet: ${worksheet.ready ? "READY TO SEND OWNER PACKETS" : "NOT READY"}`,
    "",
    "Use this worksheet to decide who receives each owner packet before the 30-chapter / 500-student rollout data request goes out.",
    "",
    "This worksheet is read-only. It does not send email, create users, write Supabase rows, call Luma, send invites, trigger n8n, or change production config.",
    "",
    "## Summary",
    "",
    `- owner recipients assigned: ${worksheet.summary.assignedOwnerCount}/${worksheet.summary.ownerCount}`,
    `- missing recipient emails: ${worksheet.summary.missingRecipientCount}`,
    `- issue count: ${worksheet.summary.issueCount}`,
    "",
    "## How To Decide",
    "",
    "- `recipientEmail` should be the one accountable person who can return that owner packet.",
    "- `ccEmails` can include the launch owner, DS/platform owner, or reviewer who needs visibility.",
    "- If no person is known yet, keep the row blank and do not send that packet.",
    "- Do not add passwords, API keys, tokens, private notes, medical details, or raw table exports.",
    "",
    "## Copy/Paste Answer Block",
    "",
    "Use this block to collect the seven real owner-recipient decisions. Replace blank values with real MEDLIFE email addresses; leave a row blank if no accountable owner is confirmed yet.",
    "",
    "```text",
    ...worksheet.rows.map(formatAnswerBlockRow),
    "```",
    "",
    "## Decisions Needed",
    "",
    "| Owner packet | Current recipient | Suggested accountable seat | Why this owner matters | Files owned | Folder status | Required decision |",
    "|---|---|---|---|---|---|---|",
    ...worksheet.rows.map(
      (row) =>
        `| ${row.owner} | ${row.recipientEmail || "Missing"} | ${row.suggestedAccountableSeat} | ${row.whyThisOwnerMatters} | ${row.filesOwned.join("<br>")} | ${row.folderStatus} | ${row.requiredDecision} |`,
    ),
    "",
    "## Assignment Integrity",
    "",
    ...formatList(
      worksheet.assignmentIssues,
      "No assignment integrity issues.",
      "Assignment issues:",
    ),
    "",
    "## Fill This CSV Next",
    "",
    "| ownerSlug | owner | recipientEmail | ccEmails | notes |",
    "|---|---|---|---|---|",
    ...worksheet.rows.map(
      (row) =>
        `| ${row.ownerSlug} | ${row.owner} | ${row.recipientEmail || ""} | ${row.ccEmails || ""} | ${row.recipientEmail ? "confirm recipient before send" : "pending recipient decision"} |`,
    ),
    "",
    "## Next Commands",
    "",
    "```bash",
    "pnpm rollout:owner-recipient-answers --answers owner-recipient-answers.txt --owner-dir <owner-dir> --out <owner-recipient-assignments.csv>",
    "pnpm rollout:owner-recipients --owner-dir <owner-dir> --recipient-assignments <owner-recipient-assignments.csv> --out production-rollout-owner-recipient-status.md",
    "pnpm rollout:owner-send-tracker --owner-dir <owner-dir> --out production-rollout-owner-send-tracker --recipient-assignments <owner-recipient-assignments.csv>",
    "pnpm rollout:current-status --owner-dir <owner-dir> --recipient-assignments <owner-recipient-assignments.csv> --out production-rollout-current-status.md",
    "```",
    "",
    "## Safety Rules",
    "",
    "- Keep this worksheet and the recipient CSV free of secrets and private student data.",
    "- Do not send broad student invitations from this owner handoff step.",
    "- Do not invite students until the final invite gate says READY and human approval is recorded.",
    "",
  ].join("\n");
}

function formatAnswerBlockRow(row: ProductionRolloutOwnerRecipientDecisionRow) {
  return [
    row.ownerSlug,
    `suggestedSeat=${row.suggestedAccountableSeat}`,
    `recipientEmail=${row.recipientEmail}`,
    `ccEmails=${row.ccEmails}`,
    "notes=",
  ].join(" | ");
}

function formatList(items: string[], emptyLabel: string, label: string) {
  if (items.length === 0) {
    return [`- ${emptyLabel}`];
  }

  return [`- ${label}`, ...items.map((item) => `  - ${item}`)];
}
