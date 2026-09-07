import { describe, expect, it } from "vitest";
import { msg } from "./fixtures";
import { parseStopwords, topWords, wordsPerMessage } from "./words";

const english = new Set(["the", "a", "and"]);

describe("topWords", () => {
  it("drops stop words", () => {
    const rows = topWords([msg("Ada", "10:00", "the dog and the cat")], english, 10);
    expect(rows.map((r) => r.word)).toEqual(["cat", "dog"]);
  });

  it("drops one-letter, numeric and punctuated tokens", () => {
    const rows = topWords(
      [msg("Ada", "10:00", "ok", { words: ["a", "42", "can't", "ok"] })],
      english,
      10,
    );
    expect(rows).toEqual([{ word: "ok", n: 1 }]);
  });

  it("counts case-insensitively", () => {
    const rows = topWords([msg("Ada", "10:00", "Hello hello HELLO world")], english, 10);
    expect(rows[0]).toEqual({ word: "hello", n: 3 });
  });

  it("sorts by count then alphabetically and honours the limit", () => {
    const rows = topWords(
      [msg("Ada", "10:00", "zebra apple apple mango mango")],
      english,
      2,
    );
    expect(rows).toEqual([
      { word: "apple", n: 2 },
      { word: "mango", n: 2 },
    ]);
  });

  it("only reads chat lines", () => {
    const rows = topWords(
      [
        msg("Ada", "10:00", "<Media omitted>", { lineType: "attachment", words: ["Media", "omitted"] }),
        msg("Bob", "10:01", "This message was deleted", { lineType: "deleted" }),
        msg("Ada", "10:02", "coffee"),
      ],
      english,
      10,
    );
    expect(rows).toEqual([{ word: "coffee", n: 1 }]);
  });

  it("keeps words with non-ascii letters", () => {
    const rows = topWords([msg("Ada", "10:00", "café yang")], english, 10);
    expect(rows.map((r) => r.word)).toEqual(["café", "yang"]);
  });

  // Parity with reduce_and_filter_words in whatsapp_analyzer.py: alphanumeric,
  // longer than one character, not purely numeric.
  it("keeps mixed letter and digit tokens like the CLI does", () => {
    const rows = topWords([msg("Ada", "10:00", "covid19 at 10pm 2024")], english, 10);
    expect(rows.map((r) => r.word)).toEqual(["10pm", "at", "covid19"]);
  });
});

describe("parseStopwords", () => {
  it("reads one lowercase word per line", () => {
    expect(parseStopwords("The\n\n a \nAND\n")).toEqual(new Set(["the", "a", "and"]));
  });
});

describe("wordsPerMessage", () => {
  it("needs five chat messages", () => {
    expect(wordsPerMessage([msg("Ada", "10:00", "one two")], "mean")).toBeNull();
  });

  it("averages words across chat messages", () => {
    const msgs = [1, 2, 3, 4, 5].map((i) => msg("Ada", `10:0${i}`, "one two three"));
    expect(wordsPerMessage(msgs, "mean")).toBe(3);
    expect(wordsPerMessage(msgs, "median")).toBe(3);
  });

  it("supports p90 like other duration statistics", () => {
    const msgs = [1, 2, 3, 4, 5].map((i) => msg("Ada", `10:0${i}`, "word ".repeat(i).trim()));
    expect(wordsPerMessage(msgs, "p90")).toBeCloseTo(4.6, 10);
  });
});
