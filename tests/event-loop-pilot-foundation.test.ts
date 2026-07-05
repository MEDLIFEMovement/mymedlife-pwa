import { describe, expect, it } from "vitest";

import { getEventLoopPilotFoundation } from "@/services/event-loop";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

describe("event loop pilot foundation", () => {
  it("proves the first five chapters can run the event to points loop", () => {
    const data = getMockReadOnlyAppData("Testing the event loop pilot foundation.");
    const foundation = getEventLoopPilotFoundation(data);

    expect(foundation.summary).toMatchObject({
      pilotChapterCount: 5,
      chaptersWithEvents: 5,
      chaptersWithLumaLinks: 5,
      chaptersWithRsvps: 5,
      chaptersWithAttendance: 5,
      chaptersWithPoints: 5,
      readyForSmallPilot: true,
    });
    expect(foundation.summary.organizationPoints).toBeGreaterThan(100);
    expect(foundation.chapters.map((chapter) => chapter.statusLabel)).toEqual([
      "ready",
      "ready",
      "ready",
      "ready",
      "ready",
    ]);
  });

  it("keeps the launch loop visible from every primary workspace", () => {
    const foundation = getEventLoopPilotFoundation(
      getMockReadOnlyAppData("Testing role routes for the event loop pilot."),
    );

    expect(foundation.roleRoutes).toEqual({
      member: "/app/events",
      leader: "/leader?view=events",
      staff: "/staff?view=events",
      adminLuma: "/admin/integrations/luma",
      adminOutbox: "/admin/integration-outbox",
      adminAudit: "/admin/audit-log",
    });
    expect(foundation.organizationLeaderboard[0]).toMatchObject({
      chapterName: "UCLA MEDLIFE",
      points: 50,
    });
  });

  it("shows audit and disabled outbox proof without exposing secrets or live sends", () => {
    const foundation = getEventLoopPilotFoundation(
      getMockReadOnlyAppData("Testing safe Luma pilot evidence."),
    );

    expect(foundation.safety).toMatchObject({
      externalWritesEnabled: false,
      rawSecretsExposed: false,
      liveLumaSendRows: 0,
      disabledLumaOutboxRows: 5,
      lumaIntegrationRows: 5,
      auditRows: 5,
    });
    expect(foundation.safety.blockedSystems).toEqual(
      expect.arrayContaining([
        "HubSpot writes",
        "n8n execution",
        "production Luma sends",
      ]),
    );
  });
});
