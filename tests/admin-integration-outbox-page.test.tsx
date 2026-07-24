import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/integration-outbox",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/login/actions", () => ({
  signOut: async () => undefined,
}));

const actorMock = vi.hoisted(() => vi.fn());
const appDataMock = vi.hoisted(() => vi.fn());
const hubspotWorkspaceMock = vi.hoisted(() => vi.fn());
const lumaWorkspaceMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/local-actor-context")>();
  return { ...actual, getLocalActorContext: actorMock };
});

vi.mock("@/services/read-only-app-data", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/read-only-app-data")>();
  return { ...actual, getReadOnlyAppData: appDataMock };
});

vi.mock("@/services/admin-hubspot-sync-workspace", () => ({
  getAdminHubSpotSyncWorkspace: hubspotWorkspaceMock,
}));

vi.mock("@/services/admin-luma-sync-workspace", () => ({
  getAdminLumaSyncWorkspace: lumaWorkspaceMock,
}));

describe("admin integration outbox page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appDataMock.mockResolvedValue(
      getMockReadOnlyAppData("Testing live provider outbox readback."),
    );
    actorMock.mockResolvedValue(
      getMockLocalActorContext("super.admin@mymedlife.test"),
    );
    lumaWorkspaceMock.mockResolvedValue({
      canRead: true,
      config: { enabled: true },
      lastRun: { status: "completed" },
      counts: {
        calendars: 1,
        importedEvents: 67,
        materializedEvents: 67,
        conflicts: 0,
        openFailures: 0,
      },
    });
    hubspotWorkspaceMock.mockResolvedValue({
      canRead: true,
      config: { enabled: true },
      lastRun: { status: "completed" },
      counts: {
        companies: 8,
        contacts: 116,
        memberships: 116,
        pendingCompanies: 0,
        pendingContacts: 0,
        pendingMemberships: 0,
        materializedMemberships: 116,
        ignoredMemberships: 0,
        openFailures: 0,
      },
    });
  });

  it("renders scoped provider sync truth while keeping sends disabled", async () => {
    const { default: AdminIntegrationOutboxPage } = await import(
      "@/app/admin/integration-outbox/page"
    );
    const html = renderToStaticMarkup(await AdminIntegrationOutboxPage());

    expect(html).toContain("Integration contracts and live readback");
    expect(html).toContain("67 provider event(s) imported");
    expect(html).toContain("116 contact record(s)");
    expect(html).toContain("Luma provider writes remain disabled");
    expect(html).toContain("HubSpot writes and invitations remain disabled");
    expect(html).toContain("Databricks is downstream only");
    expect(html).toContain("Live sends");
    expect(html).not.toContain("LUMA_API_KEY");
    expect(lumaWorkspaceMock).toHaveBeenCalledOnce();
    expect(hubspotWorkspaceMock).toHaveBeenCalledOnce();
  });

  it("does not load provider workspaces for a member role", async () => {
    actorMock.mockResolvedValueOnce(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    const { default: AdminIntegrationOutboxPage } = await import(
      "@/app/admin/integration-outbox/page"
    );
    const html = renderToStaticMarkup(await AdminIntegrationOutboxPage());

    expect(html).toContain("Integration outbox hidden for this role");
    expect(lumaWorkspaceMock).not.toHaveBeenCalled();
    expect(hubspotWorkspaceMock).not.toHaveBeenCalled();
  });
});
