import { beforeEach, describe, expect, it } from "vitest";

import { needsFreshProductionStepUp } from "@/services/admin-integrations-step-up";
import {
  getStepUpFailureState,
  recordStepUpFailure,
  resetIntegrationStoreForTests,
} from "@/services/admin-integrations-store";

describe("admin integrations step-up state", () => {
  beforeEach(() => {
    resetIntegrationStoreForTests();
  });

  it("blocks the session after repeated failed step-up attempts", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordStepUpFailure("ds-admin-user");
    }

    const state = getStepUpFailureState("ds-admin-user");

    expect(state.count).toBe(5);
    expect(state.blockedUntil).not.toBeNull();
  });

  it("clears the cooldown after the block window passes", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordStepUpFailure("ds-admin-user");
    }

    const blockedState = getStepUpFailureState("ds-admin-user");
    const releasedState = getStepUpFailureState(
      "ds-admin-user",
      new Date(new Date(blockedState.blockedUntil ?? 0).getTime() + 1_000),
    );

    expect(releasedState.count).toBe(0);
    expect(releasedState.blockedUntil).toBeNull();
  });

  it("treats missing or stale verification as not fresh enough for production", () => {
    expect(
      needsFreshProductionStepUp({
        isVerified: false,
        status: "missing",
        method: null,
        sessionId: null,
        verifiedAt: null,
        expiresAt: null,
        failureCount: 0,
        blockedUntil: null,
        message: "Missing verification.",
      }),
    ).toBe(true);

    expect(
      needsFreshProductionStepUp(
        {
          isVerified: true,
          status: "verified",
          method: "local_password_reauth",
          sessionId: "stale",
          verifiedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 4 * 60 * 1000).toISOString(),
          failureCount: 0,
          blockedUntil: null,
          message: "Verified earlier.",
        },
        new Date(),
      ),
    ).toBe(true);

    expect(
      needsFreshProductionStepUp(
        {
          isVerified: true,
          status: "verified",
          method: "local_password_reauth",
          sessionId: "fresh",
          verifiedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
          failureCount: 0,
          blockedUntil: null,
          message: "Verified recently.",
        },
        new Date(),
      ),
    ).toBe(false);
  });
});
