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

describe("pilot scope packet actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records a pilot packet value for an admin reviewer", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const registryModule = await import("@/services/review-packet-registry");
    const navigationModule = await import("next/navigation");
    const { recordPilotScopePacketAction } = await import("@/app/admin/pilot-scope/actions");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );

    await expect(
      recordPilotScopePacketAction(
        formDataFor({
          returnTo: "/admin/pilot-scope",
          recordKey: "MYMEDLIFE_PILOT_CHAPTER",
          value: "Boston College MEDLIFE",
          reason: "Nick approved the first pilot chapter.",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/admin/pilot-scope?");

    expect(registryModule.upsertReviewPacketRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "pilot_scope",
        recordKey: "MYMEDLIFE_PILOT_CHAPTER",
        value: "Boston College MEDLIFE",
      }),
    );
    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith(
      expect.stringContaining("pilotPacketResult=success"),
    );
  });

  it("blocks student actors before any pilot packet write runs", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const registryModule = await import("@/services/review-packet-registry");
    const navigationModule = await import("next/navigation");
    const { recordPilotScopePacketAction } = await import("@/app/admin/pilot-scope/actions");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );

    await expect(
      recordPilotScopePacketAction(
        formDataFor({
          returnTo: "/admin/pilot-scope",
          recordKey: "MYMEDLIFE_PILOT_CHAPTER",
          value: "Boston College MEDLIFE",
          reason: "A student should not be able to set pilot scope.",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/admin/pilot-scope?");

    expect(registryModule.upsertReviewPacketRecord).not.toHaveBeenCalled();
    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith(
      expect.stringContaining("Only+HQ%2FAdmin%2C+DS+Admin%2C+or+Super+Admin+can+update+pilot+packet+values"),
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
