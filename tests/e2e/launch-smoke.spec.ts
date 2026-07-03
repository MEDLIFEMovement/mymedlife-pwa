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

    await page.goto("/app/events");
    await expect(page.getByRole("heading", { name: "RSVP, show up, earn points" })).toBeVisible();
    await expect(page.getByLabel("Upcoming events")).toBeVisible();

    await page.goto("/app/points");
    await expect(page.getByText("Points and leaderboard")).toBeVisible();
    await expect(page.getByLabel("Chapter leaderboard")).toBeVisible();
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
  });
});
