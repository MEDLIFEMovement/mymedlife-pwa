import { describe, expect, it } from "vitest";

import {
  buildSltChecklistDetailHref,
  mapChecklistDetailHref,
} from "@/services/slt-checklist-detail-href";

describe("slt checklist detail href helpers", () => {
  it("builds traveler checklist detail routes with source and traveler context", () => {
    expect(
      buildSltChecklistDetailHref("medical-clearance", {
        source: "forms",
        travelerId: "traveler-001",
      }),
    ).toBe(
      "/slt-prep/checklist/medical-clearance?source=forms&traveler=traveler-001",
    );
  });

  it("remaps checklist detail links without disturbing unrelated hrefs", () => {
    expect(
      mapChecklistDetailHref("/slt-prep/checklist/flight-itinerary", {
        source: "staff",
        travelerId: "traveler-002",
      }),
    ).toBe("/slt-prep/checklist/flight-itinerary?source=staff&traveler=traveler-002");
    expect(
      mapChecklistDetailHref("/slt-prep/forms", {
        source: "forms",
      }),
    ).toBe("/slt-prep/forms");
  });
});
