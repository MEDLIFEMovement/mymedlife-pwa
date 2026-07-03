import {
  getChapterLumaCalendarSummary,
  getChapterLumaRolloutReadiness,
  type ChapterLumaCalendarSummary,
  type ChapterLumaCalendarSummaryOptions,
  type ChapterLumaCalendarSummaryRow,
  type ChapterLumaRolloutStage,
} from "@/services/chapter-luma-calendars";

export type ChapterLumaRolloutFocus = ChapterLumaCalendarSummaryRow & {
  statusLabel: "Explicit map" | "Shared default" | "Needs setup";
};

export type ChapterLumaFirstFivePlan = {
  targetChapters: number;
  mappedNowCount: number;
  savedReadyCount: number;
  temporaryReadyCount: number;
  sharedDefaultCount: number;
  readyChapters: ChapterLumaRolloutFocus[];
  chaptersToMapNext: ChapterLumaRolloutFocus[];
  detail: string;
  caution: string | null;
};

export type ChapterLumaRolloutAction = {
  title: string;
  detail: string;
};

export type ChapterLumaScaleGap = {
  label: string;
  targetChapters: number;
  explicitMappedCount: number;
  remainingExplicitMaps: number;
  detail: string;
};

export type ChapterLumaRolloutWorkspace = {
  summary: ChapterLumaCalendarSummary;
  stages: ChapterLumaRolloutStage[];
  pilotChapter: ChapterLumaRolloutFocus | null;
  firstFivePlan: ChapterLumaFirstFivePlan;
  nextAction: ChapterLumaRolloutAction;
  scaleGaps: {
    wave25: ChapterLumaScaleGap;
    wave300: ChapterLumaScaleGap;
  };
};

export function getChapterLumaRolloutWorkspace(
  input: ChapterLumaCalendarSummaryOptions,
): ChapterLumaRolloutWorkspace {
  const summary = getChapterLumaCalendarSummary(input);
  const stages = getChapterLumaRolloutReadiness(input);
  const prioritizedRows = prioritizeRows(summary.rows).map(toFocusRow);
  const readyRows = prioritizedRows.filter((row) => row.readyForPilot);
  const blockedRows = prioritizedRows.filter((row) => !row.readyForPilot);
  const savedReadyCount = readyRows.filter(
    (row) => row.mappingMode === "saved_map",
  ).length;
  const temporaryReadyCount = readyRows.filter(
    (row) => row.mappingMode === "temporary_map",
  ).length;
  const pilotChapter = prioritizedRows[0] ?? null;
  const readyChapters = readyRows.slice(0, 5);
  const chaptersToMapNext = blockedRows.slice(
    0,
    Math.max(0, 5 - readyChapters.length),
  );
  const sharedDefaultCount = readyRows.filter(
    (row) => row.status === "shared_default",
  ).length;

  return {
    summary,
    stages,
    pilotChapter,
    firstFivePlan: {
      targetChapters: 5,
      mappedNowCount: readyChapters.length,
      savedReadyCount,
      temporaryReadyCount,
      sharedDefaultCount,
      readyChapters,
      chaptersToMapNext,
      detail: describeFirstFivePlan({
        mappedNowCount: readyChapters.length,
        savedReadyCount,
        temporaryReadyCount,
        missingCount: chaptersToMapNext.length,
        sharedDefaultCount,
      }),
      caution:
        sharedDefaultCount > 0
          ? "A shared default is fine for the narrow pilot, but save an explicit chapter map before widening to five chapters."
          : temporaryReadyCount > 0
            ? "Temporary env-backed maps can run the pilot, but save them in myMEDLIFE before calling the first five operationally ready."
          : null,
    },
    nextAction: getNextRolloutAction({
      pilotChapter,
      mappedNowCount: readyChapters.length,
      savedReadyCount,
      temporaryReadyCount,
      sharedDefaultCount,
      missingCount: chaptersToMapNext.length,
    }),
    scaleGaps: {
      wave25: createScaleGap(summary.explicitReadyCount, 25),
      wave300: createScaleGap(summary.explicitReadyCount, 300),
    },
  };
}

function prioritizeRows(rows: ChapterLumaCalendarSummaryRow[]) {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const priorityDelta =
        getStatusPriority(left.row.status) - getStatusPriority(right.row.status);

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return left.index - right.index;
    })
    .map((entry) => entry.row);
}

function toFocusRow(row: ChapterLumaCalendarSummaryRow): ChapterLumaRolloutFocus {
  return {
    ...row,
    statusLabel:
      row.status === "ready"
        ? "Explicit map"
        : row.status === "shared_default"
          ? "Shared default"
          : "Needs setup",
  };
}

function getStatusPriority(status: ChapterLumaCalendarSummaryRow["status"]) {
  switch (status) {
    case "ready":
      return 0;
    case "shared_default":
      return 1;
    case "needs_setup":
      return 2;
  }
}

function describeFirstFivePlan(input: {
  mappedNowCount: number;
  savedReadyCount: number;
  temporaryReadyCount: number;
  missingCount: number;
  sharedDefaultCount: number;
}) {
  if (input.mappedNowCount >= 5) {
    if (input.sharedDefaultCount > 0 || input.temporaryReadyCount > 0) {
      return `${input.mappedNowCount} chapters can run today, but ${input.savedReadyCount} are already saved in myMEDLIFE. Convert the remaining temporary paths into saved maps before widening the launch lane.`;
    }

    return "The first five chapters already have a usable calendar path. Keep validating the event loop before widening further.";
  }

  if (input.mappedNowCount === 0) {
    return "No chapters are ready for a five-chapter widening yet. Start by saving the pilot chapter map, then add four more explicit chapter calendars.";
  }

  const chaptersWord = input.missingCount === 1 ? "chapter" : "chapters";
  const sharedDefaultNote =
    input.sharedDefaultCount > 0
      ? " One of those paths is still a shared default."
      : input.temporaryReadyCount > 0
        ? ` ${input.temporaryReadyCount} path${input.temporaryReadyCount === 1 ? " is" : "s are"} still temporary env-backed maps.`
      : "";

  return `${input.mappedNowCount} of 5 chapters have a usable calendar path today. ${input.savedReadyCount} ${input.savedReadyCount === 1 ? "is" : "are"} already saved in myMEDLIFE. Map ${input.missingCount} more ${chaptersWord} before widening the pilot.${sharedDefaultNote}`;
}

function getNextRolloutAction(input: {
  pilotChapter: ChapterLumaRolloutFocus | null;
  mappedNowCount: number;
  savedReadyCount: number;
  temporaryReadyCount: number;
  sharedDefaultCount: number;
  missingCount: number;
}): ChapterLumaRolloutAction {
  if (!input.pilotChapter || input.mappedNowCount === 0) {
    return {
      title: "Save the first pilot chapter map",
      detail:
        "Pick one visible chapter, save its Luma calendar in myMEDLIFE, then prove the full event, RSVP, attendance, and points loop before widening anything else.",
    };
  }

  if (input.sharedDefaultCount > 0) {
    return {
      title: "Replace the shared default with saved chapter maps",
      detail:
        "The shared default is acceptable for a narrow pilot, but it should be replaced with chapter-specific saved maps before the first five chapters are treated as operationally clean.",
    };
  }

  if (input.temporaryReadyCount > 0) {
    return {
      title: "Save the temporary env-backed maps in myMEDLIFE",
      detail:
        "The launch lane can read these chapter calendars today, but staff should save them in myMEDLIFE so the rollout no longer depends on environment-only mapping state.",
    };
  }

  if (input.mappedNowCount < 5) {
    return {
      title: `Map ${input.missingCount} more ${input.missingCount === 1 ? "chapter" : "chapters"} for the first five`,
      detail:
        "Keep the rollout simple: add one saved chapter map at a time until five chapters can run the same event, RSVP, attendance, and points loop without special handling.",
    };
  }

  return {
    title: "Hold the line on saved maps and event-loop proof",
    detail:
      "The visible first-five set has usable chapter maps. Keep widening only with saved chapter mappings and keep validating attendance-backed points before broadening the launch.",
  };
}

function createScaleGap(
  explicitMappedCount: number,
  targetChapters: number,
): ChapterLumaScaleGap {
  const remainingExplicitMaps = Math.max(0, targetChapters - explicitMappedCount);

  return {
    label: `${targetChapters}-chapter explicit map gap`,
    targetChapters,
    explicitMappedCount,
    remainingExplicitMaps,
    detail:
      remainingExplicitMaps === 0
        ? `All ${targetChapters} chapters have explicit saved maps for this rollout size.`
        : `${remainingExplicitMaps} more explicit chapter maps are still needed before this rollout size is real.`,
  };
}
