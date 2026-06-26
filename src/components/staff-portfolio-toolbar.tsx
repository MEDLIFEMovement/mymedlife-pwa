"use client";

import type { ChangeEvent, FormEvent } from "react";
import type {
  StaffChapterPortfolioRow,
  StaffCoachFilter,
  StaffCountryFilter,
  StaffPortfolioCampaignFilter,
  StaffPortfolioFilterOption,
  StaffRiskFilter,
  StaffRiskFilterOption,
} from "@/services/staff-command-center";

type StaffPortfolioToolbarProps = {
  routeBase: "/staff" | "/coach";
  searchQuery: string;
  riskFilter: StaffRiskFilter;
  countryFilter: StaffCountryFilter;
  portfolioCampaignFilter: StaffPortfolioCampaignFilter;
  coachFilter: StaffCoachFilter;
  riskFilters: StaffRiskFilterOption[];
  countryFilters: StaffPortfolioFilterOption<StaffCountryFilter>[];
  portfolioCampaignFilters: StaffPortfolioFilterOption<StaffPortfolioCampaignFilter>[];
  coachFilters: StaffPortfolioFilterOption<StaffCoachFilter>[];
  reviewAtRiskHref: string;
  chapterRows: StaffChapterPortfolioRow[];
};

function downloadCsv(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: string | number) {
  const normalized = String(value).replaceAll('"', '""');
  return `"${normalized}"`;
}

function buildPortfolioCsv(rows: StaffChapterPortfolioRow[]) {
  const headers = [
    "Chapter",
    "Coach",
    "Campaign",
    "Status",
    "Leads",
    "RSVPs",
    "Attendance",
    "Assignments",
    "Evidence",
    "Points/Week",
    "HubSpot",
    "Last Active",
    "Risk",
    "Decision",
    "Summary",
  ];

  const dataRows = rows.map((row) => [
    row.chapterName,
    row.coachName,
    row.campaignName,
    row.statusLabel,
    row.leadsCount,
    row.rsvpCount,
    row.attendanceCount,
    row.assignmentsCount,
    row.proofPending,
    row.pointsPerWeek,
    row.hubspotStageLabel,
    row.lastActiveLabel,
    row.risk === "low" ? "Healthy" : row.risk === "medium" ? "At Risk" : "Intervene",
    row.decision === "advance" ? "Advance" : row.decision === "hold" ? "Hold" : "Intervene",
    `${row.supportSummary} Next step: ${row.nextStep}`,
  ]);

  return [headers, ...dataRows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");
}

function findNextHref<T extends string>(
  options: Array<{ key: T; href: string }>,
  key: string,
) {
  return options.find((option) => option.key === key)?.href ?? null;
}

export function StaffPortfolioToolbar({
  routeBase,
  searchQuery,
  riskFilter,
  countryFilter,
  portfolioCampaignFilter,
  coachFilter,
  riskFilters,
  countryFilters,
  portfolioCampaignFilters,
  coachFilters,
  reviewAtRiskHref,
  chapterRows,
}: StaffPortfolioToolbarProps) {
  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = String(formData.get("q") ?? "").trim();
    const params = new URLSearchParams();
    params.set("view", "chapters");

    if (search) {
      params.set("q", search);
    }
    if (riskFilter !== "all") {
      params.set("risk", riskFilter);
    }
    if (countryFilter !== "all") {
      params.set("country", countryFilter);
    }
    if (portfolioCampaignFilter !== "all") {
      params.set("portfolioCampaign", portfolioCampaignFilter);
    }
    if (coachFilter !== "all") {
      params.set("coach", coachFilter);
    }

    window.location.assign(`${routeBase}?${params.toString()}`);
  }

  function handleSelectChange<T extends string>(
    options: Array<{ key: T; href: string }>,
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const nextHref = findNextHref(options, event.target.value);
    if (!nextHref) {
      return;
    }

    window.location.assign(nextHref);
  }

  function handleExportClick() {
    const csv = buildPortfolioCsv(chapterRows);
    const filename =
      routeBase === "/coach" ? "coach-portfolio.csv" : "staff-portfolio.csv";
    downloadCsv(filename, csv);
  }

  return (
    <div className="mt-2.5 grid gap-2.5 xl:grid-cols-[minmax(16rem,1.3fr)_repeat(4,minmax(0,0.75fr))_auto_auto] xl:items-center">
      <form action={routeBase} method="get" onSubmit={handleSearchSubmit}>
        <input type="hidden" name="view" value="chapters" />
        <label className="sr-only" htmlFor="staff-search">
          Search chapters
        </label>
        <input
          id="staff-search"
          name="q"
          type="search"
          defaultValue={searchQuery}
          placeholder="Search chapter, school, student..."
          className="w-full rounded-full border border-slate-200 bg-[#dbeafe] px-4 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#5d8ff6]/40"
        />
      </form>

      <label className="relative block">
        <span className="sr-only">Risk filter</span>
        <select
          aria-label="Risk filter"
          value={riskFilter}
          onChange={(event) => handleSelectChange(riskFilters, event)}
          className="w-full appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 pr-10 text-sm font-semibold text-slate-700 outline-none focus:border-[#5d8ff6]/40"
        >
          {riskFilters.map((filter) => (
            <option key={filter.key} value={filter.key}>
              {filter.label}
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

      <label className="relative block">
        <span className="sr-only">Country filter</span>
        <select
          aria-label="Country filter"
          value={countryFilter}
          onChange={(event) => handleSelectChange(countryFilters, event)}
          className="w-full appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 pr-10 text-sm font-semibold text-slate-700 outline-none focus:border-[#5d8ff6]/40"
        >
          {countryFilters.map((filter) => (
            <option key={filter.key} value={filter.key}>
              {filter.label}
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

      <label className="relative block">
        <span className="sr-only">Campaign filter</span>
        <select
          aria-label="Campaign filter"
          value={portfolioCampaignFilter}
          onChange={(event) => handleSelectChange(portfolioCampaignFilters, event)}
          className="w-full appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 pr-10 text-sm font-semibold text-slate-700 outline-none focus:border-[#5d8ff6]/40"
        >
          {portfolioCampaignFilters.map((filter) => (
            <option key={filter.key} value={filter.key}>
              {filter.label}
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

      <label className="relative block">
        <span className="sr-only">Coach filter</span>
        <select
          aria-label="Coach filter"
          value={coachFilter}
          onChange={(event) => handleSelectChange(coachFilters, event)}
          className="w-full appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 pr-10 text-sm font-semibold text-slate-700 outline-none focus:border-[#5d8ff6]/40"
        >
          {coachFilters.map((filter) => (
            <option key={filter.key} value={filter.key}>
              {filter.label}
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

      <a
        href={reviewAtRiskHref}
        className="rounded-full border border-[#2563eb]/45 bg-[#dbeafe] px-4 py-2 text-center text-sm font-semibold text-[#1d4ed8]"
      >
        Review At-Risk
      </a>

      <button
        type="button"
        onClick={handleExportClick}
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
      >
        Export
      </button>
    </div>
  );
}
