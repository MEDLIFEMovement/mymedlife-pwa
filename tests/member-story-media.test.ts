import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { MemberStoryVideo } from "@/components/member-story-video";
import {
  getMemberStoryMediaReadbacks,
  isApprovedStoredStory,
  type MemberStoryMediaClient,
} from "@/services/member-story-media";
import type { EvidenceItemRow } from "@/shared/types/persistence";

describe("member story media", () => {
  it("renders a browser-native player for an approved signed video", () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberStoryVideo, {
        src: "https://storage.example.test/signed-video",
        title: "Approved chapter story",
      }),
    );

    expect(html).toContain("<video");
    expect(html).toContain("controls");
    expect(html).toContain("playsInline");
    expect(html).toContain('aria-label="Approved chapter story"');
    expect(html).toContain("https://storage.example.test/signed-video");
  });

  it("signs only approved image and video paths that match the evidence record", async () => {
    const createSignedUrl = vi.fn(async (path: string) => ({
      data: { signedUrl: `https://storage.example.test/${path}` },
      error: null,
    }));
    const list = vi.fn(async (_path: string, options: { search: string }) => ({
      data: [{ id: "object-1", name: options.search }],
      error: null,
    }));
    const client = {
      storage: {
        from: vi.fn(() => ({ createSignedUrl, list })),
      },
    } as unknown as MemberStoryMediaClient;

    const rows = [
      evidenceRow({ id: "photo-1", evidence_type: "event_photo" }),
      evidenceRow({
        id: "video-1",
        evidence_type: "bridge_video",
        storage_path: "chapters/chapter-1/evidence/video-1/media.mp4",
      }),
      evidenceRow({ id: "pending-1", status: "pending_review" }),
      evidenceRow({ id: "wrong-path", storage_path: "chapters/other/evidence/wrong-path/a.jpg" }),
      evidenceRow({ id: "text-1", evidence_type: "testimonial_text" }),
    ];

    const readbacks = await getMemberStoryMediaReadbacks(client, rows);

    expect(readbacks).toEqual([
      {
        evidenceItemId: "photo-1",
        thumbnailUrl: expect.stringContaining("photo-1"),
        mediaUrl: null,
        availability: "ready",
      },
      {
        evidenceItemId: "video-1",
        thumbnailUrl: null,
        mediaUrl: expect.stringContaining("video-1"),
        availability: "ready",
      },
    ]);
    expect(client.storage.from).toHaveBeenCalledWith("proof-submissions-private");
    expect(list).toHaveBeenNthCalledWith(
      1,
      "chapters/chapter-1/evidence/photo-1",
      { limit: 2, search: "media.jpg" },
    );
    expect(createSignedUrl).toHaveBeenNthCalledWith(
      1,
      "chapters/chapter-1/evidence/photo-1/media.jpg",
      900,
      {
        transform: { width: 1200, height: 1200, resize: "cover", quality: 82 },
      },
    );
    expect(createSignedUrl).toHaveBeenNthCalledWith(
      2,
      "chapters/chapter-1/evidence/video-1/media.mp4",
      900,
      undefined,
    );
  });

  it("fails closed when storage cannot sign a media object", async () => {
    const client = {
      storage: {
        from: () => ({
          list: async (_path: string, options: { search: string }) => ({
            data: [{ id: "object-1", name: options.search }],
            error: null,
          }),
          createSignedUrl: async () => ({ data: null, error: { message: "denied" } }),
        }),
      },
    } as unknown as MemberStoryMediaClient;

    await expect(
      getMemberStoryMediaReadbacks(client, [
        evidenceRow({ id: "photo-1", evidence_type: "event_photo" }),
      ]),
    ).resolves.toEqual([
      {
        evidenceItemId: "photo-1",
        thumbnailUrl: null,
        mediaUrl: null,
        availability: "unavailable",
      },
    ]);
  });

  it("does not sign a missing approved object", async () => {
    const createSignedUrl = vi.fn();
    const client = {
      storage: {
        from: () => ({
          list: async () => ({ data: [], error: null }),
          createSignedUrl,
        }),
      },
    } as unknown as MemberStoryMediaClient;

    await expect(
      getMemberStoryMediaReadbacks(client, [
        evidenceRow({ id: "photo-1", evidence_type: "event_photo" }),
      ]),
    ).resolves.toEqual([
      {
        evidenceItemId: "photo-1",
        thumbnailUrl: null,
        mediaUrl: null,
        availability: "missing",
      },
    ]);
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("does not sign media when the storage listing cannot be verified", async () => {
    const createSignedUrl = vi.fn();
    const client = {
      storage: {
        from: () => ({
          list: async () => ({ data: null, error: { message: "storage unavailable" } }),
          createSignedUrl,
        }),
      },
    } as unknown as MemberStoryMediaClient;

    await expect(
      getMemberStoryMediaReadbacks(client, [
        evidenceRow({ id: "photo-1", evidence_type: "event_photo" }),
      ]),
    ).resolves.toEqual([
      {
        evidenceItemId: "photo-1",
        thumbnailUrl: null,
        mediaUrl: null,
        availability: "unavailable",
      },
    ]);
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("rejects traversal and mismatched storage paths", () => {
    expect(isApprovedStoredStory(evidenceRow({ id: "photo-1" }))).toBe(true);
    expect(
      isApprovedStoredStory(
        evidenceRow({ id: "photo-1", storage_path: "chapters/chapter-1/evidence/photo-1/../secret.jpg" }),
      ),
    ).toBe(false);
    expect(
      isApprovedStoredStory(
        evidenceRow({ id: "photo-1", storage_path: "chapters/chapter-2/evidence/photo-1/media.jpg" }),
      ),
    ).toBe(false);
  });
});

function evidenceRow(overrides: Partial<EvidenceItemRow>): EvidenceItemRow {
  const id = overrides.id ?? "photo-1";
  return {
    id,
    assignment_id: null,
    chapter_id: "chapter-1",
    chapter_event_id: "event-1",
    submitted_by_user_id: "member-1",
    evidence_type: "event_photo",
    summary: "Approved story",
    url: null,
    storage_path: `chapters/chapter-1/evidence/${id}/media.jpg`,
    target_audiences: ["chapter_member"],
    proof_categories: ["story"],
    messenger_type: null,
    lifecycle_stage: null,
    hesitation_addressed: null,
    status: "approved",
    sharing_status: "approved_for_sharing",
    nps_score: null,
    activity_label: "Story",
    submitted_at: "2026-07-20T00:00:00Z",
    created_at: "2026-07-20T00:00:00Z",
    updated_at: "2026-07-20T00:00:00Z",
    ...overrides,
  };
}
