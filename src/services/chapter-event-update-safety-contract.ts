export type ChapterEventUpdateField =
  | "chapter_id"
  | "campaign_id"
  | "phase_id"
  | "action_committee_id"
  | "assignment_id"
  | "title"
  | "event_type"
  | "status"
  | "planned_by_user_id"
  | "owner_user_id"
  | "starts_at"
  | "ends_at"
  | "promotion_summary"
  | "attendance_count"
  | "eligible_member_count"
  | "attendance_rate"
  | "nps_score"
  | "feedback_summary"
  | "warehouse_status"
  | "luma_event_link_id";

export type ChapterEventUpdateActorClass =
  | "chapter_event_owner_or_planner"
  | "chapter_leader"
  | "staff_admin"
  | "ds_admin"
  | "super_admin"
  | "coach"
  | "general_member";

export type ChapterEventUpdatePathContract = {
  key: "authoritative_fields" | "narrative_fields";
  label: string;
  status:
    | "implemented_local_first"
    | "proposed_only"
    | "blocked_pending_product_decision";
  localFunction: string;
  serverActionName: string;
  browserControlEnabled: false;
  externalWritesEnabled: false;
  allowedActors: readonly ChapterEventUpdateActorClass[];
  blockedActors: readonly ChapterEventUpdateActorClass[];
  requestFields: readonly {
    name: "chapterEventId" | "patch" | "auditReason";
    source: "route_param" | "validated_server_payload" | "server_text_input";
    required: true;
    clientMayProvideActor: false;
  }[];
  allowedFields: readonly ChapterEventUpdateField[];
  requiredSideEffects: readonly string[];
  forbiddenSideEffects: readonly string[];
  plainEnglishRule: string;
};

export type ChapterEventUpdateSafetyContract = {
  title: string;
  summary: readonly string[];
  currentPolicyCaveat: string;
  authoritativeFields: readonly ChapterEventUpdateField[];
  implementedLocalAuthoritativeFields: readonly ChapterEventUpdateField[];
  deferredAuthoritativeFields: readonly ChapterEventUpdateField[];
  narrativeCandidateFields: readonly ChapterEventUpdateField[];
  systemManagedFields: readonly string[];
  approvalRequirements: readonly string[];
  paths: readonly ChapterEventUpdatePathContract[];
  validation: {
    ready: boolean;
    checks: Array<{
      key: string;
      passed: boolean;
      message: string;
    }>;
  };
};

const authoritativeFields = [
  "chapter_id",
  "campaign_id",
  "phase_id",
  "action_committee_id",
  "assignment_id",
  "title",
  "event_type",
  "status",
  "planned_by_user_id",
  "owner_user_id",
  "starts_at",
  "ends_at",
  "attendance_count",
  "eligible_member_count",
  "attendance_rate",
  "nps_score",
  "warehouse_status",
  "luma_event_link_id",
] as const satisfies readonly ChapterEventUpdateField[];

const narrativeCandidateFields = [
  "promotion_summary",
  "feedback_summary",
] as const satisfies readonly ChapterEventUpdateField[];

const implementedLocalAuthoritativeFields = [
  "status",
  "starts_at",
  "ends_at",
  "attendance_count",
  "eligible_member_count",
  "attendance_rate",
  "nps_score",
] as const satisfies readonly ChapterEventUpdateField[];

const implementedLocalAuthoritativeFieldSet = new Set<ChapterEventUpdateField>(
  implementedLocalAuthoritativeFields,
);

const deferredAuthoritativeFields = authoritativeFields.filter(
  (field) => !implementedLocalAuthoritativeFieldSet.has(field),
) as readonly ChapterEventUpdateField[];

const systemManagedFields = ["created_at", "updated_at"] as const;

const paths = [
  {
    key: "authoritative_fields",
    label: "Authoritative chapter-event update path",
    status: "implemented_local_first",
    localFunction: "app.update_chapter_event_authoritative_fields",
    serverActionName: "updateChapterEventAuthoritativeFields",
    browserControlEnabled: false,
    externalWritesEnabled: false,
    allowedActors: [
      "chapter_leader",
      "staff_admin",
      "ds_admin",
      "super_admin",
    ],
    blockedActors: [
      "chapter_event_owner_or_planner",
      "coach",
      "general_member",
    ],
    requestFields: [
      {
        name: "chapterEventId",
        source: "route_param",
        required: true,
        clientMayProvideActor: false,
      },
      {
        name: "patch",
        source: "validated_server_payload",
        required: true,
        clientMayProvideActor: false,
      },
      {
        name: "auditReason",
        source: "server_text_input",
        required: true,
        clientMayProvideActor: false,
      },
    ],
    allowedFields: implementedLocalAuthoritativeFields,
    requiredSideEffects: [
      "Exactly one internal events row records chapter_event_updated with changed field names.",
      "Exactly one audit_logs row records who changed the event and why.",
    ],
    forbiddenSideEffects: [
      "No points_events write.",
      "No automation_outbox write.",
      "No provider call or Luma mutation.",
      "No integration_events live-send posture.",
    ],
    plainEnglishRule:
      "Chapter-event operating truth should move only through a leader/staff/admin audited server path, never through direct owner/planner table updates.",
  },
  {
    key: "narrative_fields",
    label: "Narrative chapter-event owner/planner helper",
    status: "blocked_pending_product_decision",
    localFunction: "app.update_chapter_event_narrative_fields",
    serverActionName: "updateChapterEventNarrativeFields",
    browserControlEnabled: false,
    externalWritesEnabled: false,
    allowedActors: [
      "chapter_event_owner_or_planner",
      "chapter_leader",
      "staff_admin",
      "super_admin",
    ],
    blockedActors: [
      "general_member",
      "coach",
      "ds_admin",
    ],
    requestFields: [
      {
        name: "chapterEventId",
        source: "route_param",
        required: true,
        clientMayProvideActor: false,
      },
      {
        name: "patch",
        source: "validated_server_payload",
        required: true,
        clientMayProvideActor: false,
      },
      {
        name: "auditReason",
        source: "server_text_input",
        required: true,
        clientMayProvideActor: false,
      },
    ],
    allowedFields: narrativeCandidateFields,
    requiredSideEffects: [
      "Exactly one internal events row records chapter_event_narrative_updated with changed field names.",
      "Exactly one audit_logs row records who changed the narrative and why.",
    ],
    forbiddenSideEffects: [
      "No points_events write.",
      "No automation_outbox write.",
      "No provider call or Luma mutation.",
      "No attendance_count, status, timing, ownership, or chapter mapping change.",
    ],
    plainEnglishRule:
      "Owner/planner edits, if product approves them at all, should be limited to narrative text and still flow through an audited helper instead of direct row updates.",
  },
] as const satisfies readonly ChapterEventUpdatePathContract[];

export function getChapterEventUpdateSafetyContract(): ChapterEventUpdateSafetyContract {
  const contract = {
    title: "Chapter-event update safety contract: READ-ONLY implementation spec",
    summary: [
      "This contract defines the next safe implementation boundary after the owner-update audit. It does not ship a browser write or production proof.",
      "Current direct owner/planner table updates on app.chapter_events must not be reused as the production event-update authority model.",
      "A first local audited path now exists for the launch-lane authoritative subset: status, timing, attendance counts, attendance rate, and NPS score.",
      "Remaining authoritative chapter-event fields still stay blocked until a later approved expansion decides how chapter mapping, ownership, titles, and provider-linked fields should move safely.",
      "Any future chapter-event update flow should keep external writes, invites, RSVP writes, attendance imports, points materialization, and rollout evidence separate.",
    ],
    currentPolicyCaveat:
      "Current base RLS still grants broad row access to some actors, so the production-safe local boundary now relies on an audited update function plus trigger enforcement instead of direct chapter_events table updates.",
    authoritativeFields,
    implementedLocalAuthoritativeFields,
    deferredAuthoritativeFields,
    narrativeCandidateFields,
    systemManagedFields,
    approvalRequirements: [
      "Product explicitly approves whether any owner/planner narrative edit is needed at all.",
      "The server derives actor identity from Supabase Auth/session context, never from client-provided role, audience, email, or user ID.",
      "Focused Supabase RLS tests prove direct table updates no longer carry production authority for owner/planner or leader/admin edits in the first local path.",
      "The audited helper records exactly one internal event row and one audit row per accepted update.",
      "No points, outbox, provider, or rollout-evidence side effects are attached to chapter-event updates in this lane.",
    ],
    paths,
    validation: {
      ready: false,
      checks: [],
    },
  } satisfies Omit<ChapterEventUpdateSafetyContract, "validation"> & {
    validation: ChapterEventUpdateSafetyContract["validation"];
  };

  return {
    ...contract,
    validation: getChapterEventUpdateSafetyValidation(contract),
  };
}

export function getChapterEventUpdateSafetyValidation(
  contract = getChapterEventUpdateSafetyContract(),
) {
  const authoritativePath = contract.paths.find(
    (path) => path.key === "authoritative_fields",
  );
  const narrativePath = contract.paths.find(
    (path) => path.key === "narrative_fields",
  );

  if (!authoritativePath || !narrativePath) {
    throw new Error("Missing chapter-event update safety path definition.");
  }

  const authoritativeFieldSet = new Set(contract.authoritativeFields);
  const implementedAuthoritativeFieldSet = new Set(
    contract.implementedLocalAuthoritativeFields,
  );
  const narrativeFieldSet = new Set(contract.narrativeCandidateFields);

  const checks = [
    {
      key: "no-field-overlap",
      passed: contract.narrativeCandidateFields.every(
        (field) => !authoritativeFieldSet.has(field),
      ),
      message:
        "Narrative candidate fields stay disjoint from authoritative operating fields.",
    },
    {
      key: "authoritative-path-blocks-owner-planner",
      passed:
        authoritativePath.status === "implemented_local_first" &&
        authoritativePath.allowedActors.includes("chapter_leader") &&
        authoritativePath.allowedActors.includes("staff_admin") &&
        authoritativePath.allowedActors.includes("ds_admin") &&
        authoritativePath.blockedActors.includes("chapter_event_owner_or_planner") &&
        authoritativePath.blockedActors.includes("general_member"),
      message:
        "The authoritative path stays limited to leader/staff/admin audiences and does not rely on owner/planner direct authority.",
    },
    {
      key: "implemented-authoritative-subset",
      passed:
        authoritativePath.allowedFields.every((field) =>
          implementedAuthoritativeFieldSet.has(field),
        ) &&
        contract.deferredAuthoritativeFields.every((field) =>
          authoritativeFieldSet.has(field) &&
          !implementedAuthoritativeFieldSet.has(field),
        ) &&
        !authoritativePath.allowedFields.includes("title") &&
        !authoritativePath.allowedFields.includes("owner_user_id") &&
        !authoritativePath.allowedFields.includes("luma_event_link_id"),
      message:
        "The first implemented audited path stays limited to the launch-lane authoritative subset while broader ownership, mapping, and provider-linked fields remain deferred.",
    },
    {
      key: "narrative-path-limited-fields",
      passed:
        narrativePath.status === "blocked_pending_product_decision" &&
        narrativePath.allowedFields.every((field) => narrativeFieldSet.has(field)) &&
        !narrativePath.allowedFields.includes("attendance_count") &&
        !narrativePath.allowedFields.includes("status") &&
        !narrativePath.allowedFields.includes("starts_at") &&
        !narrativePath.allowedFields.includes("ends_at"),
      message:
        "Any future owner/planner helper stays blocked until product approves it and remains limited to narrative fields only.",
    },
    {
      key: "safe-side-effects-only",
      passed:
        contract.paths.every((path) =>
          path.requiredSideEffects.some((effect) => effect.includes("events row")) &&
          path.requiredSideEffects.some((effect) => effect.includes("audit_logs row")) &&
          path.forbiddenSideEffects.some((effect) => effect.includes("No points_events")) &&
          path.forbiddenSideEffects.some((effect) => effect.includes("No automation_outbox")) &&
          path.forbiddenSideEffects.some((effect) => effect.includes("No provider call")),
        ),
      message:
        "Chapter-event updates are defined as audited internal writes only, without points, outbox, or provider side effects.",
    },
    {
      key: "browser-stays-off",
      passed: contract.paths.every(
        (path) => path.browserControlEnabled === false && path.externalWritesEnabled === false,
      ),
      message:
        "The contract remains read-only and keeps browser controls and external writes disabled until a later approved lane.",
    },
  ];

  return {
    ready: checks.every((check) => check.passed),
    checks,
  };
}

export function formatChapterEventUpdateSafetyContract(
  contract = getChapterEventUpdateSafetyContract(),
) {
  return [
    contract.title,
    "",
    "Summary:",
    ...formatList(contract.summary),
    "",
    "Current caveat:",
    `- ${contract.currentPolicyCaveat}`,
    "",
    "Authoritative fields:",
    ...formatList(contract.authoritativeFields),
    "",
    "Implemented local authoritative subset:",
    ...formatList(contract.implementedLocalAuthoritativeFields),
    "",
    "Deferred authoritative fields:",
    ...formatList(contract.deferredAuthoritativeFields),
    "",
    "Narrative candidate fields:",
    ...formatList(contract.narrativeCandidateFields),
    "",
    "System-managed fields:",
    ...formatList(contract.systemManagedFields),
    "",
    "Path definitions:",
    ...contract.paths.flatMap((path) => [
      `- ${path.label} (${path.status})`,
      `  - local function: ${path.localFunction}`,
      `  - server action: ${path.serverActionName}`,
      `  - browser control enabled: ${path.browserControlEnabled ? "yes" : "no"}`,
      `  - external writes enabled: ${path.externalWritesEnabled ? "yes" : "no"}`,
      `  - allowed actors: ${path.allowedActors.join(", ")}`,
      `  - blocked actors: ${path.blockedActors.join(", ")}`,
      "  - request fields:",
      ...formatNestedList(
        path.requestFields.map(
          (field) => `${field.name} from ${field.source}; clientMayProvideActor=false`,
        ),
      ),
      "  - allowed fields:",
      ...formatNestedList(path.allowedFields),
      "  - required side effects:",
      ...formatNestedList(path.requiredSideEffects),
      "  - forbidden side effects:",
      ...formatNestedList(path.forbiddenSideEffects),
      `  - rule: ${path.plainEnglishRule}`,
    ]),
    "",
    "Approval requirements:",
    ...formatList(contract.approvalRequirements),
    "",
    "Validation:",
    ...contract.validation.checks.map(
      (check) =>
        `- [${check.passed ? "x" : " "}] ${check.key}: ${check.message}`,
    ),
  ].join("\n");
}

function formatList(items: readonly string[]) {
  return items.map((item) => `- ${item}`);
}

function formatNestedList(items: readonly string[]) {
  return items.map((item) => `    - ${item}`);
}
