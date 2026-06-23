import { sopCampaignDefinitions } from "@/data/mock-sop-builder";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import type { SopLibraryStatus } from "@/shared/types/sop-builder";

export type SopLibraryWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  nextStep: {
    href: string;
    label: string;
    detail: string;
  };
  entries: readonly SopLibraryEntry[];
  selectedEntry: SopLibraryEntry | null;
  filters: SopLibraryFilters;
  counts: {
    totalSops: number;
    live: number;
    inDraftOrScheduled: number;
    archived: number;
    totalRules: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

export type SopLibraryEntry = {
  key: string;
  slug: string;
  name: string;
  status: SopLibraryStatus;
  builderStatus: string;
  summary: string;
  versionLabel: string;
  lastEditedBy: string;
  lastPublishedDate: string | null;
  builderHref: string;
  focusHref: string;
  entryPoints: readonly {
    label: string;
    href: string;
  }[];
  stepsCount: number;
  roleRulesCount: number;
  integrationBoundariesCount: number;
};

export type SopLibraryStatusFilter = "all" | SopLibraryStatus;

export type SopLibraryFilterLink = {
  key: string;
  label: string;
  href: string;
  isActive: boolean;
};

export type SopLibraryFilters = {
  query: string;
  status: SopLibraryStatusFilter;
  statusOptions: readonly SopLibraryFilterLink[];
  activeSummary: string;
  hasActiveFilters: boolean;
  clearHref: string;
  visibleCount: number;
  totalCount: number;
};

export function getSopLibraryWorkspace(
  actor: LocalActorContext,
  search?: {
    focus?: string;
    query?: string;
    status?: string;
  },
): SopLibraryWorkspace {
  if (!canReadSopBackend(actor)) {
    return {
      canReadWorkspace: false,
      title: "SOP library hidden for this role",
      summary:
        "The SOP library is a backend planning lane for campaign workflows, not a student, coach, or DS safety route.",
      nextStep: {
        href: "/admin",
        label: "Back to admin",
        detail: "Return to the admin control center.",
      },
      entries: [],
      selectedEntry: null,
      filters: emptyFilters(),
      counts: emptyCounts(),
    };
  }

  const query = normalizeQuery(search?.query);
  const status = normalizeStatus(search?.status);
  const focus = normalizeFocus(search?.focus);
  const allEntries = sopCampaignDefinitions.map((definition) =>
    createLibraryEntry(definition, {
      query,
      status,
    }),
  );
  const entries = allEntries.filter((entry) =>
    matchesFilters(entry, {
      query,
      status,
    }),
  );
  const selectedEntry = entries.find((entry) => entry.key === focus) ?? entries[0] ?? null;
  const filters = buildFilters({
    focus: selectedEntry?.key ?? focus,
    query,
    status,
    visibleCount: entries.length,
    totalCount: allEntries.length,
  });

  return {
    canReadWorkspace: true,
    title: "Campaign SOP library",
    summary:
      "Campaign SOPs stay visible as a route-owned library with summary cards, status pills, search, and builder entry points. The lane remains mock-safe and read-only.",
    nextStep: {
      href: "/admin/workflows?section=lanes&focus=campaign-sop-create",
      label: "New Campaign SOP",
      detail:
        "Open the workflow registry handoff for new campaign SOP creation without enabling live admin mutation yet.",
    },
    entries,
    selectedEntry,
    filters,
    counts: {
      totalSops: allEntries.length,
      live: allEntries.filter((entry) => entry.status === "live").length,
      inDraftOrScheduled: allEntries.filter((entry) => {
        return entry.status === "draft" || entry.status === "scheduled";
      }).length,
      archived: allEntries.filter((entry) => entry.status === "archived").length,
      totalRules: allEntries.reduce((total, entry) => {
        const definition = sopCampaignDefinitions.find(
          (candidate) => candidate.slug === entry.slug,
        );

        if (!definition) {
          return total;
        }

        return (
          total +
          definition.roleActionRules.length +
          definition.completionRules.length +
          definition.communicationRules.length
        );
      }, 0),
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function canReadSopBackend(actor: LocalActorContext): boolean {
  const surfaceFamily = getActorSurfaceFamily(actor);

  return surfaceFamily === "staff" || surfaceFamily === "super_admin";
}

function matchesFilters(
  entry: SopLibraryEntry,
  filters: {
    query: string;
    status: SopLibraryStatusFilter;
  },
) {
  if (filters.status !== "all" && entry.status !== filters.status) {
    return false;
  }

  if (!filters.query) {
    return true;
  }

  const haystack = [
    entry.name,
    entry.slug,
    entry.summary,
    entry.versionLabel,
    entry.lastEditedBy,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(filters.query.toLowerCase());
}

function buildFilters({
  focus,
  query,
  status,
  visibleCount,
  totalCount,
}: {
  focus: string;
  query: string;
  status: SopLibraryStatusFilter;
  visibleCount: number;
  totalCount: number;
}): SopLibraryFilters {
  return {
    query,
    status,
    statusOptions: ["all", "live", "draft", "scheduled", "archived"].map((key) => ({
      key,
      label: key === "all" ? "All" : toReadableLabel(key),
      href: buildFilterHref({
        focus,
        query,
        status: key as SopLibraryStatusFilter,
      }),
      isActive: status === key,
    })),
    activeSummary: `Showing ${visibleCount} of ${totalCount} campaign definition${
      totalCount === 1 ? "" : "s"
    }.`,
    hasActiveFilters: query.length > 0 || status !== "all",
    clearHref: "/admin/sop-library",
    visibleCount,
    totalCount,
  };
}

function buildFilterHref({
  focus,
  query,
  status,
}: {
  focus: string;
  query: string;
  status: SopLibraryStatusFilter;
}) {
  const searchParams = new URLSearchParams();

  if (focus) {
    searchParams.set("focus", focus);
  }

  if (query) {
    searchParams.set("query", query);
  }

  if (status !== "all") {
    searchParams.set("status", status);
  }

  const search = searchParams.toString();
  return search ? `/admin/sop-library?${search}` : "/admin/sop-library";
}

function normalizeQuery(query: string | undefined) {
  return query?.trim() ?? "";
}

function normalizeFocus(focus: string | undefined) {
  return focus?.trim() ?? "";
}

function normalizeStatus(status: string | undefined): SopLibraryStatusFilter {
  switch (status) {
    case "live":
    case "draft":
    case "scheduled":
    case "archived":
      return status;
    default:
      return "all";
  }
}

function toReadableLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function emptyFilters(): SopLibraryFilters {
  return {
    query: "",
    status: "all",
    statusOptions: [],
    activeSummary: "Showing 0 of 0 campaign definitions.",
    hasActiveFilters: false,
    clearHref: "/admin/sop-library",
    visibleCount: 0,
    totalCount: 0,
  };
}

function emptyCounts(): SopLibraryWorkspace["counts"] {
  return {
    totalSops: 0,
    live: 0,
    inDraftOrScheduled: 0,
    archived: 0,
    totalRules: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}

function createLibraryEntry(
  definition: (typeof sopCampaignDefinitions)[number],
  filters: {
    query: string;
    status: SopLibraryStatusFilter;
  },
): SopLibraryEntry {
  return {
    key: definition.slug,
    slug: definition.slug,
    name: definition.name,
    status: definition.libraryStatus,
    builderStatus: definition.builderStatus.replaceAll("_", " "),
    summary: definition.summary,
    versionLabel: definition.version.currentLabel,
    lastEditedBy: definition.lastEditedBy,
    lastPublishedDate: definition.lastPublishedDate,
    builderHref: `/admin/sop-builder/${definition.slug}?tab=steps`,
    focusHref: buildFilterHref({
      focus: definition.slug,
      query: filters.query,
      status: filters.status,
    }),
    entryPoints: [
      {
        label: "Steps",
        href: `/admin/sop-builder/${definition.slug}?tab=steps`,
      },
      {
        label: "Role Matrix",
        href: `/admin/sop-builder/${definition.slug}?tab=role-matrix`,
      },
      {
        label: "Role Preview",
        href: `/admin/sop-builder/${definition.slug}?tab=preview`,
      },
      {
        label: "Version Review",
        href: `/admin/sop-builder/${definition.slug}?tab=version`,
      },
    ],
    stepsCount: definition.steps.length,
    roleRulesCount: definition.roleActionRules.length,
    integrationBoundariesCount: definition.integrationBoundaries.length,
  };
}
