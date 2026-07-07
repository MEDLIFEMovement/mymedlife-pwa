import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

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

    await expect(AppSltPrepPage()).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirectTo=%2Fapp%2Fslt-prep",
    );
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
    expect(html).toContain("Preview completion packet");
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
      text: "Needs follow-up",
      email: "traveler.a@mymedlife.test",
    },
    {
      pathname: "/slt-prep/forms",
      importer: () => import("@/app/slt-prep/forms/page"),
      render: (Page) => Page({ searchParams: Promise.resolve({}) }),
      text: "Forms hub for Sofia",
      email: "traveler.a@mymedlife.test",
    },
    {
      pathname: "/slt-prep/payments",
      importer: () => import("@/app/slt-prep/payments/page"),
      render: (Page) => Page({ searchParams: Promise.resolve({}) }),
      text: "Finance view for Sofia",
      email: "traveler.a@mymedlife.test",
    },
    {
      pathname: "/slt-prep/meetings",
      importer: () => import("@/app/slt-prep/meetings/page"),
      render: (Page) => Page({ searchParams: Promise.resolve({}) }),
      text: "Meeting plan for Sofia",
      email: "traveler.a@mymedlife.test",
    },
    {
      pathname: "/slt-prep/extensions",
      importer: () => import("@/app/slt-prep/extensions/page"),
      render: (Page) => Page({ searchParams: Promise.resolve({}) }),
      text: "Optional add-ons for Sofia",
      email: "traveler.a@mymedlife.test",
    },
    {
      pathname: "/slt-prep/timeline",
      importer: () => import("@/app/slt-prep/timeline/page"),
      render: (Page) => Page({ searchParams: Promise.resolve({}) }),
      text: "Timeline to July 18, 2026",
      email: "traveler.a@mymedlife.test",
    },
    {
      pathname: "/slt-prep/notifications",
      importer: () => import("@/app/slt-prep/notifications/page"),
      render: (Page) => Page({ searchParams: Promise.resolve({}) }),
      text: "No email, SMS, or push message is sent from this app.",
      email: "traveler.a@mymedlife.test",
    },
    {
      pathname: "/slt-prep/profile",
      importer: () => import("@/app/slt-prep/profile/page"),
      render: (Page) => Page({ searchParams: Promise.resolve({}) }),
      text: "Profile and flight context for Sofia Alvarez",
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
});
