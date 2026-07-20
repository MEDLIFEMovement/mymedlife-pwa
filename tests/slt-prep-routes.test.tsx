import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getToneClassName } from "@/components/slt-prep-primitives";
import { mockSltTripTravelers } from "@/data/mock-slt-trip-prep";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { getSltTripPrepWorkspace } from "@/services/slt-trip-prep-workspace";

let mockPathname = "/slt-prep";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

vi.mock("@/services/read-only-app-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/read-only-app-data")>();

  return {
    ...actual,
    getReadOnlyAppData: vi.fn(),
  };
});

function setSignedInActor(email: string) {
  return getMockLocalActorContext(
    email,
    "Using signed-in test actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

async function primeSignedInActor(email = "traveler.a@mymedlife.test") {
  const actorModule = await import("@/services/local-actor-context");
  const dataModule = await import("@/services/read-only-app-data");

  vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(setSignedInActor(email));
  vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
    getMockReadOnlyAppData("Testing SLT Prep preview surfaces."),
  );
}

describe("SLT Prep routes", () => {
  afterEach(() => {
    mockPathname = "/slt-prep";
    vi.clearAllMocks();
    vi.doUnmock("@/app/slt-prep/page-context");
    vi.doUnmock("@/services/slt-trip-prep-workspace");
    vi.resetModules();
  });

  it("redirects the /app/slt-prep alias to login when there is no signed-in session", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("traveler.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing signed-out SLT Prep alias."),
    );

    const { default: AppSltPrepPage } = await import("@/app/app/slt-prep/page");

    await expect(AppSltPrepPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirectTo=%2Fapp%2Fslt-prep",
    );
  });

  it("renders the /app/slt-prep alias inside the member shell instead of the standalone SLT quick nav", async () => {
    mockPathname = "/app/slt-prep";
    await primeSignedInActor("traveler.a@mymedlife.test");

    const { default: AppSltPrepPage } = await import("@/app/app/slt-prep/page");
    const html = renderToStaticMarkup(await AppSltPrepPage({}));

    expect(html).toContain('href="/app/stories"');
    expect(html).toContain('href="/app/events"');
    expect(html).toContain('href="/app/points"');
    expect(html).toContain('href="/profile"');
    expect(html).not.toContain('href="/rush-month/events"');
  });

  it("keeps the member SLT home handoff inside the bottom-nav shell with a route back home", async () => {
    mockPathname = "/app/slt-prep";
    await primeSignedInActor("traveler.a@mymedlife.test");

    const { default: AppSltPrepPage } = await import("@/app/app/slt-prep/page");
    const html = renderToStaticMarkup(
      await AppSltPrepPage({
        searchParams: Promise.resolve({ source: "home" }),
      }),
    );

    expect(html).toContain("Opened from the TEST member home");
    expect(html).toContain('href="/app"');
    expect(html).toContain('href="/profile?source=home"');
    expect(html).toContain('aria-label="Member bottom navigation"');
  });

  it("keeps the member SLT campaigns handoff inside the same student shell with a route back to campaigns", async () => {
    mockPathname = "/app/slt-prep";
    await primeSignedInActor("traveler.a@mymedlife.test");

    const { default: AppSltPrepPage } = await import("@/app/app/slt-prep/page");
    const html = renderToStaticMarkup(
      await AppSltPrepPage({
        searchParams: Promise.resolve({ source: "campaigns" }),
      }),
    );

    expect(html).toContain("Opened from the TEST campaign shell");
    expect(html).toContain('href="/campaigns"');
    expect(html).toContain('href="/profile"');
    expect(html).toContain('aria-label="Member bottom navigation"');
  });

  it("renders the checklist detail preview packet with the admin handoff still blocked from writes", async () => {
    mockPathname = "/slt-prep/checklist/second-installment";
    await primeSignedInActor("admin@mymedlife.test");

    const { default: ChecklistDetailPage } = await import(
      "@/app/slt-prep/checklist/[itemId]/page"
    );
    const html = renderToStaticMarkup(
      await ChecklistDetailPage({
        params: Promise.resolve({ itemId: "second-installment" }),
        searchParams: Promise.resolve({ preview: "complete" }),
      }),
    );

    expect(html).toContain("Completion preview");
    expect(html).toContain("Open admin packet");
    expect(html).toContain("Review payment status");
    expect(html).toContain("TEST Trip deposit and installment");
  });

  it("keeps the SLT overview blocked for DS Admin readers", async () => {
    mockPathname = "/slt-prep";
    await primeSignedInActor("ds.admin@mymedlife.test");

    const { default: SltPrepPage } = await import("@/app/slt-prep/page");
    const html = renderToStaticMarkup(await SltPrepPage({}));

    expect(html).toContain("Trip prep is hidden for DS Admin");
    expect(html).toContain("Open integration outbox");
  });

  it("renders the source-backed SLT overview fallback states when no deadline or meeting is active", async () => {
    const actor = setSignedInActor("traveler.a@mymedlife.test");
    const workspace = getSltTripPrepWorkspace(actor);

    if (!workspace.traveler) {
      throw new Error("Expected traveler preview workspace.");
    }

    const customWorkspace = {
      ...workspace,
      readiness: {
        score: 100,
        tone: "green" as const,
        label: "100% ready • mostly on track",
      },
      traveler: {
        ...workspace.traveler,
        riskLevel: "low" as const,
        alerts: [
          {
            ...workspace.traveler.alerts[0],
            tone: "green" as const,
            label: "All trip prep blockers are cleared",
            summary: "The remaining surfaces stay visible, but no live traveler writes run here.",
            dueLabel: "Cleared",
            href: "/slt-prep/checklist",
          },
        ],
        meetings: workspace.traveler.meetings.map((meeting) => ({
          ...meeting,
          status: "attended" as const,
        })),
        timeline: workspace.traveler.timeline.map((event) => ({
          ...event,
          status: "complete" as const,
        })),
        checklist: workspace.traveler.checklist.filter((item) => item.category !== "Preparation"),
      },
    };

    vi.doMock("@/app/slt-prep/page-context", () => ({
      getSltPrepPageContext: vi.fn().mockResolvedValue({
        actor,
        data: getMockReadOnlyAppData("Testing completed traveler SLT preview."),
      }),
    }));

    vi.doMock("@/services/slt-trip-prep-workspace", async (importOriginal) => {
      const actual = await importOriginal<typeof import("@/services/slt-trip-prep-workspace")>();

      return {
        ...actual,
        getSltTripPrepWorkspace: vi.fn(() => customWorkspace),
      };
    });

    const { default: SltPrepPage } = await import("@/app/slt-prep/page");
    const html = renderToStaticMarkup(await SltPrepPage({}));

    expect(html).toContain("You&#x27;re on track");
    expect(html).toContain("No open deadlines remain in this preview.");
    expect(html).toContain("No upcoming pre-trip meetings are visible right now.");
    expect(html).toContain("Future wired");
  });

  it("keeps the traveler home handoff route-backed with TEST-labeled SLT preview content", async () => {
    await primeSignedInActor("traveler.a@mymedlife.test");

    const { default: AppSltPrepPage } = await import("@/app/app/slt-prep/page");
    const html = renderToStaticMarkup(
      await AppSltPrepPage({
        searchParams: Promise.resolve({ source: "home" }),
      }),
    );

    expect(html).toContain("TEST Peru SLT");
    expect(html).toContain("TEST Lima and Cusco, Peru");
    expect(html).toContain("TEST Return flight still needs final confirmation");
    expect(html).toContain("TEST Payment milestones mirror Shopify states without creating or editing live orders.");
  });

  type SltPrepRoutePage = (props: {
    searchParams: Promise<Record<string, string>>;
  }) => Promise<ReactNode>;

  type RouteHarness = {
    pathname: string;
    importer: () => Promise<{ default: SltPrepRoutePage }>;
    render: (Page: SltPrepRoutePage) => Promise<ReactNode>;
    text: string;
    email: string;
  };

  const previewRoutes: RouteHarness[] = [
    {
      pathname: "/slt-prep/checklist",
      importer: () => import("@/app/slt-prep/checklist/page"),
      render: (Page) =>
        Page({ searchParams: Promise.resolve({ filter: "needs_attention" }) }),
      text: "Open each missing or due-soon item",
      email: "traveler.a@mymedlife.test",
    },
    {
      pathname: "/slt-prep/forms",
      importer: () => import("@/app/slt-prep/forms/page"),
      render: (Page) => Page({ searchParams: Promise.resolve({}) }),
      text: "Student-friendly form language",
      email: "traveler.a@mymedlife.test",
    },
    {
      pathname: "/slt-prep/payments",
      importer: () => import("@/app/slt-prep/payments/page"),
      render: (Page) => Page({ searchParams: Promise.resolve({}) }),
      text: "Readable without live checkout",
      email: "traveler.a@mymedlife.test",
    },
    {
      pathname: "/slt-prep/meetings",
      importer: () => import("@/app/slt-prep/meetings/page"),
      render: (Page) => Page({ searchParams: Promise.resolve({}) }),
      text: "Required preparation touchpoints",
      email: "traveler.a@mymedlife.test",
    },
    {
      pathname: "/slt-prep/extensions",
      importer: () => import("@/app/slt-prep/extensions/page"),
      render: (Page) => Page({ searchParams: Promise.resolve({}) }),
      text: "Understand the choices without live booking",
      email: "traveler.a@mymedlife.test",
    },
    {
      pathname: "/slt-prep/timeline",
      importer: () => import("@/app/slt-prep/timeline/page"),
      render: (Page) => Page({ searchParams: Promise.resolve({}) }),
      text: "Everything in sequence",
      email: "traveler.a@mymedlife.test",
    },
    {
      pathname: "/slt-prep/notifications",
      importer: () => import("@/app/slt-prep/notifications/page"),
      render: (Page) => Page({ searchParams: Promise.resolve({}) }),
      text: "No email, SMS, push, reminder, or provider sync fires from this notification center.",
      email: "traveler.a@mymedlife.test",
    },
    {
      pathname: "/slt-prep/profile",
      importer: () => import("@/app/slt-prep/profile/page"),
      render: (Page) => Page({ searchParams: Promise.resolve({}) }),
      text: "Source-confidence note",
      email: "traveler.a@mymedlife.test",
    },
    {
      pathname: "/slt-prep/staff",
      importer: () => import("@/app/slt-prep/staff/page"),
      render: (Page) =>
        Page({
          searchParams: Promise.resolve({
            risk: "high",
            focus: "payments",
            bulk: "meeting-makeup",
          }),
        }),
      text: "No Luma event, email, or SMS write runs.",
      email: "coach@mymedlife.test",
    },
  ];

  it.each(previewRoutes)(
    "renders $pathname as an honest preview surface",
    async ({ pathname, importer, render, text, email }) => {
      mockPathname = pathname;
      await primeSignedInActor(email);

      const routeModule = await importer();
      const html = renderToStaticMarkup(await render(routeModule.default));

      expect(html).toContain(text);
    },
  );

  it.each([
    [
      "/slt-prep/forms",
      () => import("@/app/slt-prep/forms/page"),
      "TEST Medical clearance",
      "Required Forms",
    ],
    [
      "/slt-prep/payments",
      () => import("@/app/slt-prep/payments/page"),
      "TEST Trip deposit",
      "Payment Status",
    ],
    [
      "/slt-prep/meetings",
      () => import("@/app/slt-prep/meetings/page"),
      "TEST Final traveler orientation",
      "Pre-Trip Meetings",
    ],
    [
      "/slt-prep/extensions",
      () => import("@/app/slt-prep/extensions/page"),
      "TEST Cusco weekend tour",
      "Extensions &amp; Tours",
    ],
    [
      "/slt-prep/timeline",
      () => import("@/app/slt-prep/timeline/page"),
      "TEST Traveler packet nearly ready",
      "Trip Timeline",
    ],
    [
      "/slt-prep/notifications",
      () => import("@/app/slt-prep/notifications/page"),
      "TEST You are on track for departure",
      "Notifications",
    ],
    [
      "/slt-prep/profile",
      () => import("@/app/slt-prep/profile/page"),
      "TEST Anita Patel",
      "Traveler Profile",
    ],
  ])(
    "labels seeded child-page data without relabeling the %s module",
    async (pathname, importer, expectedTestData, expectedModuleLabel) => {
      mockPathname = pathname;
      await primeSignedInActor("super.admin@mymedlife.test");

      const routeModule = await importer();
      const html = renderToStaticMarkup(
        await routeModule.default({
          searchParams: Promise.resolve({ traveler: "aria-patel" }),
        }),
      );

      expect(html).toContain(expectedTestData);
      expect(html).toContain(expectedModuleLabel);
      expect(html).not.toContain(`TEST ${expectedModuleLabel}`);
      expect(html).toContain("traveler=aria-patel");
    },
  );

  it("keeps seeded staff traveler identities and summaries visibly TEST-labeled", async () => {
    mockPathname = "/slt-prep/staff";
    await primeSignedInActor("coach@mymedlife.test");

    const { default: StaffPage } = await import("@/app/slt-prep/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          traveler: "sofia-alvarez",
          focus: "flights",
        }),
      }),
    );

    expect(html).toContain("TEST Sofia Alvarez");
    expect(html).toContain("TEST UCLA MEDLIFE");
    expect(html).toContain("TEST Peru SLT | July 2026");
    expect(html).toContain("TEST Staff needs the final return itinerary upload");
  });

  it("keeps risk-filter URLs and selected traveler details aligned", async () => {
    mockPathname = "/slt-prep/staff";
    await primeSignedInActor("coach@mymedlife.test");

    const { default: StaffPage } = await import("@/app/slt-prep/staff/page");
    const html = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({
          risk: "high",
          traveler: "sofia-alvarez",
        }),
      }),
    );

    expect(html).toContain("TEST Daniel Kim");
    expect(html).toContain('href="/slt-prep/staff?risk=high"');
    expect(html).not.toContain("risk=high&amp;traveler=sofia-alvarez");
  });

  it("preserves the selected staff traveler through the mobile SLT route family", async () => {
    mockPathname = "/slt-prep/staff";
    await primeSignedInActor("super.admin@mymedlife.test");

    const { default: StaffPage } = await import("@/app/slt-prep/staff/page");
    const staffHtml = renderToStaticMarkup(
      await StaffPage({
        searchParams: Promise.resolve({ traveler: "aria-patel" }),
      }),
    );

    expect(staffHtml).toContain('href="/slt-prep?traveler=aria-patel"');
    expect(staffHtml).toContain("Open selected traveler mobile view");

    const { default: SltPrepPage } = await import("@/app/slt-prep/page");
    const overviewHtml = renderToStaticMarkup(
      await SltPrepPage({
        searchParams: Promise.resolve({ traveler: "aria-patel" }),
      }),
    );

    expect(overviewHtml).toContain("TEST UT Austin MEDLIFE");
    expect(overviewHtml).toContain('href="/slt-prep/forms?traveler=aria-patel"');

    const { default: ChecklistPage } = await import("@/app/slt-prep/checklist/page");
    const checklistHtml = renderToStaticMarkup(
      await ChecklistPage({
        searchParams: Promise.resolve({ traveler: "aria-patel", filter: "all" }),
      }),
    );

    expect(checklistHtml).toContain("traveler=aria-patel");
    expect(checklistHtml).toContain("/slt-prep/checklist/passport-proof?traveler=aria-patel");
  });

  it.each([
    ["medical-clearance", "Review form status"],
    ["orientation-rsvp", "Open meeting status"],
    ["extension-choice", "Review extensions"],
    ["passport-proof", "Open traveler profile"],
  ])(
    "routes checklist detail action copy honestly for %s",
    async (itemId, expectedLabel) => {
      mockPathname = `/slt-prep/checklist/${itemId}`;
      await primeSignedInActor("traveler.a@mymedlife.test");

      const { default: ChecklistDetailPage } = await import(
        "@/app/slt-prep/checklist/[itemId]/page"
      );
      const html = renderToStaticMarkup(
        await ChecklistDetailPage({
          params: Promise.resolve({ itemId }),
          searchParams: Promise.resolve({}),
        }),
      );

      expect(html).toContain(expectedLabel);
    },
  );

  it("keeps the green preview tone class available for completed SLT states", () => {
    expect(getToneClassName("green")).toBe(
      "border-emerald-300/30 bg-emerald-300/15 text-emerald-100",
    );
    expect(getToneClassName("green", "light")).toBe(
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    );
    expect(mockSltTripTravelers[0]?.alerts[2]?.tone).toBe("green");
  });
});
