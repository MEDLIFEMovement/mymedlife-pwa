import { describe, expect, it } from "vitest";
import {
  getProductionLiveDataQueryArgs,
  productionLiveDataCountQuery,
  redactProductionLiveDataQueryOutput,
} from "@/services/production-live-data-query";

describe("production live data query", () => {
  it("uses the linked Supabase project by default", () => {
    const args = getProductionLiveDataQueryArgs({ mode: "linked" });

    expect(args).toContain("--linked");
    expect(args).not.toContain("--db-url");
    expect(args.at(-1)).toBe(productionLiveDataCountQuery);
  });

  it("supports an explicit database URL connection for launch review proof", () => {
    const args = getProductionLiveDataQueryArgs({
      mode: "db_url",
      dbUrl: "postgresql://readonly.example",
    });

    expect(args).toContain("--db-url");
    expect(args).toContain("postgresql://readonly.example");
    expect(args).not.toContain("--linked");
    expect(args.at(-1)).toContain("app.chapters.active");
    expect(args.at(-1)).toContain("app.luma_event_links");
  });

  it("redacts database URLs from Supabase CLI output before sharing errors", () => {
    const output = redactProductionLiveDataQueryOutput(
      "could not connect to postgresql://user:password@db.example/postgres",
      {
        mode: "db_url",
        dbUrl: "postgresql://user:password@db.example/postgres",
      },
    );

    expect(output).toBe("could not connect to [redacted database url]");
  });
});
