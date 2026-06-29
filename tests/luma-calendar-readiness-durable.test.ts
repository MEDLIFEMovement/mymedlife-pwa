import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  SupabaseControlClient,
  SupabaseControlSelectOptions,
} from "@/lib/supabase-control-client";
import {
  getLumaCalendarReadinessSnapshot,
  type LumaCalendarFetch,
} from "@/services/luma-calendar-readiness";

vi.mock("@/lib/supabase-control-client", () => ({
  createSupabaseControlClient: vi.fn(),
}));

describe("luma calendar readiness durable controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("honors a durable disabled Luma override before any calendar fetch can run", async () => {
    const supabaseControl = await import("@/lib/supabase-control-client");
    const fetchImpl = vi.fn() satisfies LumaCalendarFetch;
    const selectRows: SupabaseControlClient["selectRows"] = async <TRow,>() =>
      [
        {
          environment: "staging",
          flag_key: "integration_luma",
          status: "disabled",
        },
      ] as TRow[];

    vi.mocked(supabaseControl.createSupabaseControlClient).mockResolvedValue({
      persistence: {
        mode: "supabase",
        status: "ready",
        reason: "Durable feature flag control available.",
      },
      client: {
        persistence: {
          mode: "supabase",
          status: "ready",
          reason: "Durable feature flag control available.",
        },
        selectRows,
        rpc: vi.fn(),
      } satisfies SupabaseControlClient,
    });

    const snapshot = await getLumaCalendarReadinessSnapshot({
      env: {
        MYMEDLIFE_CONTROL_LAYER_SOURCE: "supabase",
        MYMEDLIFE_LUMA_ENVIRONMENT: "staging",
        LUMA_API_KEY: "secret-example-do-not-return",
        LUMA_CALENDAR_ID: "cal-7WNftYCpBJclZyG",
      },
      fetchImpl,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(snapshot.status).toBe("feature_disabled");
    expect(snapshot.detail).toBe(
      "Use app-owned events, manual RSVP posture, and no external attendee calls.",
    );
  });

  it("uses the durable override when it enables the Luma read path for local review", async () => {
    const supabaseControl = await import("@/lib/supabase-control-client");
    const selectRowsCalls = vi.fn();
    const selectRows: SupabaseControlClient["selectRows"] = async <TRow,>(
      tableName: string,
      options?: SupabaseControlSelectOptions,
    ) => {
      selectRowsCalls(tableName, options);
      return [
        {
          environment: "local",
          flag_key: "integration_luma",
          status: "enabled",
        },
      ] as TRow[];
    };
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        entries: [
          {
            id: "evt-db-id",
            api_id: "evt-api-id",
            name: "Local Luma Review Night",
            url: "https://lu.ma/local-review-night",
            start_at: "2026-07-20T23:00:00.000Z",
            end_at: "2026-07-21T00:00:00.000Z",
            timezone: "America/Los_Angeles",
            visibility: "public",
            location_type: "offline",
          },
        ],
        has_more: false,
      }),
    })) satisfies LumaCalendarFetch;

    vi.mocked(supabaseControl.createSupabaseControlClient).mockResolvedValue({
      persistence: {
        mode: "supabase",
        status: "ready",
        reason: "Durable feature flag control available.",
      },
      client: {
        persistence: {
          mode: "supabase",
          status: "ready",
          reason: "Durable feature flag control available.",
        },
        selectRows,
        rpc: vi.fn(),
      } satisfies SupabaseControlClient,
    });

    const snapshot = await getLumaCalendarReadinessSnapshot({
      env: {
        MYMEDLIFE_CONTROL_LAYER_SOURCE: "supabase",
        LUMA_API_KEY: "secret-example-do-not-return",
        LUMA_CALENDAR_ID: "cal-7WNftYCpBJclZyG",
      },
      fetchImpl,
    });

    expect(selectRowsCalls).toHaveBeenCalledWith("feature_flag_overrides", {
      select: "environment,flag_key,status",
      query: {
        environment: "eq.local",
      },
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(snapshot.status).toBe("ready");
    expect(snapshot.eventCount).toBe(1);
    expect(snapshot.safeEvents[0]?.title).toBe("Local Luma Review Night");
  });

  it("blocks the durable Luma read path when the parent events module is disabled", async () => {
    const supabaseControl = await import("@/lib/supabase-control-client");
    const fetchImpl = vi.fn() satisfies LumaCalendarFetch;
    const selectRows: SupabaseControlClient["selectRows"] = async <TRow,>() =>
      [
        {
          environment: "staging",
          flag_key: "events_luma_points",
          status: "disabled",
        },
        {
          environment: "staging",
          flag_key: "integration_luma",
          status: "enabled",
        },
      ] as TRow[];

    vi.mocked(supabaseControl.createSupabaseControlClient).mockResolvedValue({
      persistence: {
        mode: "supabase",
        status: "ready",
        reason: "Durable feature flag control available.",
      },
      client: {
        persistence: {
          mode: "supabase",
          status: "ready",
          reason: "Durable feature flag control available.",
        },
        selectRows,
        rpc: vi.fn(),
      } satisfies SupabaseControlClient,
    });

    const snapshot = await getLumaCalendarReadinessSnapshot({
      env: {
        MYMEDLIFE_CONTROL_LAYER_SOURCE: "supabase",
        MYMEDLIFE_LUMA_ENVIRONMENT: "staging",
        LUMA_API_KEY: "secret-example-do-not-return",
        LUMA_CALENDAR_ID: "cal-7WNftYCpBJclZyG",
      },
      fetchImpl,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(snapshot.status).toBe("feature_disabled");
    expect(snapshot.detail).toBe(
      "Use app-owned events, manual RSVP posture, and no external attendee calls.",
    );
  });
});
