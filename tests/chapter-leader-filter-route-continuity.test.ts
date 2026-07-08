import type { ChangeEvent, ReactElement } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { ChapterLeaderEventCommitteeFilterSelect } from "@/components/chapter-leader-event-committee-filter-select";
import {
  createChapterLeaderFilterNavigate,
  navigateToSelectedChapterLeaderFilter,
} from "@/components/chapter-leader-filter-routing";
import { ChapterLeaderLeaderboardRegionFilterSelect } from "@/components/chapter-leader-leaderboard-region-filter-select";
import { ChapterLeaderPipelineFilterSelect } from "@/components/chapter-leader-pipeline-filter-select";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: () => undefined,
  }),
}));

function readProjectFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function getSelectChangeHandler(markup: ReactElement) {
  const children = Array.isArray(markup.props.children)
    ? markup.props.children
    : [markup.props.children];
  const select = children.find((child) => child?.type === "select");

  if (!select?.props?.onChange) {
    throw new Error("Expected leader filter select to expose an onChange handler.");
  }

  return select.props.onChange as (event: ChangeEvent<HTMLSelectElement>) => void;
}

describe("chapter leader filter route continuity", () => {
  it("returns the selected href and calls navigate for known filter options", () => {
    const navigate = vi.fn();

    const result = navigateToSelectedChapterLeaderFilter(
      [
        { key: "all", href: "/leader?view=members" },
        {
          key: "chair_candidate",
          href: "/leader?view=members&pipeline=chair_candidate",
        },
      ],
      "chair_candidate",
      navigate,
    );

    expect(result).toBe("/leader?view=members&pipeline=chair_candidate");
    expect(navigate).toHaveBeenCalledWith(
      "/leader?view=members&pipeline=chair_candidate",
    );
  });

  it("stays fail-closed when a filter key is missing", () => {
    const navigate = vi.fn();

    const result = navigateToSelectedChapterLeaderFilter(
      [{ key: "all", href: "/leader?view=events" }],
      "recruitment",
      navigate,
    );

    expect(result).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("routes selected filters through in-shell replace navigation", () => {
    const replace = vi.fn();
    const navigate = createChapterLeaderFilterNavigate({ replace });

    navigate("/leader?view=events&eventCommittee=recruitment");

    expect(replace).toHaveBeenCalledWith(
      "/leader?view=events&eventCommittee=recruitment",
      { scroll: false },
    );
  });

  it.each([
    {
      label: "pipeline",
      render: () =>
        ChapterLeaderPipelineFilterSelect({
          options: [
            { key: "all", label: "All Members", href: "/leader?view=members" },
            {
              key: "chair_candidate",
              label: "Chair Candidates",
              href: "/leader?view=members&pipeline=chair_candidate",
            },
          ],
          selectedKey: "all",
        }),
      nextValue: "chair_candidate",
    },
    {
      label: "event committee",
      render: () =>
        ChapterLeaderEventCommitteeFilterSelect({
          options: [
            { key: "all", label: "All Committees", href: "/leader?view=events" },
            {
              key: "recruitment",
              label: "Recruitment",
              href: "/leader?view=events&eventCommittee=recruitment",
            },
          ],
          selectedKey: "all",
        }),
      nextValue: "recruitment",
    },
    {
      label: "leaderboard region",
      render: () =>
        ChapterLeaderLeaderboardRegionFilterSelect({
          options: [
            { key: "all", label: "All Regions", href: "/leader?view=leaderboard" },
            {
              key: "new_england",
              label: "New England",
              href: "/leader?view=leaderboard&leaderboardRegion=new_england",
            },
          ],
          selectedKey: "all",
        }),
      nextValue: "new_england",
    },
  ])("keeps the %s filter change handler inside the leader shell", ({ render, nextValue }) => {
    const change = getSelectChangeHandler(render());

    expect(() =>
      change({
        target: { value: nextValue },
      } as ChangeEvent<HTMLSelectElement>),
    ).not.toThrow();
  });

  it("removes hard browser jumps from the leader filter controls", () => {
    expect(
      readProjectFile("src/components/chapter-leader-pipeline-filter-select.tsx"),
    ).toContain("useRouter");
    expect(
      readProjectFile("src/components/chapter-leader-pipeline-filter-select.tsx"),
    ).toContain("createChapterLeaderFilterNavigate");
    expect(
      readProjectFile("src/components/chapter-leader-pipeline-filter-select.tsx"),
    ).not.toContain("window.location.assign");

    expect(
      readProjectFile("src/components/chapter-leader-event-committee-filter-select.tsx"),
    ).toContain("useRouter");
    expect(
      readProjectFile("src/components/chapter-leader-event-committee-filter-select.tsx"),
    ).toContain("createChapterLeaderFilterNavigate");
    expect(
      readProjectFile("src/components/chapter-leader-event-committee-filter-select.tsx"),
    ).not.toContain("window.location.assign");

    expect(
      readProjectFile("src/components/chapter-leader-leaderboard-region-filter-select.tsx"),
    ).toContain("useRouter");
    expect(
      readProjectFile("src/components/chapter-leader-leaderboard-region-filter-select.tsx"),
    ).toContain("createChapterLeaderFilterNavigate");
    expect(
      readProjectFile("src/components/chapter-leader-leaderboard-region-filter-select.tsx"),
    ).not.toContain("window.location.assign");
  });
});
