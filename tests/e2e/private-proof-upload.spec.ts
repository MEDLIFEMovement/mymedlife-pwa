import { expect, test } from "@playwright/test";

const runPrivateProofWrite =
  process.env.MYMEDLIFE_E2E_PRIVATE_PROOF_UPLOAD === "true";

test.describe("private proof upload", () => {
  test.skip(
    !runPrivateProofWrite,
    "Requires a reset local Supabase stack and the explicit private-upload E2E flag.",
  );

  test("uploads and removes one private TEST file through the authenticated UI", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await page.goto("/login");
    await page.locator("#login-email").fill("member.a@mymedlife.test");
    await page.locator("#login-password").fill("password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/onboarding|\/app/);

    await page.goto("/proof-library/upload");
    await expect(
      page.getByRole("heading", {
        name: "Attach source media for private MEDLIFE review",
      }),
    ).toBeVisible();
    await expect(page.getByText("No public publishing", { exact: true })).toBeVisible();
    await expect(page.getByText("No external exports", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Upload locked" })).toHaveCount(1);

    const uploadButton = page.getByRole("button", {
      name: "Upload private proof",
    });
    await expect(uploadButton).toHaveCount(1);
    const uploadForm = uploadButton.locator("xpath=ancestor::form");

    await uploadForm.locator('input[type="file"]').setInputFiles({
      name: "TEST-private-proof.png",
      mimeType: "image/png",
      buffer: Buffer.from("TEST private proof browser fixture"),
    });
    await uploadForm.locator("select").selectOption("declined");
    await uploadForm.locator('input[type="checkbox"]').check();
    await uploadButton.click();

    await expect(page).toHaveURL(/proofUploadResult=proof_uploaded/, {
      timeout: 60_000,
    });
    await expect(page.getByText("Private proof file attached", { exact: true })).toBeVisible();

    const removeButton = page.getByRole("button", {
      name: "Remove private file",
    });
    await expect(removeButton).toHaveCount(1);
    const removeForm = removeButton.locator("xpath=ancestor::form");
    await removeForm
      .locator("textarea")
      .fill("Remove completed TEST browser proof after verification.");
    await removeButton.click();

    await expect(page).toHaveURL(/proofUploadResult=upload_removed/);
    await expect(page.getByText("Private proof file removed", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Upload private proof" })).toHaveCount(1);

    await page.getByRole("link", { name: "Back to proof library" }).click();
    await expect(page).toHaveURL(/\/proof-library$/);
  });
});
