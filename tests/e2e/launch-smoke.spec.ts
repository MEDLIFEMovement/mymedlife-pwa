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

  test("loads the member home, stories, events, and points loop with the preview actor", async ({
    context,
    page,
  }) => {
    await selectPreviewActor(context, "member.a@mymedlife.test");

    await page.goto("/app");
    await page.getByRole("link", { name: "Start next action" }).click();
    await expect(page).toHaveURL(/\/app\/events\/chapter-event-ucla-kickoff\?source=home$/);
    await expect(page.getByText("Event RSVP")).toBeVisible();

    await page.goto("/app");
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByText("Upcoming Events")).toBeVisible();
    await expect(page.getByText("Chapter Leaderboard")).toBeVisible();
    await page.getByRole("link", { name: "RSVP" }).first().click();
    await expect(page).toHaveURL(/\/app\/events\/chapter-event-ucla-kickoff\?source=home&step=rsvp/);
    await expect(page.getByRole("heading", { name: "You're RSVP'd!" })).toBeVisible();

    await page.goto("/app");
    await page
      .getByRole("navigation", { name: "Member bottom navigation" })
      .getByRole("link", { name: "Stories", exact: true })
      .click();
    await expect(page).toHaveURL(/\/app\/stories$/);
    await expect(page.getByRole("heading", { name: "MEDLIFE Stories", exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Events" }).click();
    await expect(page).toHaveURL(/\/app\/events$/);
    await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
    await expect(page.getByText("Show up. Check in. Earn points.")).toBeVisible();

    await page.goto("/app");
    await page.getByRole("link", { name: "Points", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/points$/);
    await expect(page.getByText("Points & Recognition")).toBeVisible();

    await page.goto("/app");
    await page.getByRole("link", { name: "Profile", exact: true }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole("heading", { name: "Hi, Sofia" })).toBeVisible();

    await page.goto("/app/events");
    await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Stories" })).toHaveAttribute(
      "href",
      "/app/stories",
    );
    await expect(page.getByRole("link", { name: "Points" })).toHaveAttribute(
      "href",
      "/app/points",
    );
    await page.getByRole("link", { name: "RSVP" }).first().click();
    await expect(page).toHaveURL(/\/app\/events\/chapter-event-ucla-kickoff\?source=events&step=rsvp/);
    await expect(page.getByRole("heading", { name: "You're RSVP'd!" })).toBeVisible();

    await page.goto("/app/points");
    await expect(page.getByText("Points & Recognition")).toBeVisible();
    await expect(page.getByText("Chapter Leaderboard")).toBeVisible();
    await page.getByRole("link", { name: "See how to earn more points →" }).click();
    await expect(page).toHaveURL(/\/app\/events\?source=points$/);
    await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();

    await page.goto("/app/points");
    await page.getByRole("link", { name: "Profile", exact: true }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole("heading", { name: "Hi, Sofia" })).toBeVisible();
  });

  test("clicks the member event RSVP, check-in, and points path inside the mobile shell", async ({
    context,
    page,
  }) => {
    await selectPreviewActor(context, "member.a@mymedlife.test");

    await page.goto("/app/events");
    await page.getByRole("link", { name: "RSVP" }).first().click();
    await expect(page).toHaveURL(/\/app\/events\/chapter-event-ucla-kickoff\?source=events&step=rsvp/);
    await expect(page.getByRole("heading", { name: "You're RSVP'd!" })).toBeVisible();

    await expect(page.getByText("Attend and check in to earn")).toBeVisible();

    await page.getByRole("link", { name: "Go to Check-In" }).click();
    await expect(page).toHaveURL(/step=checkin/);
    await expect(page.getByText("Preview event QR code")).toBeVisible();
    await page.getByRole("link", { name: "Confirm Check-In" }).click();
    await expect(page.getByRole("heading", { name: "Checked in!" })).toBeVisible();
    await expect(page.getByText(/\+\d+ points/)).toBeVisible();

    await page.getByRole("link", { name: "View leaderboard impact" }).click();
    await expect(page.getByText("Chapter Leaderboard")).toBeVisible();
  });

  test("walks the direct member event-detail route through its preview-only steps", async ({
    context,
    page,
  }) => {
    await selectPreviewActor(context, "member.a@mymedlife.test");

    await page.goto("/app/events/chapter-event-ucla-kickoff");
    await expect(page.getByText("Event RSVP")).toBeVisible();
    await expect(page.getByText("RSVP'd", { exact: true })).toBeVisible();
    await expect(page.getByText("Route-backed preview")).toBeVisible();

    await page.getByRole("link", { name: "RSVP", exact: true }).click();
    await expect(page).toHaveURL(/step=rsvp/);
    await expect(page.getByRole("heading", { name: "You're RSVP'd!" })).toBeVisible();

    await page.getByRole("link", { name: "Go to Check-In" }).click();
    await expect(page).toHaveURL(/step=checkin/);
    await expect(page.getByText("Preview event QR code")).toBeVisible();

    await page.getByRole("link", { name: "Confirm Check-In" }).click();
    await expect(page).toHaveURL(/step=points/);
    await expect(page.getByRole("heading", { name: "Checked in!" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View leaderboard impact" })).toHaveAttribute(
      "href",
      "/app/points?source=events",
    );
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

    await page.goto("/leader?view=overview");
    await page.getByRole("button", { name: "Create Event" }).first().click();
    await expect(page).toHaveURL(/\/leader\?view=events/);
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
    const staffHeader = page.locator("header").first();

    await page.goto("/staff");

    await expect(page).toHaveURL(/\/staff/);
    await expect(page.getByRole("heading", { name: "Portfolio Overview" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Chapter" })).toBeVisible();

    await staffHeader.getByRole("link", { name: "Campaigns", exact: true }).click();
    await expect(page).toHaveURL(/\/staff\?view=campaigns/);
    await expect(page.getByRole("heading", { name: "Campaign Operations" })).toBeVisible();
    await expect(page.getByText("7 campaigns active across all regions")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open campaign shell" })).toHaveAttribute("href", "/campaigns/rush-month");
    await expect(page.getByRole("link", { name: "Open event loop" })).toHaveAttribute("href", "/rush-month/events");
    await expect(page.getByRole("button", { name: "Launch blocked" })).toBeDisabled();

    await staffHeader.getByRole("link", { name: "Proof / UGC", exact: true }).click();
    await expect(page).toHaveURL(/\/staff\?view=proof_ugc/);
    await expect(page.getByRole("heading", { name: "Proof / UGC Review Queue" })).toBeVisible();
    await expect(page.getByText("items pending review")).toBeVisible();
    await expect(page.getByText("provider fetch and queue writes are blocked in this preview")).toBeVisible();

    await staffHeader.getByRole("link", { name: "Best Practices", exact: true }).click();
    await expect(page).toHaveURL(/\/staff\?view=best_practices/);
    await expect(page.getByRole("heading", { name: "Best Practices Library" })).toBeVisible();

    await staffHeader.getByRole("link", { name: "Campaign SOPs", exact: true }).click();
    await expect(page).toHaveURL(/\/staff\?view=sops/);
    await expect(page.getByRole("heading", { name: "Campaign SOP Builder" })).toBeVisible();
    await expect(page.getByText("New Campaign SOP")).toBeVisible();

    await staffHeader.getByRole("link", { name: "Admin", exact: true }).click();
    await expect(page).toHaveURL(/\/staff\?view=admin/);
    await expect(page.getByRole("heading", { name: "Admin access blocked" })).toBeVisible();
  });

  test("filters the staff chapter table by chapter type without losing event and points columns", async ({
    context,
    page,
  }) => {
    await selectPreviewActor(context, "general.staff@mymedlife.test");

    await page.goto("/staff?view=chapters");
    await page.locator("select").nth(2).selectOption("needs_review");

    await expect(page.getByText("filtered")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Type" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "RSVPs" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Attended" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Points/Yr" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Needs review" }).first()).toBeVisible();
  });

  test("keeps staff chapter-detail survey controls preview-only", async ({
    context,
    page,
  }) => {
    await selectPreviewActor(context, "general.staff@mymedlife.test");

    await page.goto("/staff?view=chapters");
    await page.getByRole("row", { name: /UC Berkeley/i }).click();

    await expect(page.getByText("Chapter Detail", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Preview NPS Survey" }).first()).toBeVisible();
    await expect(
      page.getByText("Survey sending stays blocked in this preview. Use the NPS buttons to review the chapter survey flow only."),
    ).toBeVisible();
    await expect(
      page.getByText("Chapter support notes stay visible for coach review, but no note save, intervention write, or follow-up write runs from this drawer in the current preview."),
    ).toBeVisible();
  });

  test("clicks every staff command center menu item into its matching screen", async ({
    context,
    page,
  }) => {
    await selectPreviewActor(context, "general.staff@mymedlife.test");

    const openStaffMenuItem = async (label: string) => {
      await page.locator("header").first().getByRole("link", { name: label, exact: true }).click();
    };

    const menuItems = [
      { label: "Chapters", view: "chapters", heading: "Portfolio Overview" },
      { label: "Campaigns", view: "campaigns", heading: "Campaign Operations" },
      { label: "Proof / UGC", view: "proof_ugc", heading: "Proof / UGC Review Queue" },
      { label: "Best Practices", view: "best_practices", heading: "Best Practices Library" },
      { label: "Campaign SOPs", view: "sops", heading: "Campaign SOP Builder" },
      { label: "Admin", view: "admin", heading: "Admin access blocked" },
    ] as const;

    for (const item of menuItems) {
      await page.goto("/staff?view=chapters");
      await openStaffMenuItem(item.label);
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
      { label: "MCP Connections", heading: "MCP Connections" },
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

    await page.locator("aside").getByRole("button", { name: "Integrations", exact: true }).click();
    await expect(
      page.getByText("Smile.io sync stays visible for DS review, but point awards, tier sync, and reward writes remain blocked in this preview"),
    ).toBeVisible();

    await page.locator("aside").getByRole("button", { name: "Audit Logs", exact: true }).click();
    await expect(
      page.getByText("This audit log is preview-only. Review seeded admin and system readback here, then use the audited evidence surfaces for live production proof or incident review."),
    ).toBeVisible();

    await page.locator("aside").getByRole("button", { name: "API Keys", exact: true }).click();
    await expect(page.getByText("API keys stay masked in this preview")).toBeVisible();

    await page.locator("aside").getByRole("button", { name: "MCP Connections", exact: true }).click();
    await expect(page.getByText("MCP Access Policy")).toBeVisible();
    await expect(page.locator("aside").getByText("MCP Analytics")).toBeVisible();
    await expect(page.locator("aside").getByText("Account menu")).toBeVisible();
  });

  test("opens the embedded staff admin surface with the DS Admin menu family intact", async ({
    context,
    page,
  }) => {
    await selectPreviewActor(context, "super.admin@mymedlife.test");

    await page.goto("/staff?view=admin");
    await expect(page).toHaveURL(/\/staff\?view=admin$/);
    await expect(page.getByRole("heading", { name: "Restricted Access" })).toBeVisible();

    await page.getByRole("radio", { name: "Super Admin" }).check();
    await page.getByRole("button", { name: "Enter Admin Panel" }).click();

    const adminSidebar = page.locator("aside").first();
    await expect(adminSidebar.getByRole("button", { name: "Command Center" })).toBeVisible();
    await adminSidebar.getByRole("button", { name: "MCP Connections", exact: true }).click();
    await expect(page.getByRole("heading", { name: "MCP Connections" })).toBeVisible();
    await expect(adminSidebar.getByText("MCP Analytics")).toBeVisible();

    await adminSidebar.getByRole("button", { name: "Command Center" }).click();
    await expect(page).toHaveURL(/\/staff\?view=chapters$/);
    await expect(page.getByRole("heading", { name: "Portfolio Overview" })).toBeVisible();
  });

  test("loads route-level admin readback pages and keeps the SLT Prep alias on its preview-safe shell", async ({
    context,
    page,
  }) => {
    await selectPreviewActor(context, "ds.admin@mymedlife.test");

    const adminRoutes = [
      { path: "/admin/users", heading: "User Access Management" },
      { path: "/admin/chapters", heading: "Chapter Management" },
      { path: "/admin/access", heading: "Access Matrix" },
      { path: "/admin/integrations/luma", heading: "Luma integration status" },
      { path: "/admin/audit-log", heading: "DS Admin audit posture" },
      { path: "/admin/integration-outbox", heading: "DS Admin integration safety review" },
    ] as const;

    for (const route of adminRoutes) {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(`${route.path}$`));
      await expect(
        page.getByRole("heading", { level: 1, name: route.heading }),
      ).toBeVisible();
    }

    await selectPreviewActor(context, "traveler.a@mymedlife.test");
    await page.goto("/app/slt-prep");
    await expect(page).toHaveURL(/\/app\/slt-prep$/);
    await expect(page.getByRole("heading", { name: "Peru SLT" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Complete next step" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What is due next?" })).toBeVisible();
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
