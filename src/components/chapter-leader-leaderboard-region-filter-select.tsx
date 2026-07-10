"use client";

import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import type { ChapterLeaderCommandCenter } from "@/services/chapter-leader-command-center";
import {
  createChapterLeaderFilterNavigate,
  navigateToSelectedChapterLeaderFilter,
} from "@/components/chapter-leader-filter-routing";

type ChapterLeaderLeaderboardRegionFilterSelectProps = {
  options: ChapterLeaderCommandCenter["leaderboardRegionOptions"];
  selectedKey: ChapterLeaderCommandCenter["selectedLeaderboardRegion"];
};

export function ChapterLeaderLeaderboardRegionFilterSelect({
  options,
  selectedKey,
}: ChapterLeaderLeaderboardRegionFilterSelectProps) {
  const navigate = createChapterLeaderFilterNavigate(useRouter());

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    navigateToSelectedChapterLeaderFilter(options, event.target.value, navigate);
  }

  return (
    <label className="relative block">
      <span className="sr-only">Leaderboard region filter</span>
      <select
        id="chapter-leaderboard-region-filter"
        aria-label="Leaderboard region filter"
        value={selectedKey}
        onChange={handleChange}
        className="appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 pr-10 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-[#5d8ff6]/40"
      >
        {options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400"
      >
        v
      </span>
    </label>
  );
}
