import { expect, test, type BrowserContext } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const localActorPreviewCookieName = "mymedlife_preview_actor_email";

async function selectPreviewActor(context: BrowserContext, email: string) {
  await context.addCookies([
    {
      name: localActorPreviewCookieName,
      value: email,
      url: baseURL,
    },
  ]);
}

test.describe("myMEDLIFE launch route smoke", () => {
  test("routes signed-out visitors to the one sign-in area", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "myMEDLIFE" })).toBeVisible();
    await expect(page.getByText("Sign in to your workspace")).toBeVisible();
  });

  test("loads the member home, events, and points loop with the preview actor", async ({
    context,
    page,
  }) => {
    await selectPreviewActor(context, "member.a@mymedlife.test");

    await page.goto("/app");
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByText("Upcoming Events")).toBeVisible();
    await expect(page.getByText("Chapter Leaderboard")).toBeVisible();

    await page.getByRole("link", { name: "Events" }).click();
    await expect(page).toHaveURL(/\/app\/events$/);
    await expect(page.getByRole("heading", { name: "RSVP, show up, earn points" })).toBeVisible();

    await page.goto("/app");
    await page.getByRole("link", { name: "Points" }).click();
    await expect(page).toHaveURL(/\/app\/points$/);
    await expect(page.getByText("Points and leaderboard")).toBeVisible();

    await page.goto("/app");
    await page.getByRole("link", { name: "Profile" }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole("heading", { name: "Hi, Sofia" })).toBeVisible();

    await page.goto("/app/events");
    await expect(page.getByRole("heading", { name: "RSVP, show up, earn points" })).toBeVisible();
    await expect(page.getByLabel("Upcoming events")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Student quick navigation" })).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Student quick navigation" })
        .getByRole("link", { name: /Points/ }),
    ).toHaveAttribute("href", "/app/points");

    await page
      .getByLabel("Upcoming events")
      .getByRole("link")
      .first()
      .click();
    await expect(page).toHaveURL(/\/app\/events\//);
    await expect(page.getByText("Student status")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View leaderboard impact" }),
    ).toHaveAttribute("href", "/app/points");
    await expect(page.getByRole("navigation", { name: "Student quick navigation" })).toBeVisible();

    await page.goto("/app/points");
    await expect(page.getByText("Points and leaderboard")).toBeVisible();
    await expect(page.getByLabel("Chapter leaderboard")).toBeVisible();
    await page
      .getByRole("navigation", { name: "Student quick navigation" })
      .getByRole("link", { name: /Profile/ })
      .click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole("heading", { name: "Hi, Sofia" })).toBeVisible();
  });

  test("loads the leader command center with the preview actor", async ({
    context,
    page,
  }) => {
    await selectPreviewActor(context, "leader.a@mymedlife.test");

    await page.goto("/leader");

    await expect(page).toHaveURL(/\/leader/);
    await expect(page.getByText("Chapter Leadership Home")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Chapter Metrics/ })).toBeVisible();

    await page.getByRole("link", { name: "Chapter Leaderboard" }).click();
    await expect(page).toHaveURL(/\/leader\?view=leaderboard/);
    await expect(
      page.getByRole("heading", { name: "Chapter Leaderboard", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Ranked chapter leaderboard")).toBeVisible();

    await page.getByRole("link", { name: "Event Performance" }).click();
    await expect(page).toHaveURL(/\/leader\?view=events/);
    await expect(page.getByRole("heading", { name: "Event Performance" })).toBeVisible();

    await page.getByRole("link", { name: "Create Event" }).click();
    await expect(page).toHaveURL(/\/leader\?view=create_event/);
    await expect(page.getByRole("heading", { name: "Create New Event" })).toBeVisible();
  });

  test("clicks every student command center menu item into its matching screen", async ({
    context,
    page,
  }) => {
    await selectPreviewActor(context, "leader.a@mymedlife.test");

    const menuItems = [
      { label: "Chapter Home", view: "overview", heading: /Chapter Metrics/ },
      { label: "Chapter Leaderboard", view: "leaderboard", heading: "Chapter Leaderboard" },
      { label: "Feed Analytics", view: "feed_analytics", heading: "Feed & Engagement Analytics" },
      { label: "Member Leaderboard", view: "members", heading: "Member Leaderboard" },
      { label: "Member Profile", view: "member_profile", heading: "Member Profile" },
      { label: "Event Committees", view: "committees", heading: "Event Committees" },
      { label: "Event Performance", view: "events", heading: "Event Performance" },
      { label: "Create Event", view: "create_event", heading: "Create New Event" },
      { label: "Impact", view: "impact", heading: "Impact Dashboard" },
      { label: "Bridge Videos", view: "bridge_videos", heading: "Bridge Video Hub" },
      { label: "MEDLIFE Stories", view: "stories", heading: "MEDLIFE Stories" },
      { label: "Current Leaders", view: "leaders", heading: "Current Leaders" },
      { label: "Succession", view: "succession", heading: "Leadership Succession" },
      { label: "Values", view: "values", heading: "MEDLIFE Values" },
      { label: "Leadership Training", view: "training", heading: "Leadership & Resources Hub" },
    ] as const;

    await page.goto("/leader?view=overview");

    for (const item of menuItems) {
      await page.getByRole("link", { name: item.label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/leader\\?view=${item.view}`));
      await expect(page.getByRole("heading", { name: item.heading, exact: true })).toBeVisible();
    }

    await page.getByRole("link", { name: "Chapter Leaderboard", exact: true }).click();
    await expect(page.getByLabel("Ranked chapter leaderboard")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Points Score" })).toBeVisible();
  });

  test("loads the staff command center with the preview actor", async ({
    context,
    page,
  }) => {
    await selectPreviewActor(context, "general.staff@mymedlife.test");

    await page.goto("/staff");

    await expect(page).toHaveURL(/\/staff/);
    await expect(page.getByRole("heading", { name: "Portfolio Overview" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Chapter" })).toBeVisible();

    await page.getByRole("link", { name: "Events" }).click();
    await expect(page).toHaveURL(/\/staff\?view=events/);
    await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
    await expect(page.getByText("RSVP, attendance, and point readiness by chapter")).toBeVisible();

    await page.getByRole("link", { name: "Leaderboard" }).click();
    await expect(page).toHaveURL(/\/staff\?view=leaderboard/);
    await expect(page.getByRole("heading", { name: "Organization Leaderboard" })).toBeVisible();
    await expect(page.getByText("Chapter ranking by attendance-backed points")).toBeVisible();
  });

  test("clicks every staff command center menu item into its matching screen", async ({
    context,
    page,
  }) => {
    await selectPreviewActor(context, "general.staff@mymedlife.test");

    const menuItems = [
      { label: "Chapters", view: "chapters", heading: "Portfolio Overview" },
      { label: "Events", view: "events", heading: "Events" },
      { label: "Leaderboard", view: "leaderboard", heading: "Organization Leaderboard" },
      { label: "Campaigns", view: "campaigns", heading: "Campaign Operations" },
      { label: "Proof / UGC", view: "proof_ugc", heading: "Proof / UGC Review Queue" },
      { label: "Best Practices", view: "best_practices", heading: "Best Practices Library" },
      { label: "Campaign SOPs", view: "sops", heading: "Campaign SOP Builder" },
      { label: "Admin", view: "admin", heading: "System Health" },
    ] as const;

    for (const item of menuItems) {
      await page.goto("/staff?view=chapters");
      await page.getByRole("link", { name: item.label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/staff\\?view=${item.view}`));
      await expect(page.getByRole("heading", { name: item.heading })).toBeVisible();
    }
  });

  test("keeps admin visual menu items functional and launch-disabled areas explicit", async ({
    context,
    page,
  }) => {
    await selectPreviewActor(context, "ds.admin@mymedlife.test");

    const adminItems = [
      { label: "Overview", heading: "Overview" },
      { label: "Users", heading: "Users" },
      { label: "Chapters", heading: "Chapters" },
      { label: "Modules", heading: "Modules & Feature Flags" },
      { label: "Luma Events", heading: "Luma Events" },
      { label: "Points", heading: "Points" },
      { label: "Integrations", heading: "Integrations" },
      { label: "Audit Logs", heading: "Audit Logs" },
      { label: "System Health", heading: "System Health" },
      { label: "API Keys", heading: "API Keys" },
      { label: "Settings", heading: "Settings" },
    ] as const;

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);

    for (const item of adminItems) {
      await page
        .locator("aside")
        .getByRole("button", { name: item.label, exact: true })
        .click();
      await expect(page.getByRole("heading", { name: item.heading })).toBeVisible();
    }

    await expect(
      page.locator("aside").getByRole("button", { name: "MCP Connections" }),
    ).toHaveCount(0);
    await expect(page.locator("aside").getByText("MCP Analytics")).toBeVisible();
    await expect(page.locator("aside").getByText("Account menu")).toBeVisible();
  });

  test("blocks unauthorized admin URLs and logs out through the account menu", async ({
    context,
    page,
  }) => {
    await selectPreviewActor(context, "member.a@mymedlife.test");

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/app$/);

    await page.locator("details summary").click();
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "myMEDLIFE" })).toBeVisible();
  });
});
