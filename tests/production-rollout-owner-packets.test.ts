import { describe, expect, it } from "vitest";
import {
  formatProductionRolloutOwnerPacketIndex,
  formatProductionRolloutOwnerPacketReadme,
  getProductionRolloutOwnerPacketFiles,
  getProductionRolloutOwnerPackets,
} from "@/services/production-rollout-owner-packets";
import { productionRolloutCsvTemplates } from "@/services/production-rollout-csv-templates";

describe("production rollout owner packets", () => {
  it("splits every rollout CSV into the right owner folder", () => {
    const packets = getProductionRolloutOwnerPackets();

    expect(packets.map((packet) => packet.slug)).toEqual([
      "nick-hq-launch-owner",
      "ds-launch-owner",
      "chapter-launch-owners",
      "sales-coaching-lead",
      "campaign-launch-owner",
      "luma-ds-owner",
      "launch-owner-ds",
    ]);
    expect(packets.find((packet) => packet.slug === "nick-hq-launch-owner")?.files).toEqual([
      "chapters.csv",
      "launch-owners.csv",
    ]);
    expect(packets.find((packet) => packet.slug === "ds-launch-owner")?.files).toEqual([
      "users.csv",
      "staff-roles.csv",
      "signed-in-route-proof.csv",
    ]);
    expect(packets.flatMap((packet) => packet.files).sort()).toEqual(
      productionRolloutCsvTemplates.map((template) => template.filename).sort(),
    );
  });

  it("creates README and header-only CSV files without fake launch rows", () => {
    const packet = getProductionRolloutOwnerPackets().find(
      (candidate) => candidate.slug === "luma-ds-owner",
    );

    expect(packet).toBeDefined();

    const files = getProductionRolloutOwnerPacketFiles(packet!);

    expect(files.map((file) => file.path)).toEqual([
      "README.md",
      "luma-calendars.csv",
    ]);
    expect(files.find((file) => file.path === "luma-calendars.csv")?.content).toBe(
      "chapterId,calendarId,calendarName,status\n",
    );
    expect(files.find((file) => file.path === "README.md")?.content).toContain(
      "Use calendar IDs only; never paste a Luma API key, token, or secret.",
    );
    expect(files.map((file) => file.content).join("\n")).not.toContain(
      "member.001@medlifemovement.org",
    );
  });

  it("documents validation and safety at the top-level index", () => {
    const index = formatProductionRolloutOwnerPacketIndex("rollout-owner-packets");

    expect(index).toContain("myMEDLIFE 30-Chapter Rollout Owner Packets");
    expect(index).toContain("Nick / HQ launch owner confirms chapters and launch owners.");
    expect(index).toContain(
      "pnpm rollout:owner-status --owner-dir rollout-owner-packets --out production-rollout-owner-packet-status.md",
    );
    expect(index).toContain(
      "pnpm rollout:assemble-owner-packets --owner-dir rollout-owner-packets --out rollout-csv",
    );
    expect(index).toContain("pnpm rollout:data-request --dir rollout-csv --out production-rollout-data-request.md");
    expect(index).toContain("pnpm rollout:check production-rollout-packet.json");
    expect(index).toContain("Do not invite students until the final invite gate passes.");
    expect(index).not.toContain("student@example.com");
  });

  it("keeps each owner README focused on the launch lane", () => {
    const dsPacket = getProductionRolloutOwnerPackets().find(
      (packet) => packet.slug === "ds-launch-owner",
    );
    const readme = formatProductionRolloutOwnerPacketReadme(dsPacket!);

    expect(readme).toContain("# DS / launch owner");
    expect(readme).toContain("users.csv");
    expect(readme).toContain("staff-roles.csv");
    expect(readme).toContain("signed-in-route-proof.csv");
    expect(readme).toContain("Do not add passwords, temporary passwords, API keys, tokens, secrets");
    expect(readme).not.toContain("password,");
  });
});
