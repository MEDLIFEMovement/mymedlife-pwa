import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { navigateToSelectedChapterLeaderFilter } from "@/components/chapter-leader-filter-routing";

function readProjectFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
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

  it("removes hard browser jumps from the leader filter controls", () => {
    expect(
      readProjectFile("src/components/chapter-leader-pipeline-filter-select.tsx"),
    ).toContain("useRouter");
    expect(
      readProjectFile("src/components/chapter-leader-pipeline-filter-select.tsx"),
    ).toContain("router.replace");
    expect(
      readProjectFile("src/components/chapter-leader-pipeline-filter-select.tsx"),
    ).not.toContain("window.location.assign");

    expect(
      readProjectFile("src/components/chapter-leader-event-committee-filter-select.tsx"),
    ).toContain("useRouter");
    expect(
      readProjectFile("src/components/chapter-leader-event-committee-filter-select.tsx"),
    ).toContain("router.replace");
    expect(
      readProjectFile("src/components/chapter-leader-event-committee-filter-select.tsx"),
    ).not.toContain("window.location.assign");

    expect(
      readProjectFile("src/components/chapter-leader-leaderboard-region-filter-select.tsx"),
    ).toContain("useRouter");
    expect(
      readProjectFile("src/components/chapter-leader-leaderboard-region-filter-select.tsx"),
    ).toContain("router.replace");
    expect(
      readProjectFile("src/components/chapter-leader-leaderboard-region-filter-select.tsx"),
    ).not.toContain("window.location.assign");
  });
});
