import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

vi.mock("@/services/review-packet-registry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/review-packet-registry")>();

  return {
    ...actual,
    upsertReviewPacketRecord: vi.fn(),
  };
});

describe("launch gate packet actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records a production packet value for a DS admin reviewer", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const registryModule = await import("@/services/review-packet-registry");
    const navigationModule = await import("next/navigation");
    const { recordProductionLaunchPacketAction } = await import("@/app/admin/launch-gate/actions");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );

    await expect(
      recordProductionLaunchPacketAction(
        formDataFor({
          returnTo: "/admin/launch-gate",
          recordKey: "MYMEDLIFE_PRODUCTION_SUPABASE_PROJECT_REF",
          value: "prod-abc123",
          reason: "Recorded the approved production project ref.",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/admin/launch-gate?");

    expect(registryModule.upsertReviewPacketRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "production_launch",
        recordKey: "MYMEDLIFE_PRODUCTION_SUPABASE_PROJECT_REF",
        value: "prod-abc123",
      }),
    );
    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith(
      expect.stringContaining("launchPacketResult=success"),
    );
  });

  it("rejects unknown production packet keys before any write runs", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const registryModule = await import("@/services/review-packet-registry");
    const navigationModule = await import("next/navigation");
    const { recordProductionLaunchPacketAction } = await import("@/app/admin/launch-gate/actions");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );

    await expect(
      recordProductionLaunchPacketAction(
        formDataFor({
          returnTo: "/admin/launch-gate",
          recordKey: "MYMEDLIFE_BAD_FIELD",
          value: "nope",
          reason: "Invalid key should fail.",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/admin/launch-gate?");

    expect(registryModule.upsertReviewPacketRecord).not.toHaveBeenCalled();
    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith(
      expect.stringContaining("Choose+a+valid+production+packet+field"),
    );
  });

  it("rejects placeholder values for concrete production packet fields", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const registryModule = await import("@/services/review-packet-registry");
    const navigationModule = await import("next/navigation");
    const { recordProductionLaunchPacketAction } = await import("@/app/admin/launch-gate/actions");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );

    await expect(
      recordProductionLaunchPacketAction(
        formDataFor({
          returnTo: "/admin/launch-gate",
          recordKey: "MYMEDLIFE_PRODUCTION_DNS_OWNER",
          value: "pending HQ/platform",
          reason: "Placeholder owners should not be recorded as final readiness.",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/admin/launch-gate?");

    expect(registryModule.upsertReviewPacketRecord).not.toHaveBeenCalled();
    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith(
      expect.stringContaining(
        "This+production+packet+field+must+use+a+concrete+value%2C+not+a+placeholder",
      ),
    );
  });
});

function formDataFor(input: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(input)) {
    formData.set(key, value);
  }

  return formData;
}
