"use client";

import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import type { ChapterLeaderCommandCenter } from "@/services/chapter-leader-command-center";
import {
  createChapterLeaderFilterNavigate,
  navigateToSelectedChapterLeaderFilter,
} from "@/components/chapter-leader-filter-routing";

type ChapterLeaderPipelineFilterSelectProps = {
  options: ChapterLeaderCommandCenter["pipelineFilterOptions"];
  selectedKey: ChapterLeaderCommandCenter["selectedPipelineFilter"];
};

export function ChapterLeaderPipelineFilterSelect({
  options,
  selectedKey,
}: ChapterLeaderPipelineFilterSelectProps) {
  const navigate = createChapterLeaderFilterNavigate(useRouter());

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    navigateToSelectedChapterLeaderFilter(options, event.target.value, navigate);
  }

  return (
    <label className="relative block">
      <span className="sr-only">Pipeline filter</span>
      <select
        aria-label="Pipeline filter"
        value={selectedKey}
        onChange={handleChange}
        className="min-w-[15rem] appearance-none rounded-full border border-slate-200 bg-[#dbeafe] px-4 py-2.5 pr-10 text-sm font-semibold text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.04)] outline-none transition hover:border-slate-300 focus:border-[#5d8ff6]"
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
