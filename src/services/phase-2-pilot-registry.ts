type EnvSource = Record<string, string | undefined>;

export type Phase2PilotDefaultStatus = "recommended_default" | "recorded_final";
export type Phase2PilotOwnerStatus = "pending_named_owner" | "recorded_owner";

export type Phase2PilotDefaultRecord = {
  key: string;
  label: string;
  value: string;
  status: Phase2PilotDefaultStatus;
  whyThisIsDefault: string;
  envKey?: string;
};

export type Phase2PilotOwnerRecord = {
  key: string;
  label: string;
  value: string;
  status: Phase2PilotOwnerStatus;
  confirmationNeededFrom:
    | "Nick/team"
    | "Kiomi"
    | "HQ ops"
    | "Coach lead"
    | "Data solutions";
  whyItMatters: string;
  envKey: string;
};

export type Phase2PilotRegistry = {
  defaults: Phase2PilotDefaultRecord[];
  owners: Phase2PilotOwnerRecord[];
  approvalReplyBlock: string[];
  counts: {
    defaultsRecorded: number;
    defaultsPending: number;
    ownersRecorded: number;
    ownersPending: number;
  };
};

type DefaultDefinition = Omit<Phase2PilotDefaultRecord, "value" | "status"> & {
  defaultValue: string;
};

type OwnerDefinition = Omit<Phase2PilotOwnerRecord, "value" | "status"> & {
  defaultValue: string;
};

const defaultDefinitions: DefaultDefinition[] = [
  {
    key: "pilot_chapter",
    label: "Pilot chapter",
    defaultValue: "UCLA MEDLIFE",
    envKey: "MYMEDLIFE_PILOT_CHAPTER",
    whyThisIsDefault:
      "The current repo has the strongest seeded chapter context there, so it is the safest planning baseline until Nick/team names the final pilot chapter.",
  },
  {
    key: "campaign_scope",
    label: "Campaign scope",
    defaultValue: "Rush Month only",
    envKey: "MYMEDLIFE_PILOT_CAMPAIGN_SCOPE",
    whyThisIsDefault:
      "Rush Month has the deepest member, leader, coach, and admin route coverage already visible in the app.",
  },
  {
    key: "cohort_size",
    label: "Pilot cohort size",
    defaultValue: "5-10 students",
    envKey: "MYMEDLIFE_PILOT_COHORT_SIZE",
    whyThisIsDefault:
      "That is large enough to make hosted auth and review feel real without hiding product or support issues inside a broad rollout.",
  },
  {
    key: "first_hosted_write",
    label: "First hosted write",
    defaultValue: "`action_started`",
    envKey: "MYMEDLIFE_PILOT_FIRST_HOSTED_WRITE",
    whyThisIsDefault:
      "It is the narrowest live save path inside the student action loop and can prove audit/readback without opening proof uploads or broader workflow writes.",
  },
  {
    key: "proof_review_loop",
    label: "Smallest real proof loop",
    defaultValue: "proof metadata submission plus leader review only",
    envKey: "MYMEDLIFE_PILOT_PROOF_REVIEW_LOOP",
    whyThisIsDefault:
      "That proves the student-to-leader operating loop while keeping public proof sharing and broader HQ publishing controls off.",
  },
  {
    key: "event_nps_posture",
    label: "Event and NPS posture",
    defaultValue:
      "Luma-backed event, RSVP, and attendance loop with manual support review",
    envKey: "MYMEDLIFE_PILOT_EVENT_NPS_POSTURE",
    whyThisIsDefault:
      "Events, RSVP, attendance, points, and leaderboard impact are the core pilot loop, while NPS and support review stay manual-first.",
  },
  {
    key: "integration_hold",
    label: "External integration hold",
    defaultValue:
      "Only the approved Luma event loop may be rehearsed; HubSpot, n8n, warehouse, Power BI, SMS, email, and AI actions stay off",
    envKey: "MYMEDLIFE_PILOT_INTEGRATION_HOLD",
    whyThisIsDefault:
      "The Luma event loop is the first approved external-family pilot path; every other downstream system should wait until the app/Supabase loop is proven.",
  },
];

const ownerDefinitions: OwnerDefinition[] = [
  {
    key: "chapter_leader_owner",
    label: "Chapter leader owner",
    defaultValue: "pending Nick/team",
    envKey: "MYMEDLIFE_PILOT_CHAPTER_LEADER_OWNER",
    confirmationNeededFrom: "Nick/team",
    whyItMatters:
      "One person must own chapter-side follow-up, student questions, and local execution decisions during the pilot.",
  },
  {
    key: "coach_owner",
    label: "Coach owner",
    defaultValue: "pending Coach lead",
    envKey: "MYMEDLIFE_PILOT_COACH_OWNER",
    confirmationNeededFrom: "Coach lead",
    whyItMatters:
      "The pilot needs one named support owner for risk review, intervention posture, and stalled work escalation.",
  },
  {
    key: "hq_admin_owner",
    label: "HQ/admin owner",
    defaultValue: "pending HQ ops",
    envKey: "MYMEDLIFE_PILOT_HQ_ADMIN_OWNER",
    confirmationNeededFrom: "HQ ops",
    whyItMatters:
      "One HQ owner must decide whether issues are pilot-support questions, permissions problems, or stop-the-pilot incidents.",
  },
  {
    key: "ds_owner",
    label: "DS owner",
    defaultValue: "pending Data solutions",
    envKey: "MYMEDLIFE_PILOT_DS_OWNER",
    confirmationNeededFrom: "Data solutions",
    whyItMatters:
      "A DS owner is needed for audit/outbox inspection, staging posture, and explicit integration hold confirmation.",
  },
  {
    key: "support_pause_channel",
    label: "Support and pause channel",
    defaultValue: "pending HQ ops",
    envKey: "MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL",
    confirmationNeededFrom: "HQ ops",
    whyItMatters:
      "The first pilot needs one place to pause activity quickly if the wrong role, wrong data, or wrong message appears.",
  },
  {
    key: "rollback_owner",
    label: "Rollback owner",
    defaultValue: "pending Kiomi",
    envKey: "MYMEDLIFE_PILOT_ROLLBACK_OWNER",
    confirmationNeededFrom: "Kiomi",
    whyItMatters:
      "One person must own disabling the narrow hosted write path and confirming the rollback step if the pilot needs to stop.",
  },
];

export function getPhase2PilotRegistry(
  env: EnvSource = process.env,
): Phase2PilotRegistry {
  const defaults = defaultDefinitions.map((definition) => {
    const recordedValue = readRecordedValue(env, definition.envKey);

    return {
      key: definition.key,
      label: definition.label,
      value: recordedValue ?? definition.defaultValue,
      status: recordedValue ? "recorded_final" : "recommended_default",
      whyThisIsDefault: definition.whyThisIsDefault,
      envKey: definition.envKey,
    } satisfies Phase2PilotDefaultRecord;
  });

  const owners = ownerDefinitions.map((definition) => {
    const recordedValue = readRecordedValue(env, definition.envKey);

    return {
      key: definition.key,
      label: definition.label,
      value: recordedValue ?? definition.defaultValue,
      status: recordedValue ? "recorded_owner" : "pending_named_owner",
      envKey: definition.envKey,
      confirmationNeededFrom: definition.confirmationNeededFrom,
      whyItMatters: definition.whyItMatters,
    } satisfies Phase2PilotOwnerRecord;
  });

  return {
    defaults,
    owners,
    approvalReplyBlock: buildApprovalReplyBlock(defaults, owners),
    counts: {
      defaultsRecorded: defaults.filter((item) => item.status === "recorded_final")
        .length,
      defaultsPending: defaults.filter(
        (item) => item.status === "recommended_default",
      ).length,
      ownersRecorded: owners.filter((item) => item.status === "recorded_owner").length,
      ownersPending: owners.filter(
        (item) => item.status === "pending_named_owner",
      ).length,
    },
  };
}

function buildApprovalReplyBlock(
  defaults: Phase2PilotDefaultRecord[],
  owners: Phase2PilotOwnerRecord[],
): string[] {
  return [
    "approved as written",
    "",
    ...defaults.map((item) => `${item.label}: ${item.value}`),
    ...owners.map((item) => `${item.label}: ${item.value}`),
  ];
}

function readRecordedValue(
  env: EnvSource,
  key: string | undefined,
): string | null {
  if (!key) {
    return null;
  }

  const value = env[key]?.trim();

  return value ? value : null;
}
