import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const read = (name: string) =>
  readFileSync(fileURLToPath(new URL(`./${name}`, import.meta.url)), "utf8");

const tokens = read("tokens.css");
const ui = read("ui.css");

/** `--name: value` pairs declared in tokens.css. */
function declaredTokens(): Map<string, string> {
  const found = new Map<string, string>();
  for (const [, name, value] of tokens.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)) {
    found.set(name, value.trim());
  }
  return found;
}

const rem = (value: string) => Number(value.replace("rem", ""));

describe("theme tokens", () => {
  it("uses the parchment background and no WhatsApp green", () => {
    expect(tokens).toContain("--bg: #f7f1ea");
    expect(tokens).not.toContain("25D366");
    expect(`${tokens}\n${ui}`.toLowerCase()).not.toMatch(/\bgreen\b|#25d366|#128c7e|#075e54/);
  });

  it("stays flat — no gradients anywhere in the theme", () => {
    expect(`${tokens}\n${ui}`).not.toMatch(/gradient\(/);
  });

  it("has a strictly ascending type ramp", () => {
    const t = declaredTokens();
    const ramp = ["xs", "sm", "md", "lg", "xl", "2xl"].map((step) => {
      const value = t.get(`--text-${step}`);
      expect(value, `--text-${step} is missing`).toBeDefined();
      return rem(value as string);
    });
    for (let i = 1; i < ramp.length; i += 1) {
      expect(ramp[i], `--text step ${i} must be larger than the one before`).toBeGreaterThan(
        ramp[i - 1],
      );
    }
  });

  it("carries no duplicate type sizes", () => {
    const sizes = [...declaredTokens()]
      .filter(([name]) => name.startsWith("--text-"))
      .map(([, value]) => value);
    expect(new Set(sizes).size).toBe(sizes.length);
  });

  it("defines every token that ui.css reaches for", () => {
    const known = declaredTokens();
    const used = new Set([...ui.matchAll(/var\((--[\w-]+)/g)].map(([, name]) => name));
    expect([...used].filter((name) => !known.has(name))).toEqual([]);
  });

  it("gives the reading list a shared prose measure", () => {
    expect(declaredTokens().get("--measure")).toBeDefined();
    expect(ui).toMatch(/\.readlist-body\s*\{[^}]*max-width:\s*var\(--measure\)/);
  });
});
