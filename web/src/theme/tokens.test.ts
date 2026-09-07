import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const tokens = readFileSync(fileURLToPath(new URL("./tokens.css", import.meta.url)), "utf8");
const ui = readFileSync(fileURLToPath(new URL("./ui.css", import.meta.url)), "utf8");

describe("theme tokens", () => {
  it("uses the parchment background and no WhatsApp green", () => {
    expect(tokens).toContain("--bg: #f7f1ea");
    expect(tokens).not.toContain("25D366");
    expect(`${tokens}\n${ui}`.toLowerCase()).not.toMatch(/\bgreen\b|#25d366|#128c7e|#075e54/);
  });
});
