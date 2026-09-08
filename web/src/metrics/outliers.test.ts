import { describe, expect, it } from "vitest";
import { event, msg } from "./fixtures";
import { longMessages, textLength } from "./outliers";

function shorts(sender: string, count: number, length: number, hour = 10) {
  return Array.from({ length: count }, (_, i) =>
    msg(sender, `${hour}:${String(i).padStart(2, "0")}`, "x".repeat(length)),
  );
}

describe("textLength", () => {
  it("counts the raw body when stripEmojis is false", () => {
    const row = msg("Ada", "10:00", "hi 🙏", { emojis: ["🙏"] });
    expect(textLength(row, false)).toBe("hi 🙏".length);
  });

  it("removes parsed emoji strings then leftover Extended_Pictographic", () => {
    const parsed = msg("Ada", "10:00", "hi 🙏🎉", { emojis: ["🙏"] });
    expect(textLength(parsed, true)).toBe("hi ".length);
    const leftoverOnly = msg("Ada", "10:00", "hi 🎉", { emojis: [] });
    expect(textLength(leftoverOnly, true)).toBe("hi ".length);
  });
});

describe("longMessages", () => {
  it("does not flag every row when all eligible lengths are equal", () => {
    expect(longMessages(shorts("Ada", 8, 10), { stripEmojis: true })).toEqual([]);
  });

  it("returns nothing with fewer than 8 eligible chat lines", () => {
    const rows = [...shorts("Ada", 6, 10), msg("Ada", "10:20", "x".repeat(200))];
    expect(longMessages(rows, { stripEmojis: true })).toEqual([]);
  });

  it("does not treat an emoji-only message as an outlier when stripEmojis is true", () => {
    const emojiOnly = msg("Ada", "10:30", "🙏".repeat(40), {
      emojis: Array.from({ length: 40 }, () => "🙏"),
    });
    const flagged = longMessages(
      [...shorts("Ada", 8, 10), emojiOnly],
      { stripEmojis: true },
    );
    expect(flagged.some((row) => row.message === emojiOnly)).toBe(false);
  });

  it("flags a long prose line", () => {
    const long = msg("Ada", "10:20", "x".repeat(200));
    const flagged = longMessages([...shorts("Ada", 8, 10), long], { stripEmojis: true });
    expect(flagged.map((row) => row.message)).toContain(long);
    const hit = flagged.find((row) => row.message === long);
    expect(hit?.length).toBe(200);
    expect(hit?.reasons).toEqual(expect.arrayContaining(["p99", "iqr"]));
  });

  it("compares within sender when vsSender is true", () => {
    const bobLong = msg("Bob", "11:20", "x".repeat(80));
    const rows = [...shorts("Ada", 8, 200), ...shorts("Bob", 7, 10, 11), bobLong];
    const global = longMessages(rows, { stripEmojis: true });
    const perSender = longMessages(rows, { stripEmojis: true, vsSender: true });
    expect(global.some((row) => row.message === bobLong)).toBe(false);
    const bobHit = perSender.find((row) => row.message === bobLong);
    expect(bobHit).toBeDefined();
    expect(bobHit?.reasons.length).toBeGreaterThan(0);
  });

  it("ignores non-chat lines", () => {
    const long = msg("Ada", "10:20", "x".repeat(200));
    const flagged = longMessages(
      [
        ...shorts("Ada", 8, 10),
        long,
        event("10:40"),
        msg("Ada", "10:41", "x".repeat(400), { lineType: "attachment", words: [] }),
      ],
      { stripEmojis: true },
    );
    expect(flagged.map((row) => row.message)).toEqual([long]);
  });
});
