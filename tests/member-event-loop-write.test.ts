import { describe, expect, it } from "vitest";

import {
  getMemberEventLoopWriteConfig,
  mapMemberEventLoopWriteResultMessage,
} from "@/services/member-event-loop-write";

describe("member event-loop write gate", () => {
  it("stays disabled by default", () => {
    expect(getMemberEventLoopWriteConfig({})).toMatchObject({
      enabled: false,
      environment: "local",
      externalWritesEnabled: false,
    });
  });

  it("requires a server-only service-role key", () => {
    expect(
      getMemberEventLoopWriteConfig({
        MYMEDLIFE_ENABLE_MEMBER_EVENT_LOOP_WRITE: "true",
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "Member event-loop writes are disabled because the server-only Supabase service-role key is missing.",
    });
  });

  it("requires explicit production approval before enabling production writes", () => {
    expect(
      getMemberEventLoopWriteConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        MYMEDLIFE_ENABLE_MEMBER_EVENT_LOOP_WRITE: "true",
        SUPABASE_SERVICE_ROLE_KEY: "server-only",
      }),
    ).toMatchObject({
      enabled: false,
      environment: "production",
    });
  });

  it("enables only the internal event loop when both production flags are approved", () => {
    expect(
      getMemberEventLoopWriteConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        MYMEDLIFE_ENABLE_MEMBER_EVENT_LOOP_WRITE: "true",
        MYMEDLIFE_ALLOW_PRODUCTION_MEMBER_EVENT_LOOP_WRITE: "true",
        SUPABASE_SERVICE_ROLE_KEY: "server-only",
      }),
    ).toMatchObject({
      enabled: true,
      environment: "production",
      externalWritesEnabled: false,
    });
  });

  it("maps check-in success to the duplicate-points honesty message", () => {
    expect(mapMemberEventLoopWriteResultMessage("checked_in")).toMatchObject({
      tone: "success",
      message:
        "Check-in recorded, attendance updated, and points awarded once in the myMEDLIFE ledger. External writes stayed off.",
    });
  });
});
