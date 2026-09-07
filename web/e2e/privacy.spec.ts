import { test, expect } from "@playwright/test";

test("chat text is not sent on the network", async ({ page }) => {
  const leaked: string[] = [];
  page.on("request", (request) => {
    const blob = `${request.url()} ${request.postData() ?? ""}`;
    if (blob.includes("UNIQUE_TOKEN_TEST_XYZ")) leaked.push(blob);
  });
  await page.route("**/*", (route) => route.continue());
  await page.goto("./");
  await page.getByLabel(/choose a \.txt export/i).setInputFiles({
    name: "secret.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("1/1/24, 10:00 - Ada: UNIQUE_TOKEN_TEST_XYZ hello\n1/1/24, 10:01 - Bob: hi\n"),
  });
  await expect(page.getByText(/two-person chat/i)).toBeVisible();
  expect(leaked).toEqual([]);
});
