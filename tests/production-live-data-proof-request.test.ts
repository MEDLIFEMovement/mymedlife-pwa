import { describe, expect, it } from "vitest";
import {
  formatProductionLiveDataProofRequest,
  getProductionLiveDataProofRequest,
} from "@/services/production-live-data-proof-request";
import { productionLiveDataRelations } from "@/services/production-live-data-readiness";

describe("production live-data proof request", () => {
  it("formats a safe count-only request for the 30-chapter invite gate", () => {
    const request = getProductionLiveDataProofRequest();
    const markdown = formatProductionLiveDataProofRequest(request);

    expect(request.status).toBe("required_after_approved_production_apply");
    expect(markdown).toContain(
      "Status: REQUIRED AFTER APPROVED PRODUCTION DATA APPLY",
    );
    expect(markdown).toContain("pnpm production:data-counts");
    expect(markdown).toContain("--minimum-chapters=30");
    expect(markdown).toContain("--minimum-approved-members=500");
    expect(markdown).toContain("--minimum-pilot-events=5");
    expect(markdown).toContain("--out production-live-data-counts.txt");
    expect(markdown).toContain(
      "pnpm production:invite-gate \\\n  --packet production-rollout-packet.json",
    );
    expect(markdown).toContain("--out production-invite-gate.md");
    expect(markdown).toContain(
      "confirmation that no names, emails, passwords, tokens, database URLs, or row-level exports were included",
    );
    expect(markdown).toContain(
      "five-chapter Luma RSVP, attendance, points, audit, and zero-send proof is missing",
    );

    for (const relation of productionLiveDataRelations) {
      expect(markdown).toContain(`- ${relation}`);
    }
  });

  it("supports rehearsal floors and custom artifact paths", () => {
    const request = getProductionLiveDataProofRequest({
      packetPath: "tmp/packet.json",
      countsPath: "tmp/counts.txt",
      publicUrl: "https://staging.mymedlife.org",
      dbUrlEnvName: "MYMEDLIFE_PRODUCTION_DB_URL",
      minimumChapterCount: 3,
      minimumApprovedMembershipCount: 20,
      minimumPilotEventCount: 1,
    });
    const markdown = formatProductionLiveDataProofRequest(request);

    expect(markdown).toContain("--packet tmp/packet.json");
    expect(markdown).toContain("--live-data-counts tmp/counts.txt");
    expect(markdown).toContain("--public-url https://staging.mymedlife.org");
    expect(markdown).toContain("--db-url-env MYMEDLIFE_PRODUCTION_DB_URL");
    expect(markdown).toContain("--minimum-chapters=3");
    expect(markdown).toContain("--minimum-approved-members=20");
    expect(markdown).toContain("--minimum-pilot-events=1");
    expect(markdown).toContain("--out tmp/counts.txt");
  });
});
