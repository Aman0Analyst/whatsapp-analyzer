import { describe, expect, it } from "vitest";
import { defaultFilter } from "../types/chat";
import { buildReplies, replySummary } from "./replies";
import { contentRates } from "./content";
import { filterMessages } from "./filterMessages";
import { heatmap } from "./heatmap";
import { at, event, msg } from "./fixtures";
import { topWords } from "./words";
import { senderRank, volumeTrend } from "./volume";

const stopwords = new Set(["the"]);

// Ada and Bob talk in January, Cy joins in March.
const sample = [
  msg("Ada", "2024-01-01 10:00", "the coffee"),
  msg("Bob", "2024-01-01 10:02", "tea please"),
  msg("Ada", "2024-01-01 10:03", "coffee wins"),
  event("2024-01-02 09:00"),
  msg("Cy", "2024-03-01 22:00", "late night"),
  msg("Ada", "2024-03-01 22:45", "still awake"),
];

const totals = (grid: number[][]) => grid.flat().reduce((a, b) => a + b, 0);

describe("shared filter behaviour", () => {
  it("moves volume, heatmap, words and rank together when people change", () => {
    const filter = { ...defaultFilter(), senders: ["Ada"] };
    const kept = filterMessages(sample, filter);
    expect(kept).toHaveLength(3);
    expect(volumeTrend(kept, "month").reduce((a, p) => a + p.n, 0)).toBe(3);
    expect(totals(heatmap(kept))).toBe(3);
    expect(topWords(kept, stopwords, 10).map((r) => r.word)).toEqual([
      "coffee",
      "awake",
      "still",
      "wins",
    ]);
    expect(senderRank(kept).map((r) => r.sender)).toEqual(["Ada"]);
  });

  it("moves volume, heatmap, words and rank together when the date range changes", () => {
    const filter = {
      ...defaultFilter(),
      rangeStart: at("2024-02-01 00:00"),
      rangeEnd: at("2024-03-31 23:59"),
    };
    const kept = filterMessages(sample, filter);
    expect(kept).toHaveLength(2);
    expect(volumeTrend(kept, "month")).toHaveLength(1);
    expect(totals(heatmap(kept))).toBe(2);
    expect(topWords(kept, stopwords, 10)).toHaveLength(4);
    expect(senderRank(kept).map((r) => r.sender)).toEqual(["Ada", "Cy"]);
  });

  it("reduces the number of trend points when the grain widens", () => {
    const kept = filterMessages(sample, defaultFilter());
    expect(volumeTrend(kept, "day").length).toBeGreaterThan(
      volumeTrend(kept, "month").length,
    );
  });

  it("keeps counts as sums when the duration statistic changes", () => {
    const asMedian = filterMessages(sample, { ...defaultFilter(), durationStat: "median" });
    const asP90 = filterMessages(sample, { ...defaultFilter(), durationStat: "p90" });
    expect(volumeTrend(asMedian, "month")).toEqual(volumeTrend(asP90, "month"));
  });

  it("changes only response time when the reply window changes", () => {
    const narrow = { ...defaultFilter(), replyWindowMinutes: 30 as const };
    const wide = { ...defaultFilter(), replyWindowMinutes: 1440 as const };

    const narrowMessages = filterMessages(sample, narrow);
    const wideMessages = filterMessages(sample, wide);
    expect(narrowMessages.length).toBe(wideMessages.length);
    expect(volumeTrend(narrowMessages, "month")).toEqual(volumeTrend(wideMessages, "month"));
    expect(heatmap(narrowMessages)).toEqual(heatmap(wideMessages));
    expect(topWords(narrowMessages, stopwords, 10)).toEqual(
      topWords(wideMessages, stopwords, 10),
    );
    expect(contentRates(narrowMessages)).toEqual(contentRates(wideMessages));

    const narrowReplies = buildReplies(narrowMessages, narrow.replyWindowMinutes);
    const wideReplies = buildReplies(wideMessages, wide.replyWindowMinutes);
    expect(narrowReplies.length).toBeLessThan(wideReplies.length);
    const samples = (events: typeof narrowReplies) =>
      replySummary(events).reduce((acc, row) => acc + row.n, 0);
    expect(samples(narrowReplies)).toBeLessThan(samples(wideReplies));
  });

  it("keeps the emoji-strip toggle out of message counts", () => {
    const stripped = filterMessages(sample, { ...defaultFilter(), stripEmojisForLength: true });
    const kept = filterMessages(sample, { ...defaultFilter(), stripEmojisForLength: false });
    expect(stripped.length).toBe(kept.length);
    expect(stripped).toEqual(kept);
    expect(volumeTrend(stripped, "month")).toEqual(volumeTrend(kept, "month"));
  });

  it("keeps stop-word language out of message counts", () => {
    const english = filterMessages(sample, { ...defaultFilter(), stopwordLang: "english" });
    const none = filterMessages(sample, { ...defaultFilter(), stopwordLang: null });
    expect(english.length).toBe(none.length);
    expect(topWords(english, stopwords, 10).map((r) => r.word)).not.toContain("the");
  });
});
