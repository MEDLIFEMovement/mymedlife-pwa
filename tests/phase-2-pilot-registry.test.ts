import { describe, expect, it } from "vitest";
import type { createSupabaseAppClient } from "@/lib/supabase-app-client";
import {
  getPhase2PilotRegistry,
  getPhase2PilotRegistryDurable,
} from "@/services/phase-2-pilot-registry";

describe("phase 2 pilot registry", () => {
  it("starts with recommended defaults and pending owner slots", () => {
    const registry = getPhase2PilotRegistry({});

    expect(registry.counts.defaultsRecorded).toBe(0);
    expect(registry.counts.defaultsPending).toBe(7);
    expect(registry.counts.ownersRecorded).toBe(0);
    expect(registry.counts.ownersPending).toBe(7);
    expect(
      registry.defaults.find((item) => item.key === "pilot_chapter")?.value,
    ).toBe("UCLA MEDLIFE");
    expect(
      registry.owners.find((item) => item.key === "support_owner")?.value,
    ).toBe("pending HQ ops");
    expect(
      registry.owners.find((item) => item.key === "rollback_owner")?.value,
    ).toBe("pending Kiomi");
    expect(registry.approvalReplyBlock[0]).toBe("approved as written");
    expect(registry.source.mode).toBe("env");
    expect(registry.records).toEqual([]);
  });

  it("records final answers when explicit pilot values are supplied", () => {
    const registry = getPhase2PilotRegistry({
      MYMEDLIFE_PILOT_CHAPTER: "Boston College MEDLIFE",
      MYMEDLIFE_PILOT_FIRST_HOSTED_WRITE: "`action_started`",
      MYMEDLIFE_PILOT_COACH_OWNER: "Priya Coach",
      MYMEDLIFE_PILOT_SUPPORT_OWNER: "Maya Support",
      MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL: "#mymedlife-pilot-watch",
    });

    expect(registry.counts.defaultsRecorded).toBe(2);
    expect(registry.counts.ownersRecorded).toBe(3);
    expect(
      registry.defaults.find((item) => item.key === "pilot_chapter")?.status,
    ).toBe("recorded_final");
    expect(
      registry.defaults.find((item) => item.key === "pilot_chapter")?.value,
    ).toBe("Boston College MEDLIFE");
    expect(
      registry.owners.find((item) => item.key === "coach_owner")?.status,
    ).toBe("recorded_owner");
    expect(
      registry.owners.find((item) => item.key === "support_owner")?.value,
    ).toBe("Maya Support");
    expect(
      registry.owners.find((item) => item.key === "support_pause_channel")?.value,
    ).toBe("#mymedlife-pilot-watch");
    expect(registry.approvalReplyBlock.join("\n")).toContain(
      "Coach owner: Priya Coach",
    );
    expect(registry.approvalReplyBlock.join("\n")).toContain(
      "Support owner: Maya Support",
    );
  });

  it("keeps placeholder owner notes visible without treating them as recorded owners", () => {
    const registry = getPhase2PilotRegistry({
      MYMEDLIFE_PILOT_SUPPORT_OWNER: "pending HQ ops",
      MYMEDLIFE_PILOT_COACH_OWNER: "TBD coach lead",
      MYMEDLIFE_PILOT_ROLLBACK_OWNER: "not yet assigned",
    });

    expect(registry.counts.ownersRecorded).toBe(0);
    expect(registry.counts.ownersPending).toBe(7);
    expect(
      registry.owners.find((item) => item.key === "support_owner")?.value,
    ).toBe("pending HQ ops");
    expect(
      registry.owners.find((item) => item.key === "support_owner")?.status,
    ).toBe("pending_named_owner");
    expect(
      registry.owners.find((item) => item.key === "coach_owner")?.status,
    ).toBe("pending_named_owner");
    expect(
      registry.owners.find((item) => item.key === "rollback_owner")?.status,
    ).toBe("pending_named_owner");
  });

  it("prefers Supabase review packet rows when the durable packet exists", async () => {
    const registry = await getPhase2PilotRegistryDurable(
      {},
      {
        createClient: (async () => ({
          persistence: {
            mode: "supabase",
            status: "ready",
            reason: "test",
            isLocalOnly: false,
          },
          client: {
            persistence: {
              mode: "supabase",
              status: "ready",
              reason: "test",
              isLocalOnly: false,
            },
            selectRows: async <TRow>() =>
              [
              {
                id: "row-1",
                category: "pilot_scope" as const,
                record_key: "MYMEDLIFE_PILOT_CHAPTER",
                value: "Boston College MEDLIFE",
                reason: "Approved pilot chapter.",
                actor_role: "admin" as const,
                updated_by: "user-1",
                updated_at: "2026-06-29T22:00:00.000Z",
              },
              {
                id: "row-2",
                category: "pilot_scope" as const,
                record_key: "MYMEDLIFE_PILOT_ROLLBACK_OWNER",
                value: "Kiomi Matsukawa",
                reason: "Approved rollback owner.",
                actor_role: "admin" as const,
                updated_by: "user-1",
                updated_at: "2026-06-29T22:00:00.000Z",
              },
            ] as TRow[],
            rpc: async <TResult>() => [] as TResult,
            insertRows: async <TRow>() => [] as TRow[],
            upsertRows: async <TRow>() => [] as TRow[],
            updateRows: async <TRow>() => [] as TRow[],
          },
        })) as unknown as typeof createSupabaseAppClient,
      },
    );

    expect(registry.source.mode).toBe("supabase");
    expect(registry.source.recordCount).toBe(2);
    expect(registry.records).toHaveLength(2);
    expect(
      registry.defaults.find((item) => item.key === "pilot_chapter")?.value,
    ).toBe("Boston College MEDLIFE");
    expect(
      registry.owners.find((item) => item.key === "rollback_owner")?.value,
    ).toBe("Kiomi Matsukawa");
  });
});
