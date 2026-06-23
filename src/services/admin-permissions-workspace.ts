import { getLandingRouteForLocalActorOption } from "@/services/landing-route";
import {
  getMockLocalActorContext,
  localActorOptions,
  type LocalActorContext,
  type LocalActorOption,
} from "@/services/local-actor-context";
import {
  canReadAdminReviewSurface,
  getActorSurfaceFamily,
  getMobileQuickNavigationForActor,
  getNavigationForActor,
} from "@/services/role-visibility";

export type AdminPermissionsWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  nextStep: {
    href: string;
    label: string;
    detail: string;
  };
  routeFamilies: readonly PermissionRouteFamily[];
  personaRows: readonly PermissionPersonaRow[];
  selectedSection: PermissionRegistrySection;
  sectionOptions: readonly PermissionSectionOption[];
  focusedSection: PermissionFocusedSection;
  guardrails: readonly string[];
  counts: {
    personas: number;
    canonicalRoles: number;
    backendRoutes: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

export type PermissionRouteFamily = {
  key: string;
  label: string;
  ownerSummary: string;
  entryHref: string;
  routes: readonly string[];
};

export type PermissionPersonaRow = {
  email: string;
  displayName: string;
  audience: string;
  canonicalRoles: readonly string[];
  scopes: readonly string[];
  defaultRoute: string;
  ownedSurface: string;
  navigationPreview: readonly string[];
  quickNavPreview: readonly string[];
  writePosture: string;
};

export type PermissionRegistrySection = "routes" | "personas";

export type PermissionSectionOption = {
  key: PermissionRegistrySection;
  label: string;
  href: string;
  selected: boolean;
};

export type PermissionFocusCard = {
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

export type PermissionFocusedSection = {
  title: string;
  summary: string;
  selectedKey: string | null;
  selectedCard: PermissionFocusCard | null;
  cards: readonly PermissionFocusCard[];
};

const backendRouteFamily: PermissionRouteFamily = {
  key: "admin_backend",
  label: "Admin review and tooling",
  ownerSummary:
    "Internal review packets, audit posture, safety checks, workflow registry, SOP builder, and admin configuration.",
  entryHref: "/admin",
  routes: [
    "/admin",
    "/admin/review-path",
    "/admin/nick-review",
    "/admin/release-readiness",
    "/admin/launch-gate",
    "/admin/audit-log",
    "/admin/integration-outbox",
    "/admin/master-data",
    "/admin/database-security",
    "/admin/system-health",
    "/admin/design-qa",
    "/admin/operations",
    "/admin/first-write",
    "/admin/write-sequence",
    "/admin/proof-write",
    "/admin/hq-proof-write",
    "/admin/assignment-write",
    "/admin/coach-write",
    "/admin/pilot-scope",
    "/admin/permissions",
    "/admin/committees",
    "/admin/workflows",
    "/admin/sop-library",
    "/admin/sop-builder/rush-month?tab=steps",
  ],
};

export function getAdminPermissionsWorkspace(
  actor: LocalActorContext,
  actors: readonly LocalActorOption[] = localActorOptions,
  search?: {
    focus?: string;
    section?: string;
  },
): AdminPermissionsWorkspace {
  if (!canReadAdminReviewSurface(actor)) {
    return {
      canReadWorkspace: false,
      title: "Permissions registry hidden for this role",
      summary:
        "Chapter and coach roles should use their owned operating surfaces instead of the backend permission registry.",
      nextStep: {
        href: "/rush-month",
        label: "Back to Rush Month",
        detail: "Return to a role-owned operating route.",
      },
      routeFamilies: [],
      personaRows: [],
      selectedSection: "routes",
      sectionOptions: [],
      focusedSection: emptyFocusedSection(),
      guardrails: [],
      counts: emptyCounts(),
    };
  }

  const personaRows = actors.map(toPermissionPersonaRow);
  const canonicalRoles = new Set(personaRows.flatMap((row) => row.canonicalRoles));
  const routeFamilies: readonly PermissionRouteFamily[] = [
    {
      key: "member_mobile",
      label: "Member mobile",
      ownerSummary: "Student and traveler loops with mobile-shell ownership.",
      entryHref: "/",
      routes: [
        "/",
        "/campaigns",
        "/rush-month/dashboard",
        "/rush-month/actions",
        "/rush-month/events",
        "/profile",
      ],
    },
    {
      key: "leader_command_center",
      label: "Student Leadership Command Center",
      ownerSummary:
        "Chapter-owned desktop/tablet surface for member pipeline, committees, events, impact, and succession.",
      entryHref: "/chapter?view=overview",
      routes: [
        "/chapter?view=overview",
        "/chapter?view=members",
        "/chapter?view=committees",
        "/chapter?view=events",
        "/chapter?view=succession",
      ],
    },
    {
      key: "coach_command_center",
      label: "Coach command center",
      ownerSummary: "Portfolio support, chapter detail, campaigns, and support notes.",
      entryHref: "/coach?view=chapters",
      routes: [
        "/coach?view=chapters",
        "/coach?view=chapter_detail",
        "/coach?view=campaigns",
        "/coach?view=support_notes#support-notes",
      ],
    },
    {
      key: "staff_command_center",
      label: "Staff command center",
      ownerSummary:
        "HQ operations surface for chapters, campaigns, proof/UGC, feed work, and admin health.",
      entryHref: "/staff?view=chapters",
      routes: [
        "/staff?view=chapters",
        "/staff?view=campaigns",
        "/staff?view=proof_ugc",
        "/staff?view=admin",
      ],
    },
    {
      key: "slt_prep",
      label: "SLT Prep",
      ownerSummary:
        "Traveler mobile route family plus a distinct staff reviewer dashboard.",
      entryHref: "/slt-prep",
      routes: [
        "/slt-prep",
        "/slt-prep/checklist",
        "/slt-prep/forms",
        "/slt-prep/flights",
        "/slt-prep/staff",
      ],
    },
    backendRouteFamily,
  ];
  const selectedSection = normalizeSection(search?.section);
  const sectionOptions = buildSectionOptions(selectedSection);
  const focusedSection = buildFocusedSection(
    selectedSection,
    search?.focus,
    routeFamilies,
    personaRows,
  );

  return {
    canReadWorkspace: true,
    title: getTitle(actor),
    summary:
      "This route makes the packet's role and scope model explicit inside the repo: each fake local actor maps to canonical roles, a landing surface, and a limited route family. It is read-only on purpose.",
    nextStep: getNextStep(actor),
    routeFamilies,
    personaRows,
    selectedSection,
    sectionOptions,
    focusedSection,
    guardrails: [
      "Canonical roles translate at the app boundary first. Hosted schema and RLS naming stay compatible until separately approved.",
      "DS Admin can inspect blocked integration posture but does not own membership approval, staff role assignment, or campaign configuration writes.",
      "Super Admin remains a named breakglass role, not an invitation to bypass audit, outbox, or review proof.",
      "No role can trigger HubSpot, Luma, Shopify, n8n, warehouse, Power BI, SMS, email, or AI writes from this registry.",
    ],
    counts: {
      personas: personaRows.length,
      canonicalRoles: canonicalRoles.size,
      backendRoutes: backendRouteFamily.routes.length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function getTitle(actor: LocalActorContext): string {
  switch (getActorSurfaceFamily(actor)) {
    case "staff":
      return "Admin permission registry";
    case "ds_admin":
      return "DS Admin permission registry";
    case "super_admin":
      return "Super Admin permission registry";
    case "member":
    case "leader":
    case "coach":
      return "Permissions registry hidden for this role";
  }
}

function getNextStep(
  actor: LocalActorContext,
): AdminPermissionsWorkspace["nextStep"] {
  if (getActorSurfaceFamily(actor) === "ds_admin") {
    return {
      href: "/admin/integration-outbox",
      label: "Open integration safety",
      detail:
        "DS stays closest to blocked sends, outbox posture, and system boundaries.",
    };
  }

  return {
    href: "/admin/workflows",
    label: "Open workflow registry",
    detail:
      "Use the workflow registry to connect permissions to the owned write and review lanes.",
  };
}

function normalizeSection(section: string | undefined): PermissionRegistrySection {
  switch (section) {
    case "personas":
      return "personas";
    default:
      return "routes";
  }
}

function buildSectionOptions(
  selectedSection: PermissionRegistrySection,
): readonly PermissionSectionOption[] {
  return [
    {
      key: "routes",
      label: "Route families",
      href: "/admin/permissions?section=routes",
      selected: selectedSection === "routes",
    },
    {
      key: "personas",
      label: "Local personas",
      href: "/admin/permissions?section=personas",
      selected: selectedSection === "personas",
    },
  ];
}

function buildFocusedSection(
  selectedSection: PermissionRegistrySection,
  focus: string | undefined,
  routeFamilies: readonly PermissionRouteFamily[],
  personaRows: readonly PermissionPersonaRow[],
): PermissionFocusedSection {
  const cards =
    selectedSection === "routes"
      ? routeFamilies.map((family) => ({
          key: family.key,
          eyebrow: "Route family",
          title: family.label,
          detail: family.ownerSummary,
          footer: `Entry route: ${family.entryHref}`,
          statusLabel: `${family.routes.length} routes`,
          href: family.entryHref,
          hrefLabel: "Open entry route",
          pills: family.routes,
          focusHref: buildFocusHref(selectedSection, family.key),
        }))
      : personaRows.map((row) => ({
          key: row.email,
          eyebrow: "Local persona",
          title: row.displayName,
          detail: `${row.audience} · ${row.ownedSurface}`,
          footer: row.writePosture,
          statusLabel: row.defaultRoute,
          href: row.defaultRoute,
          hrefLabel: "Open default route",
          pills: [...row.canonicalRoles, ...row.scopes],
          focusHref: buildFocusHref(selectedSection, row.email),
        }));

  const selectedCard = cards.find((card) => card.key === focus) ?? cards[0] ?? null;

  return {
    title: selectedSection === "routes" ? "Route families" : "Local actor registry",
    summary:
      selectedSection === "routes"
        ? "Keep route families explicit so each owned surface stays bounded by role and route instead of collapsing into one generic portal."
        : "Keep local personas explicit so each fake actor still maps to one owned surface, canonical roles, scopes, and a narrow write posture.",
    selectedKey: selectedCard?.key ?? null,
    selectedCard,
    cards,
  };
}

function buildFocusHref(section: PermissionRegistrySection, focus: string) {
  return `/admin/permissions?section=${section}&focus=${encodeURIComponent(focus)}`;
}

function emptyFocusedSection(): PermissionFocusedSection {
  return {
    title: "Route families",
    summary: "Permission focus is unavailable for this role.",
    selectedKey: null,
    selectedCard: null,
    cards: [],
  };
}

function toPermissionPersonaRow(option: LocalActorOption): PermissionPersonaRow {
  const previewActor = getMockLocalActorContext(option.email);

  return {
    email: option.email,
    displayName: option.displayName,
    audience: option.audience.replaceAll("_", " "),
    canonicalRoles: previewActor.canonicalRoles,
    scopes: previewActor.canonicalScopes,
    defaultRoute: getLandingRouteForLocalActorOption(option),
    ownedSurface: previewActor.defaultLandingSurface.replaceAll("_", " "),
    navigationPreview: getNavigationForActor(previewActor)
      .slice(0, 4)
      .map((item) => item.href),
    quickNavPreview: getMobileQuickNavigationForActor(previewActor).map(
      (item) => item.href,
    ),
    writePosture: getWritePosture(option.audience),
  };
}

function getWritePosture(audience: LocalActorOption["audience"]): string {
  switch (audience) {
    case "chapter_member":
      return "Own next-step writes only after the guarded lane is explicitly approved.";
    case "chapter_leader":
      return "Leader assignments, membership review, and proof decisions stay packeted and mock-safe.";
    case "coach":
      return "Coach note saves and escalation packets remain disabled until a later approval lane opens.";
    case "admin":
      return "HQ can review and configure mock-safe backend lanes without triggering live systems.";
    case "ds_admin":
      return "DS inspects read-only safety posture and blocked integrations, not operational writes.";
    case "super_admin":
      return "Super Admin sees the broadest route family but still cannot bypass audit and approval rules.";
  }
}

function emptyCounts(): AdminPermissionsWorkspace["counts"] {
  return {
    personas: 0,
    canonicalRoles: 0,
    backendRoutes: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}
