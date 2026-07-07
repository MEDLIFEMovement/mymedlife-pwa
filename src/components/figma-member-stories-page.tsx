import Link from "next/link";
import { ArrowLeft, Bookmark, Heart, MessageCircle, Play, Send } from "lucide-react";

import type { ProofLibraryItem } from "@/shared/types/campaigns";

type FigmaMemberStoriesPageProps = {
  proofItems: ProofLibraryItem[];
  canUpload: boolean;
};

const storyFilters = ["For You", "Events", "SLT", "Fundraising", "Leadership"] as const;

export function FigmaMemberStoriesPage({
  proofItems,
  canUpload,
}: FigmaMemberStoriesPageProps) {
  const stories = proofItems.length > 0 ? proofItems : getFallbackStories();

  return (
    <main
      className="min-h-screen bg-[#f7f4ee] pb-24"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div className="mx-auto min-h-screen max-w-[430px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white px-4 pb-2 pt-12">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/app"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                aria-label="Back to student home"
              >
                <ArrowLeft size={16} />
              </Link>
              <span className="text-xl font-bold text-black">Stories</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#1B4B8E]" />
              <span className="text-xs text-gray-400">Review</span>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {storyFilters.map((filter, index) => (
              <button
                key={filter}
                type="button"
                className={[
                  "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1 text-xs font-semibold",
                  index === 0
                    ? "border-[#1B4B8E] bg-[#1B4B8E] text-white"
                    : "border-gray-300 bg-white text-gray-500",
                ].join(" ")}
              >
                {filter}
              </button>
            ))}
          </div>
        </header>

        {stories.map((story) => (
          <article key={story.id} className="border-b border-gray-200">
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1B4B8E] text-xs font-bold text-white">
                  {story.sourceLabel[0] ?? "M"}
                </div>
                <div className="leading-tight">
                  <p className="text-[13px] font-semibold text-black">
                    {toStoryHandle(story.sourceLabel)}
                  </p>
                  <p className="text-[11px] text-gray-400">{formatProofType(story.proofType)}</p>
                </div>
              </div>
              <span className="px-1 py-1 text-lg font-bold leading-none tracking-tighter text-black">
                ...
              </span>
            </div>

            <div className="relative flex aspect-square w-full items-center justify-center bg-[#edf4ff]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1B4B8E] via-[#235ea8] to-[#07192E]" />
              <div className="relative px-7 text-center text-white">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
                  MEDLIFE Story
                </p>
                <h2 className="mt-3 text-2xl font-black leading-tight">{story.sourceLabel}</h2>
                <p className="mt-3 text-sm leading-6 text-blue-100">{story.hesitationAddressed}</p>
              </div>
              {story.proofType === "bridge_video" ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white bg-black/35">
                    <Play size={28} className="ml-1.5 fill-white text-white" />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="px-3 pt-2">
              <div className="flex items-center">
                <div className="flex flex-1 items-center gap-4">
                  <button
                    type="button"
                    disabled
                    title="Preview-only reaction. Likes are not saved, synced, or counted as production proof."
                    className="cursor-not-allowed p-1 opacity-70"
                    aria-label="Preview-only like story"
                  >
                    <Heart size={24} className="text-black" />
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Story comments are blocked in this preview."
                    className="cursor-not-allowed p-1 opacity-70"
                    aria-label="Preview-only comment on story"
                  >
                    <MessageCircle size={23} className="text-black" />
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Sharing is blocked in this preview until publishing approval is complete."
                    className="cursor-not-allowed p-1 opacity-70"
                    aria-label="Preview-only share story"
                  >
                    <Send size={22} className="text-black" />
                  </button>
                </div>
                <button
                  type="button"
                  disabled
                  title="Saving stories is blocked in this preview."
                  className="cursor-not-allowed p-1 opacity-70"
                  aria-label="Preview-only save story"
                >
                  <Bookmark size={23} className="text-black" />
                </button>
              </div>
              <p className="px-1 pt-1 text-[13px] font-semibold text-black">
                {story.sharingStatus.replaceAll("_", " ")}
              </p>
              <p className="px-1 pb-3 pt-1 text-[13px] leading-5 text-black">
                <span className="font-semibold">{toStoryHandle(story.sourceLabel)}</span>{" "}
                {story.summary}
              </p>
            </div>
          </article>
        ))}

        <section className="px-4 py-5">
          <div className="rounded-2xl border border-[#d8e3f8] bg-[#edf4ff] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1B4B8E]">
              Consent and publishing
            </p>
            <p className="mt-2 text-sm leading-6 text-[#4c668b]">
              Stories are review-only here. Uploads, external publishing, and public proof sharing
              stay disabled until HQ approval.
            </p>
            {canUpload ? (
              <Link
                href="/proof-library/upload"
                className="mt-3 inline-flex rounded-xl bg-[#1B4B8E] px-4 py-2 text-sm font-bold text-white"
              >
                Preview proof upload requirements
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function toStoryHandle(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) || "medlife";
}

function formatProofType(type: ProofLibraryItem["proofType"]) {
  return type.replaceAll("_", " ");
}

function getFallbackStories(): ProofLibraryItem[] {
  return [
    {
      id: "fallback-story",
      campaignSlug: "rush-month",
      sourceLabel: "Rush Month kickoff",
      proofType: "chapter_recap",
      hesitationAddressed: "Students can see what joining MEDLIFE feels like before they commit.",
      summary: "A review-only story placeholder shown when no proof items are visible.",
      sharingStatus: "needs_hq_review",
      recommendedUse: "Student app story feed",
    },
  ];
}
