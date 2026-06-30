import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  SupabaseControlClient,
  SupabaseControlSelectOptions,
} from "@/lib/supabase-control-client";
import type { LumaLivePilotEnv, LumaLivePilotFetch } from "@/services/luma-live-pilot";

vi.mock("@/lib/supabase-control-client", () => ({
  createSupabaseControlClient: vi.fn(),
}));

const enabledEnv: LumaLivePilotEnv & Record<string, string> = {
  LUMA_API_KEY: "secret-example-do-not-return",
  LUMA_CALENDAR_ID: "cal-7WNftYCpBJclZyG",
  MYMEDLIFE_ENABLE_LUMA_WRITES: "true",
  MYMEDLIFE_ENABLE_LUMA_EVENT_WRITES: "true",
  MYMEDLIFE_ENABLE_LUMA_RSVP_WRITES: "true",
  MYMEDLIFE_ENABLE_LUMA_ATTENDANCE_IMPORT: "true",
  MYMEDLIFE_LUMA_ENVIRONMENT: "staging",
  VERCEL_ENV: "preview",
  MYMEDLIFE_CONTROL_LAYER_SOURCE: "supabase",
};

describe("Luma live pilot durable feature-flag control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks Luma API calls when the Supabase-backed integration_luma flag is disabled", async () => {
    const supabaseControl = await import("@/lib/supabase-control-client");
    const { createOrUpdateLumaEvent, getLumaLivePilotGateDurable } = await import(
      "@/services/luma-live-pilot"
    );
    const selectRowsCalls: Array<[string, unknown]> = [];
    const selectRows: SupabaseControlClient["selectRows"] = async <TRow,>(
      tableName: string,
      options?: SupabaseControlSelectOptions,
    ) => {
      selectRowsCalls.push([tableName, options]);
      return [
        {
          environment: "staging",
          flag_key: "integration_luma",
          status: "disabled",
        },
      ] as TRow[];
    };
    const rpc = vi.fn();
    const fetchImpl = vi.fn() satisfies LumaLivePilotFetch;

    vi.mocked(supabaseControl.createSupabaseControlClient).mockResolvedValue({
      persistence: {
        mode: "supabase",
        status: "ready",
        reason: "Testing durable Luma flag state.",
      },
      client: {
        persistence: {
          mode: "supabase",
          status: "ready",
          reason: "Testing durable Luma flag state.",
        },
        selectRows,
        rpc,
      } satisfies SupabaseControlClient,
    });

    const gate = await getLumaLivePilotGateDurable(enabledEnv);
    const result = await createOrUpdateLumaEvent(
      {
        name: "Should not reach Luma",
        startAt: "2026-07-20T23:00:00.000Z",
        timezone: "America/Los_Angeles",
      },
      { env: enabledEnv, fetchImpl },
    );

    expect(gate).toMatchObject({
      enabledOperations: 0,
      eventWritesEnabled: false,
      rsvpWritesEnabled: false,
      attendanceImportEnabled: false,
    });
    expect(gate.detail).toContain("manual RSVP posture");
    expect(selectRowsCalls).toContainEqual(["feature_flag_overrides", {
      select: "environment,flag_key,status",
      query: {
        environment: "eq.staging",
      },
    }]);
    expect(result).toMatchObject({
      status: "blocked",
      externalWrites: 0,
      externalReads: 0,
      secretsReturned: false,
    });
    expect(result.safeMessage).toContain("manual RSVP posture");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fails closed before Luma API calls when durable feature-flag readback fails", async () => {
    const supabaseControl = await import("@/lib/supabase-control-client");
    const { writeLumaRsvp } = await import("@/services/luma-live-pilot");
    const fetchImpl = vi.fn() satisfies LumaLivePilotFetch;

    vi.mocked(supabaseControl.createSupabaseControlClient).mockResolvedValue({
      persistence: {
        mode: "supabase",
        status: "ready",
        reason: "Testing durable Luma flag failure.",
      },
      client: {
        persistence: {
          mode: "supabase",
          status: "ready",
          reason: "Testing durable Luma flag failure.",
        },
        selectRows: async () => {
          throw new Error("control table unavailable");
        },
        rpc: vi.fn(),
      } satisfies SupabaseControlClient,
    });

    const result = await writeLumaRsvp(
      {
        eventId: "evt-existing",
        email: "member.a@mymedlife.test",
        name: "Member A",
      },
      { env: enabledEnv, fetchImpl },
    );

    expect(result).toMatchObject({
      status: "blocked",
      externalWrites: 0,
      externalReads: 0,
      secretsReturned: false,
    });
    expect(result.safeMessage).toContain("could not be verified from durable controls");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
