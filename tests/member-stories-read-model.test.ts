import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { FigmaMemberMobileHome } from "@/components/figma-member-mobile-home";
import { buildMemberStoriesReadModel } from "@/services/member-stories-read-model";
import type {
  ChapterEventRow,
  ChapterRow,
  EvidenceItemRow,
  ProfileRow,
} from "@/shared/types/persistence";

describe("member stories read model", () => {
  it("shows only persisted evidence that passed content and sharing approval", () => {
    const stories = buildMemberStoriesReadModel({
      evidenceRows: [
        evidenceRow({
          id: "approved-photo",
          evidence_type: "event_photo",
          storage_path: "chapters/chapter-1/evidence/approved-photo/photo.jpg",
        }),
        evidenceRow({
          id: "pending-photo",
          status: "pending_review",
          sharing_status: "submitted",
        }),
      ],
      chapters: [chapterRow],
      chapterEvents: [eventRow],
      profiles: [profileRow],
    });

    expect(stories).toEqual([
      expect.objectContaining({
        id: "approved-photo",
        chapter: "TEST Review Chapter",
        eventRouteId: eventRow.id,
        filters: ["For You", "Events"],
        persisted: true,
        mediaStatus: "private_media_protected",
        image: null,
        likes: 0,
        views: 0,
      }),
    ]);
  });

  it("uses only HTTPS image URLs with an image extension as publishable media", () => {
    const stories = buildMemberStoriesReadModel({
      evidenceRows: [
        evidenceRow({ id: "safe", url: "https://cdn.example.org/story.webp" }),
        evidenceRow({ id: "not-image", url: "https://example.org/story" }),
        evidenceRow({ id: "not-https", url: "http://cdn.example.org/story.jpg" }),
        evidenceRow({ id: "invalid-url", url: ":not-a-url" }),
      ],
      chapters: [chapterRow],
      chapterEvents: [eventRow],
      profiles: [profileRow],
    });

    expect(stories.map((story) => [story.id, story.image, story.mediaStatus])).toEqual([
      ["safe", "https://cdn.example.org/story.webp", "public_media_ready"],
      ["not-image", null, "metadata_only"],
      ["not-https", null, "metadata_only"],
      ["invalid-url", null, "metadata_only"],
    ]);
  });

  it("handles incomplete approved metadata without inventing identity or media", () => {
    const stories = buildMemberStoriesReadModel({
      evidenceRows: [
        evidenceRow({
          id: "real-testimonial",
          chapter_id: "missing-chapter",
          chapter_event_id: null,
          submitted_by_user_id: "missing-profile",
          evidence_type: "testimonial_text",
          summary: "A real member reflection. More context follows.",
          hesitation_addressed: null,
          submitted_at: "not-a-date",
        }),
        evidenceRow({
          id: "test-video",
          chapter_id: campusOnlyChapter.id,
          chapter_event_id: null,
          evidence_type: "bridge_video",
          summary: "",
          storage_path: "test/video/story.mov",
          hesitation_addressed: null,
        }),
        evidenceRow({
          id: "real-field-note",
          chapter_id: campusOnlyChapter.id,
          chapter_event_id: null,
          evidence_type: "text",
          summary: "A chapter update",
          hesitation_addressed: null,
        }),
      ],
      chapters: [campusOnlyChapter],
      chapterEvents: [],
      profiles: [],
    });

    const byId = Object.fromEntries(stories.map((story) => [story.id, story]));

    expect(byId["real-field-note"]).toEqual(
      expect.objectContaining({
        id: "real-field-note",
        title: "A chapter update",
        chapter: "Campus Chapter",
        country: "Campus Only",
        type: "Field Story",
        tag: "Approved story",
        body: undefined,
        filters: ["For You"],
      }),
    );
    expect(byId["test-video"]).toEqual(
      expect.objectContaining({
        id: "test-video",
        title: "TEST Campus Chapter story",
        type: "Chapter Highlight",
        isVideo: true,
        mediaStatus: "private_media_protected",
        filters: ["For You", "Leadership"],
      }),
    );
    expect(byId["real-testimonial"]).toEqual(
      expect.objectContaining({
        id: "real-testimonial",
        title: "A real member reflection.",
        chapter: "MEDLIFE chapter",
        country: "MEDLIFE",
        type: "Student Story",
        date: "Date unavailable",
        body: undefined,
        filters: ["For You", "Leadership"],
      }),
    );
  });

  it("renders persisted approved metadata without falling back to the preview feed", () => {
    const memberStories = buildMemberStoriesReadModel({
      evidenceRows: [evidenceRow({ id: "persisted-story" })],
      chapters: [chapterRow],
      chapterEvents: [eventRow],
      profiles: [profileRow],
    });

    const html = renderToStaticMarkup(
      React.createElement(FigmaMemberMobileHome, {
        initialScreen: "stories",
        initialStoriesFilter: "For You",
        initialStoryId: "persisted-story",
        memberStories,
      }),
    );

    expect(html).toContain("Approved myMEDLIFE story metadata");
    expect(html).toContain("Live read-only");
    expect(html).toContain("TEST approved member story.");
    expect(html).toContain("Media not published");
    expect(html).not.toContain("Students in Lima joined a Mobile Clinic");
  });
});

function evidenceRow(overrides: Partial<EvidenceItemRow>): EvidenceItemRow {
  return {
    id: "evidence-1",
    assignment_id: null,
    chapter_id: chapterRow.id,
    chapter_event_id: eventRow.id,
    submitted_by_user_id: profileRow.id,
    evidence_type: "testimonial_text",
    summary: "TEST approved member story.",
    url: null,
    storage_path: null,
    target_audiences: ["chapter_member"],
    proof_categories: ["story"],
    messenger_type: null,
    lifecycle_stage: null,
    hesitation_addressed: "Will I find a community?",
    status: "approved",
    sharing_status: "approved_for_sharing",
    nps_score: null,
    activity_label: "TEST member story",
    submitted_at: "2026-07-19T12:00:00Z",
    created_at: "2026-07-19T12:00:00Z",
    updated_at: "2026-07-19T12:00:00Z",
    ...overrides,
  };
}

const chapterRow = {
  id: "chapter-1",
  name: "TEST Review Chapter",
  campus: "TEST Campus",
  region: "TEST Region",
} as ChapterRow;

const campusOnlyChapter = {
  id: "chapter-campus-only",
  name: "Campus Chapter",
  campus: "Campus Only",
  region: null,
} as ChapterRow;

const eventRow = {
  id: "event-1",
  chapter_id: chapterRow.id,
  title: "TEST Intro GBM",
} as ChapterEventRow;

const profileRow = {
  id: "profile-1",
  display_name: "TEST Member",
} as ProfileRow;
