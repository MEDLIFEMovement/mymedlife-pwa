import { describe, expect, it } from "vitest";

import { parseAuthRecoveryFragment } from "@/services/auth-recovery-fragment";

describe("auth recovery fragment", () => {
  it("extracts a complete recovery session", () => {
    expect(
      parseAuthRecoveryFragment(
        "#access_token=access-123&refresh_token=refresh-456&type=recovery",
      ),
    ).toEqual({
      accessToken: "access-123",
      refreshToken: "refresh-456",
    });
  });

  it.each([
    "",
    "#access_token=access-123&type=recovery",
    "#refresh_token=refresh-456&type=recovery",
    "#access_token=access-123&refresh_token=refresh-456&type=invite",
  ])("rejects incomplete or non-recovery fragments: %s", (hash) => {
    expect(parseAuthRecoveryFragment(hash)).toBeNull();
  });
});
