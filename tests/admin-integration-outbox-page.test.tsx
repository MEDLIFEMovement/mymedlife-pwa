import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/integration-outbox",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

vi.mock("@/services/read-only-app-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/read-only-app-data")>();

  return {
    ...actual,
    getReadOnlyAppData: vi.fn(),
  };
});

describe("admin integration outbox page", () => {
  it("keeps the outbox review surface inside the backend route family", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing integration outbox page."),
    );

    const { default: AdminIntegrationOutboxPage } = await import("@/app/admin/integration-outbox/page");
    const html = renderToStaticMarkup(await AdminIntegrationOutboxPage({}));

    expect(html).toContain("Backend route family");
    expect(html).toContain('href="/admin"');
    expect(html).toContain('href="/admin/permissions"');
    expect(html).toContain('href="/admin/committees"');
    expect(html).toContain('href="/admin/workflows"');
    expect(html).toContain('href="/admin/integration-outbox"');
    expect(html).toContain('href="/admin/database-security"');
    expect(html).toContain('href="/admin/system-health"');
    expect(html).toContain('href="/admin/sop-builder/rush-month?tab=steps"');
    expect(html).toContain('href="/admin/sop-library"');
    expect(html).toContain('href="/admin/master-data"');
    expect(html).toContain("Admin integration outbox");
    expect(html).toContain("outbox review");
  });

  it("can focus the page on staging Luma pilot evidence", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue({
      ...getMockReadOnlyAppData("Testing focused outbox page."),
      integrationEvents: [
        {
          id: "luma-integration",
          eventType: "luma_rsvp_recorded",
          title: "Pilot RSVP",
          destination: "Luma",
          status: "recorded",
          occurredAt: "2026-06-29T03:17:53.728Z",
          detail: "Pilot RSVP recorded.",
        },
      ],
      outboxItems: [
        {
          id: "luma-outbox",
          sourceEventId: "event-1",
          destination: "n8n",
          status: "disabled",
          payloadSummary: "source, rsvpCount",
        },
      ],
      integrationEventRows: [
        {
          id: "luma-integration",
          source_event_id: "event-1",
          chapter_id: "chapter-1",
          event_type: "luma_rsvp_recorded",
          destination: "luma",
          external_object_type: "event",
          external_object_id: "evt-1",
          status: "recorded",
          payload: { source: "luma_live_pilot", rsvpCount: 1 },
          created_by: "pilot-user",
          created_at: "2026-06-29T03:17:53.728Z",
          updated_at: "2026-06-29T03:17:53.728Z",
        },
      ],
      automationOutboxRows: [
        {
          id: "luma-outbox",
          source_event_id: "event-1",
          integration_event_id: "luma-integration",
          chapter_id: "chapter-1",
          destination: "n8n",
          event_type: "luma_rsvp_external_send_blocked",
          payload: { source: "luma_live_pilot", rsvpCount: 1 },
          idempotency_key: "luma-pilot:rsvp:evt-1:user-1",
          status: "disabled",
          attempt_count: 0,
          available_at: "2026-06-29T03:17:53.728Z",
          locked_at: null,
          sent_at: null,
          last_error: null,
          created_at: "2026-06-29T03:17:53.728Z",
          updated_at: "2026-06-29T03:17:53.728Z",
        },
      ],
    });

    const { default: AdminIntegrationOutboxPage } = await import("@/app/admin/integration-outbox/page");
    const html = renderToStaticMarkup(
      await AdminIntegrationOutboxPage({
        searchParams: Promise.resolve({ source: "luma-live-pilot" }),
      }),
    );

    expect(html).toContain("Current focus");
    expect(html).toContain("Staging Luma pilot");
    expect(html).toContain("blocked-send evidence tied to the pilot loop");
    expect(html).toContain('href="/admin/luma-live-pilot"');
    expect(html).toContain("Back to Luma pilot");
    expect(html).toContain("Pilot RSVP");
  });
});
