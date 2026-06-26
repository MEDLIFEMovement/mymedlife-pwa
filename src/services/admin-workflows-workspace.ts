import { getAuthOnboardingPlan } from "@/services/auth-onboarding-plan";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadAdminReviewSurface,
  getActorSurfaceFamily,
} from "@/services/role-visibility";
import { getWorkflowInventorySnapshot } from "@/services/sop-rollout-inventory";
import { getSopLibraryWorkspace } from "@/services/sop-library-workspace";
import { getWriteSequencePlanner } from "@/services/write-sequence-planner";

export type AdminWorkflowsWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  nextStep: {
    href: string;
    label: string;
    detail: string;
  };
  lanes: readonly WorkflowLane[];
  onboardingSteps: readonly WorkflowOnboardingStep[];
  writeOperations: readonly WorkflowWriteOperation[];
  rolloutInventory: ReturnType<typeof getWorkflowInventorySnapshot>;
  selectedSection: WorkflowRegistrySection;
  sectionOptions: readonly WorkflowSectionOption[];
  focusedSection: WorkflowFocusedSection;
  counts: {
    lanes: number;
    onboardingSteps: number;
    writeOperations: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

export type WorkflowLane = {
  key: string;
  label: string;
  route: string;
  ownerSummary: string;
  status: "ready_readonly" | "mock_only" | "blocked";
  currentPosture: string;
  nextProof: string;
  pills?: readonly string[];
};

export type WorkflowOnboardingStep = {
  key: string;
  label: string;
  owner: string;
  browserEnabled: boolean;
  notes: string;
};

export type WorkflowWriteOperation = {
  key: string;
  label: string;
  route: string;
  status: string;
  actorLabel: string;
  nextGate: string;
  expectedTables: readonly string[];
};

export type WorkflowRegistrySection = "lanes" | "onboarding" | "writes";

export type WorkflowSectionOption = {
  key: WorkflowRegistrySection;
  label: string;
  href: string;
  selected: boolean;
};

export type WorkflowFocusCard = {
  key: string;
  eyebrow: string;
  title: string;
  detail: string;
  footer: string;
  statusLabel: string;
  href?: string;
  hrefLabel?: string;
  pills?: readonly string[];
  focusHref: string;
};

export type WorkflowFocusedSection = {
  title: string;
  summary: string;
  selectedKey: string | null;
  selectedCard: WorkflowFocusCard | null;
  cards: readonly WorkflowFocusCard[];
};

export function getAdminWorkflowsWorkspace(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  search?: {
    focus?: string;
    section?: string;
  },
): AdminWorkflowsWorkspace {
  if (!canReadAdminReviewSurface(actor)) {
    return {
      canReadWorkspace: false,
      title: "Workflow registry hidden for this role",
      summary:
        "Workflow registry belongs to backend reviewers, not member, leader, or coach operating surfaces.",
      nextStep: {
        href: "/admin",
        label: "Back to admin",
        detail: "Return to the admin control center.",
      },
      lanes: [],
      onboardingSteps: [],
      writeOperations: [],
      rolloutInventory: getWorkflowInventorySnapshot(),
      selectedSection: "lanes",
      sectionOptions: [],
      focusedSection: emptyFocusedSection(),
      counts: emptyCounts(),
    };
  }

  const onboardingPlan = getAuthOnboardingPlan();
  const rolloutInventory = getWorkflowInventorySnapshot();
  const writePlanner = getWriteSequencePlanner(actor, data);
  const selectedSection = normalizeSection(search?.section);
  const lanes: readonly WorkflowLane[] = [
    {
      key: "auth_onboarding",
      label: "Auth and onboarding",
      route: "/onboarding",
      ownerSummary: "Student self-serve start, chapter approval in chapter scope, staff role control in backend scope.",
      status: "blocked",
      currentPosture:
        "The route explains the future auth path, but production auth and live onboarding writes are still off.",
      nextProof:
        "Named owner approval, real auth config, and RLS evidence must exist before browser onboarding is promoted.",
    },
    {
      key: "chapter_membership",
      label: "Chapter membership review",
      route: "/chapter?view=members",
      ownerSummary: "President / VP reviews chapter membership and role posture inside the leader shell.",
      status: "mock_only",
      currentPosture:
        "Membership review language and result states exist, but the actual approval write stays packeted and disabled by default.",
      nextProof:
        "Need the membership approval operator packet, audit readback, and rollback owner before this becomes a hosted rehearsal.",
    },
    {
      key: "rush_month_write_sequence",
      label: "Rush Month write sequence",
      route: "/admin/write-sequence",
      ownerSummary: "Backend safety lane for the order of action, proof, leader, HQ, and coach writes.",
      status: "ready_readonly",
      currentPosture:
        "The planner exists and names the guarded write promotion order without claiming the writes are live.",
      nextProof:
        "The first write still needs approved readback evidence before later writes can move forward.",
    },
    {
      key: "proof_review",
      label: "Proof review and HQ sharing",
      route: "/rush-month/review",
      ownerSummary: "Leader and HQ proof review stay separate from the student submission experience.",
      status: "mock_only",
      currentPosture:
        "Proof review surfaces are visible and stateful, but uploads, public sharing, and external sends remain blocked.",
      nextProof:
        "Need proof metadata readback, consent posture, and explicit sharing approval before a second live lane opens.",
    },
    {
      key: "slt_readiness",
      label: "SLT traveler readiness",
      route: "/slt-prep/staff",
      ownerSummary: "Traveler mobile flow and staff readiness dashboard share one structured checklist model.",
      status: "ready_readonly",
      currentPosture:
        "Checklist, flights, meetings, payments, and staff risk review all exist in the local route family.",
      nextProof:
        "Real auth, real traveler records, and a narrow checklist write approval would be the next live step.",
    },
    {
      key: "coach_intervention",
      label: "Coach intervention",
      route: "/coach?view=support_notes#support-notes",
      ownerSummary: "Coach sees portfolio health and support context without writing notes or triggering escalation.",
      status: "mock_only",
      currentPosture:
        "Support notes and risk posture are visible, but coach writes and escalation paths remain disabled.",
      nextProof:
        "Need named owners, audit readback, and explicit approval before coach note saves or decision writes open.",
    },
    createSopBuilderLane(actor),
  ];
  const onboardingSteps: readonly WorkflowOnboardingStep[] = onboardingPlan.steps.map((step) => ({
    key: step.key,
    label: step.label,
    owner: step.owner.replaceAll("_", " "),
    browserEnabled: step.browserEnabled,
    notes: step.notes,
  }));
  const writeOperations: readonly WorkflowWriteOperation[] = writePlanner.operations.map((operation) => ({
    key: operation.key,
    label: operation.label,
    route: operation.route,
    status: operation.status,
    actorLabel: operation.actorLabel,
    nextGate: operation.nextGate,
    expectedTables: operation.expectedTables,
  }));
  const sectionOptions = buildSectionOptions(selectedSection);
  const focusedSection = buildFocusedSection(
    selectedSection,
    search?.focus,
    lanes,
    onboardingSteps,
    writeOperations,
  );

  return {
    canReadWorkspace: true,
    title: getTitle(actor),
    summary:
      "This is the backend map for what the app actually does: auth and onboarding, chapter membership review, campaign writes, proof review, SLT readiness, coach intervention, and SOP configuration. It stays descriptive and mock-safe until explicit approvals open writes.",
    nextStep: getNextStep(actor),
    lanes,
    onboardingSteps,
    writeOperations,
    rolloutInventory,
    selectedSection,
    sectionOptions,
    focusedSection,
    counts: {
      lanes: 7,
      onboardingSteps: onboardingPlan.steps.length,
      writeOperations: writePlanner.operations.length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function getTitle(actor: LocalActorContext): string {
  switch (getActorSurfaceFamily(actor)) {
    case "staff":
      return "Workflow registry";
    case "ds_admin":
      return "DS Admin workflow registry";
    case "super_admin":
      return "Super Admin workflow registry";
    case "member":
    case "leader":
    case "coach":
      return "Workflow registry hidden for this role";
  }
}

function getNextStep(actor: LocalActorContext): AdminWorkflowsWorkspace["nextStep"] {
  if (getActorSurfaceFamily(actor) === "ds_admin") {
    return {
      href: "/admin/integration-outbox",
      label: "Open integration safety",
      detail:
        "Stay close to blocked sends and the outbox posture that all workflow lanes depend on.",
    };
  }

  return {
    href: "/admin/sop-builder/rush-month?tab=steps",
    label: "Open SOP builder",
    detail:
      "Use the workflow registry to decide what the SOP builder needs to encode and what must stay blocked, then open the builder workspace directly.",
  };
}

function normalizeSection(section: string | undefined): WorkflowRegistrySection {
  switch (section) {
    case "onboarding":
    case "writes":
      return section;
    default:
      return "lanes";
  }
}

function buildSectionOptions(
  selectedSection: WorkflowRegistrySection,
): readonly WorkflowSectionOption[] {
  return [
    {
      key: "lanes",
      label: "Workflow lanes",
      href: "/admin/workflows?section=lanes",
      selected: selectedSection === "lanes",
    },
    {
      key: "onboarding",
      label: "Onboarding sequence",
      href: "/admin/workflows?section=onboarding",
      selected: selectedSection === "onboarding",
    },
    {
      key: "writes",
      label: "Write sequence",
      href: "/admin/workflows?section=writes",
      selected: selectedSection === "writes",
    },
  ];
}

function buildFocusedSection(
  selectedSection: WorkflowRegistrySection,
  focus: string | undefined,
  lanes: readonly WorkflowLane[],
  onboardingSteps: readonly WorkflowOnboardingStep[],
  writeOperations: readonly WorkflowWriteOperation[],
): WorkflowFocusedSection {
  const cards =
    selectedSection === "lanes"
      ? lanes.map((lane) => ({
          key: lane.key,
          eyebrow: "Workflow lane",
          title: lane.label,
          detail: lane.currentPosture,
          footer: `Next proof: ${lane.nextProof}`,
          statusLabel: lane.status.replaceAll("_", " "),
          href: lane.route,
          hrefLabel: "Open workflow route",
          pills: lane.pills ?? [lane.ownerSummary],
          focusHref: buildFocusHref(selectedSection, lane.key),
        }))
      : selectedSection === "onboarding"
        ? onboardingSteps.map((step) => ({
            key: step.key,
            eyebrow: "Onboarding step",
            title: step.label,
            detail: step.notes,
            footer: `Owner: ${step.owner}`,
            statusLabel: step.browserEnabled ? "browser on" : "browser off",
            pills: step.browserEnabled ? ["browser enabled"] : ["browser disabled"],
            focusHref: buildFocusHref(selectedSection, step.key),
          }))
        : writeOperations.map((operation) => ({
            key: operation.key,
            eyebrow: "Write operation",
            title: operation.label,
            detail: `Next gate: ${operation.nextGate}`,
            footer: `Actor: ${operation.actorLabel}`,
            statusLabel: operation.status.replaceAll("_", " "),
            href: operation.route,
            hrefLabel: "Open operator route",
            pills: operation.expectedTables,
            focusHref: buildFocusHref(selectedSection, operation.key),
          }));

  const selectedCard = cards.find((card) => card.key === focus) ?? cards[0] ?? null;

  return {
    title:
      selectedSection === "lanes"
        ? "Workflow lanes"
        : selectedSection === "onboarding"
          ? "Onboarding sequence"
          : "Write sequence",
    summary:
      selectedSection === "lanes"
        ? "Keep the backend lanes route-owned so reviewers can inspect one workflow at a time without losing the registry context."
        : selectedSection === "onboarding"
          ? "Onboarding should read like one named sequence with owned steps, not a floating checklist detached from the registry."
          : "Write promotion should stay explicit and ordered so each operation can be reviewed before the next one opens.",
    selectedKey: selectedCard?.key ?? null,
    selectedCard,
    cards,
  };
}

function buildFocusHref(section: WorkflowRegistrySection, focus: string) {
  return `/admin/workflows?section=${section}&focus=${focus}`;
}

function createSopBuilderLane(actor: LocalActorContext): WorkflowLane {
  const libraryWorkspace = getSopLibraryWorkspace(actor);

  if (!libraryWorkspace.canReadWorkspace) {
    return {
      key: "sop_builder",
      label: "SOP library and builder",
      route: "/admin/sop-builder/rush-month?tab=steps",
      ownerSummary: "Backend-only campaign workflow configuration and versioning lane.",
      status: "ready_readonly",
      currentPosture:
        "Structured steps, role matrix, completion rules, points, KPIs, comms, preview, and version history are available in mock-safe form.",
      nextProof:
        "Admin editing and version publish behavior should stay blocked until backend mutations are approved separately.",
    };
  }

  return {
    key: "sop_builder",
    label: "SOP library and builder",
    route: "/admin/sop-library",
    ownerSummary:
      "Backend-only campaign workflow configuration and versioning lane.",
    status: "ready_readonly",
    currentPosture: `The live app already carries this lane: ${libraryWorkspace.counts.totalSops} campaign definitions, ${libraryWorkspace.counts.structuredDrafts} structured drafts, and ${libraryWorkspace.counts.reviewWarnings} review warnings stay visible across the in-app SOP library and builder without enabling writes.`,
    nextProof:
      "Keep /admin/sop-library and /admin/sop-builder/[campaignSlug] as the source of truth for campaign configuration while admin editing and version publish behavior remain blocked pending explicit approval.",
    pills: [
      `${libraryWorkspace.counts.totalSops} campaign definitions`,
      `${libraryWorkspace.counts.structuredDrafts} structured drafts`,
      `${libraryWorkspace.counts.reviewWarnings} review warnings`,
      "source of truth: SOP library + builder",
    ],
  };
}

function emptyFocusedSection(): WorkflowFocusedSection {
  return {
    title: "Workflow lanes",
    summary: "Workflow focus is unavailable for this role.",
    selectedKey: null,
    selectedCard: null,
    cards: [],
  };
}

function emptyCounts(): AdminWorkflowsWorkspace["counts"] {
  return {
    lanes: 0,
    onboardingSteps: 0,
    writeOperations: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}
