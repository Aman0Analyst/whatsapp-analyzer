import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const COUPLE = `1/1/24, 10:00 - Maya: morning
1/1/24, 10:01 - Rohan: hey
1/1/24, 10:02 - Maya: coffee?
1/1/24, 10:03 - Rohan: yes please
1/2/24, 09:00 - Maya: day two
1/2/24, 09:02 - Rohan: still here
`;

const GROUP = `1/1/24, 09:00 - Ada created group "Trip"
1/1/24, 09:00 - You were added
1/1/24, 09:01 - Ada: welcome everyone
1/1/24, 09:02 - Bob: hey
1/1/24, 09:03 - Cy: hi
1/1/24, 09:04 - Dee: hello
1/2/24, 09:00 - Ada: packing list
1/2/24, 09:10 - Bob: snacks
`;

function writeChat(name: string, body: string): string {
  const dir = path.join(os.tmpdir(), "whatsapp-analyzer-e2e");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  writeFileSync(file, body);
  return file;
}

test("landing shows privacy text", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByText(/stays on this device/i)).toBeVisible();
});

test("couple upload uses 1:1 layout", async ({ page }) => {
  await page.goto("./");
  await page.getByLabel(/choose a \.txt export/i).setInputFiles(writeChat("couple.txt", COUPLE));
  await expect(page.getByText(/two-person chat/i)).toBeVisible();
});

test("group upload shows sender rank", async ({ page }) => {
  await page.goto("./");
  await page.getByLabel(/choose a \.txt export/i).setInputFiles(writeChat("group.txt", GROUP));
  await expect(page.getByText(/group chat/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /sender rank/i })).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Ignore emojis in long messages", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "30d" }).click();
  await expect(page.getByText("Entire export", { exact: true })).toBeVisible();
});
