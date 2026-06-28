"use client";

import type { ChangeEvent } from "react";

import type { ChapterLeaderCommandCenter } from "@/services/chapter-leader-command-center";

type ChapterLeaderLeaderboardRegionFilterSelectProps = {
  options: ChapterLeaderCommandCenter["leaderboardRegionOptions"];
  selectedKey: ChapterLeaderCommandCenter["selectedLeaderboardRegion"];
};

export function ChapterLeaderLeaderboardRegionFilterSelect({
  options,
  selectedKey,
}: ChapterLeaderLeaderboardRegionFilterSelectProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextOption = options.find((option) => option.key === event.target.value);
    if (!nextOption) {
      return;
    }

    window.location.assign(nextOption.href);
  }

  return (
    <label className="relative block">
      <span className="sr-only">Leaderboard region filter</span>
      <select
        id="chapter-leaderboard-region-filter"
        aria-label="Leaderboard region filter"
        value={selectedKey}
        onChange={handleChange}
        className="appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 pr-10 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-[var(--accent)]/40"
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
