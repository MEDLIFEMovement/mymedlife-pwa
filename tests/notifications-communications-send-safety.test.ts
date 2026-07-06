import { describe, expect, it } from "vitest";

import {
  formatNotificationsSendSafetyContract,
  getNotificationsSendSafetyContract,
} from "@/services/notifications-communications-send-safety";

describe("notifications and communications send safety", () => {
  it("keeps all notification-looking surfaces out of production proof and live sends", () => {
    const contract = getNotificationsSendSafetyContract();

    expect(contract.rolloutFlagPosture).toMatchObject({
      key: "n8n_send",
      approvalPolicy: "production_blocked",
      defaultEnabledByEnvironment: {
        local: false,
        staging: false,
        production: false,
      },
    });
    expect(contract.surfaces.map((surface) => surface.key)).toEqual([
      "chapter_follow_up_affordances",
      "campaign_comms_prompts",
      "admin_outbox_review",
      "n8n_execution",
      "provider_delivery",
    ]);
    expect(
      contract.surfaces.every(
        (surface) =>
          surface.browserWritesExpected === 0 &&
          surface.externalWritesExpected === 0 &&
          surface.countsAsProductionProof === false,
      ),
    ).toBe(true);
    expect(
      contract.surfaces.find((surface) => surface.key === "admin_outbox_review"),
    ).toMatchObject({
      status: "review_only",
      routeEvidence: ["/admin/integration-outbox", "/admin"],
    });
    expect(
      contract.surfaces.find((surface) => surface.key === "n8n_execution"),
    ).toMatchObject({
      status: "blocked",
    });
  });

  it("pins the plain-English stop conditions for fake or local send evidence", () => {
    const output = formatNotificationsSendSafetyContract(
      getNotificationsSendSafetyContract(),
    );

    expect(output).toContain(
      "Notifications and communications send safety: REVIEW-ONLY READINESS SPEC",
    );
    expect(output).toContain(
      "This contract is read-only. It does not create users, write Supabase rows, send email or SMS, execute n8n workflows, or enable provider delivery.",
    );
    expect(output).toContain("approval policy: production_blocked");
    expect(output).toContain("production proof: blocked");
    expect(output).toContain(
      "Preview-cookie, localhost, local sandbox, Test/Figma, SOP/sample, and staging evidence do not count as production communications proof.",
    );
    expect(output).toContain(
      "No current lane may claim real notification delivery, staff/leader ownership transfer, points awards, invite side effects, or provider sends from this contract.",
    );
    expect(output).toContain(
      "Stop if a reviewer starts treating local/Test zero-send posture as production proof.",
    );
  });
});
