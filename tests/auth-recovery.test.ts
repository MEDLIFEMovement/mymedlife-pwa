import { describe, expect, it } from "vitest";

import { getAuthRecoveryRedirectUrl } from "@/services/auth-recovery";

describe("auth recovery redirect", () => {
  it("builds the production callback from the trusted configured site URL", () => {
    expect(
      getAuthRecoveryRedirectUrl("/leader?view=events", {
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
      }),
    ).toBe(
      "https://www.mymedlife.org/auth/callback?type=recovery&next=update-password&redirectTo=%2Fleader%3Fview%3Devents",
    );
  });

  it("rejects external continuation URLs", () => {
    expect(
      getAuthRecoveryRedirectUrl("https://attacker.example", {
        MYMEDLIFE_AUTH_MODE: "production_supabase",
      }),
    ).toBe(
      "https://www.mymedlife.org/auth/callback?type=recovery&next=update-password&redirectTo=%2F",
    );
  });

  it("uses localhost for local auth without a configured site URL", () => {
    expect(
      getAuthRecoveryRedirectUrl("/app", {
        MYMEDLIFE_AUTH_MODE: "local_supabase",
      }),
    ).toBe(
      "http://127.0.0.1:3000/auth/callback?type=recovery&next=update-password&redirectTo=%2Fapp",
    );
  });
});
