import { describe, expect, it } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getCampaignsRouteRedirectHref,
  getProofLibraryRouteRedirectHref,
  getRushMonthActionDetailRouteRedirectHref,
  getRushMonthEventsRouteRedirectHref,
} from "@/services/owned-route-redirect";

describe("owned route redirect service", () => {
  it("keeps member and leader roles on campaign-owned routes while redirecting coach, staff, and DS roles", () => {
    expect(
      getCampaignsRouteRedirectHref(getMockLocalActorContext("member.a@mymedlife.test")),
    ).toBeNull();
    expect(
      getCampaignsRouteRedirectHref(getMockLocalActorContext("committee.member@mymedlife.test")),
    ).toBeNull();
    expect(
      getCampaignsRouteRedirectHref(getMockLocalActorContext("leader.a@mymedlife.test")),
    ).toBeNull();
    expect(
      getCampaignsRouteRedirectHref(getMockLocalActorContext("coach@mymedlife.test")),
    ).toBe("/coach?view=campaigns");
    expect(
      getCampaignsRouteRedirectHref(getMockLocalActorContext("admin@mymedlife.test")),
    ).toBe("/staff?view=campaigns");
    expect(
      getCampaignsRouteRedirectHref(getMockLocalActorContext("ds.admin@mymedlife.test")),
    ).toBe("/admin");
    expect(
      getCampaignsRouteRedirectHref(getMockLocalActorContext("super.admin@mymedlife.test")),
    ).toBe("/staff?view=campaigns");
  });

  it("preserves the selected campaign when campaign detail redirects to another owned surface", () => {
    expect(
      getCampaignsRouteRedirectHref(getMockLocalActorContext("coach@mymedlife.test"), {
        campaignSlug: "rush-month",
      }),
    ).toBe("/coach?view=campaigns&campaign=rush-month");
    expect(
      getCampaignsRouteRedirectHref(getMockLocalActorContext("admin@mymedlife.test"), {
        campaignSlug: "rush-month",
      }),
    ).toBe("/staff?view=campaigns&campaign=rush-month");
  });

  it("keeps member and leader roles on the proof library while redirecting coach, staff, and DS roles", () => {
    expect(
      getProofLibraryRouteRedirectHref(getMockLocalActorContext("member.a@mymedlife.test")),
    ).toBeNull();
    expect(
      getProofLibraryRouteRedirectHref(getMockLocalActorContext("committee.chair@mymedlife.test")),
    ).toBeNull();
    expect(
      getProofLibraryRouteRedirectHref(getMockLocalActorContext("coach@mymedlife.test")),
    ).toBe("/coach?view=support_notes#support-notes");
    expect(
      getProofLibraryRouteRedirectHref(getMockLocalActorContext("admin@mymedlife.test")),
    ).toBe("/staff?view=proof_ugc");
    expect(
      getProofLibraryRouteRedirectHref(getMockLocalActorContext("ds.admin@mymedlife.test")),
    ).toBe("/admin");
  });

  it("keeps member and committee roles on Rush Month events while redirecting direct leader, coach, staff, traveler, and DS landings", () => {
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("member.a@mymedlife.test")),
    ).toBeNull();
    expect(
      getRushMonthEventsRouteRedirectHref(
        getMockLocalActorContext("committee.member@mymedlife.test"),
      ),
    ).toBeNull();
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("leader.a@mymedlife.test")),
    ).toBe("/chapter?view=events");
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("coach@mymedlife.test")),
    ).toBe("/coach?view=campaigns&campaign=rush-month");
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("admin@mymedlife.test")),
    ).toBe("/staff?view=campaigns&campaign=rush-month");
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("traveler.a@mymedlife.test")),
    ).toBe("/slt-prep");
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("ds.admin@mymedlife.test")),
    ).toBe("/admin");
  });

  it("preserves the selected event when direct Rush Month event detail landings redirect to owned surfaces", () => {
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("leader.a@mymedlife.test"), {
        eventId: "event-rush-social-001",
      }),
    ).toBe("/chapter?view=events&event=event-rush-social-001");
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("coach@mymedlife.test"), {
        eventId: "event-rush-social-001",
      }),
    ).toBe("/coach?view=campaigns&campaign=rush-month&event=event-rush-social-001");
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("admin@mymedlife.test"), {
        eventId: "event-rush-social-001",
      }),
    ).toBe("/staff?view=campaigns&campaign=rush-month&event=event-rush-social-001");
  });

  it("keeps the explicit chapter event handoff on Rush Month event routes when chapter context is intentionally preserved", () => {
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("leader.a@mymedlife.test"), {
        source: "chapter_create_event",
      }),
    ).toBeNull();
    expect(
      getRushMonthEventsRouteRedirectHref(getMockLocalActorContext("leader.a@mymedlife.test"), {
        eventId: "event-rush-social-001",
        source: "chapter_event_review",
      }),
    ).toBeNull();
  });

  it("keeps member-owned action detail on student routes while redirecting non-member direct landings away", () => {
    expect(
      getRushMonthActionDetailRouteRedirectHref(
        getMockLocalActorContext("member.a@mymedlife.test"),
      ),
    ).toBeNull();
    expect(
      getRushMonthActionDetailRouteRedirectHref(
        getMockLocalActorContext("committee.member@mymedlife.test"),
      ),
    ).toBeNull();
    expect(
      getRushMonthActionDetailRouteRedirectHref(
        getMockLocalActorContext("leader.a@mymedlife.test"),
      ),
    ).toBe("/rush-month/actions");
    expect(
      getRushMonthActionDetailRouteRedirectHref(
        getMockLocalActorContext("coach@mymedlife.test"),
      ),
    ).toBe("/rush-month/actions");
    expect(
      getRushMonthActionDetailRouteRedirectHref(
        getMockLocalActorContext("admin@mymedlife.test"),
      ),
    ).toBe("/rush-month/actions");
    expect(
      getRushMonthActionDetailRouteRedirectHref(
        getMockLocalActorContext("traveler.a@mymedlife.test"),
      ),
    ).toBe("/slt-prep");
    expect(
      getRushMonthActionDetailRouteRedirectHref(
        getMockLocalActorContext("ds.admin@mymedlife.test"),
      ),
    ).toBe("/rush-month/actions");
  });
});
