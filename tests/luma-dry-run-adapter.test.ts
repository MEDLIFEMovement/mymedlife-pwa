import { describe, expect, it } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import {
  formatLumaDryRunAdapterPacket,
  getLumaDryRunAdapterPacket,
} from "@/services/luma-dry-run-adapter";

describe("luma dry-run adapter packet", () => {
  it("composes the read-only Luma contract surfaces for DS Admin", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing Luma dry-run adapter packet.");
    const packet = getLumaDryRunAdapterPacket(actor, data, {
      MYMEDLIFE_LUMA_MODE: "staging",
    });
    const output = formatLumaDryRunAdapterPacket(packet);

    expect(packet.canReadPacket).toBe(true);
    expect(packet.posture).toBe("read_only_preview");
    expect(packet.localOnly).toBe(true);
    expect(packet.evidenceAndBoundaries).toEqual({
      providerCalls: 0,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      secretsShown: 0,
    });
    expect(packet.routes.map((route) => route.href)).toEqual(
      expect.arrayContaining([
        "/admin/integrations/luma",
        "/admin/integration-outbox",
        "/leader?view=events",
        "/app/events",
      ]),
    );
    expect(packet.adminLumaStatus.canReadWorkspace).toBe(true);
    expect(packet.integrationContractReview.counts.total).toBe(4);
    expect(packet.writebackSafetyContract.validation.ready).toBe(true);
    expect(packet.blockedControls).toEqual(
      expect.arrayContaining([
        "create production Luma event",
        "open live vendor credentials",
      ]),
    );
    expect(output).toContain("Luma dry-run adapter packet: READ-ONLY readiness spec");
    expect(output).toContain("No-go rules:");
    expect(output).toContain("No provider API call is allowed from this adapter.");
  });

  it("hides the packet from chapter-facing roles", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing hidden adapter packet.");

    const packet = getLumaDryRunAdapterPacket(actor, data);

    expect(packet.canReadPacket).toBe(false);
    expect(packet.posture).toBe("hidden_for_role");
    expect(packet.summary).toContain("Only DS Admin and Super Admin");
  });
});
