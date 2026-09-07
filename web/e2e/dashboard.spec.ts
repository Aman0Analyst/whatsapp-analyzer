import { test, expect } from "@playwright/test";
import path from "node:path";

test("landing shows privacy text", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByText(/stays on this device/i)).toBeVisible();
});

test("couple upload uses 1:1 layout", async ({ page }) => {
  await page.goto("./");
  const file = path.join(process.cwd(), "public/samples/couple.txt");
  await page.getByLabel(/choose a \.txt export/i).setInputFiles(file);
  await expect(page.getByText(/two-person chat/i)).toBeVisible();
});

test("group upload shows sender rank", async ({ page }) => {
  await page.goto("./");
  const file = path.join(process.cwd(), "public/samples/group.txt");
  await page.getByLabel(/choose a \.txt export/i).setInputFiles(file);
  await expect(page.getByText(/group chat/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /sender rank/i })).toBeVisible();
  await page.getByRole("button", { name: "30d" }).click();
  await expect(page.getByText("Entire export", { exact: true })).toBeVisible();
});
