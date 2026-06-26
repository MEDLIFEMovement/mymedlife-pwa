import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DataSourceNotice } from "@/components/data-source-notice";

describe("data source notice", () => {
  it("renders the mock-safe review label without a bulky card wrapper contract", () => {
    const html = renderToStaticMarkup(
      createElement(DataSourceNotice, {
        source: {
          mode: "mock",
          status: "mock_fallback",
          message: "Using mock data because MYMEDLIFE_DATA_SOURCE is not set to supabase.",
        },
      }),
    );

    expect(html).toContain("Data source status");
    expect(html).toContain("Preview data");
    expect(html).toContain("Using mock data because MYMEDLIFE_DATA_SOURCE is not set to supabase.");
    expect(html).toContain("bg-[#eef5ff]/94");
  });

  it("renders the Supabase-ready state with the quieter review label", () => {
    const html = renderToStaticMarkup(
      createElement(DataSourceNotice, {
        source: {
          mode: "supabase",
          status: "supabase_ready",
          message: "Reading review data from local Supabase tables.",
        },
      }),
    );

    expect(html).toContain("Connected preview data");
    expect(html).toContain("Reading review data from local Supabase tables.");
    expect(html).toContain("bg-blue-50/88");
  });
});
