import { describe, expect, it } from "vitest";
import { event, msg } from "./fixtures";
import {
  activeAndSilentDays,
  longestSilenceSeconds,
  talkShareByWords,
  wordsPerMessageBySender,
} from "./talk";

describe("talkShareByWords", () => {
  it("splits the word total between senders", () => {
    const rows = talkShareByWords([
      msg("Ada", "10:00", "one two three"),
      msg("Bob", "10:01", "hi"),
    ]);
    expect(rows).toEqual([
      { sender: "Ada", words: 3, share: 0.75 },
      { sender: "Bob", words: 1, share: 0.25 },
    ]);
  });

  it("only reads chat lines", () => {
    const rows = talkShareByWords([
      msg("Ada", "10:00", "coffee please"),
      msg("Bob", "10:01", "<Media omitted>", {
        lineType: "attachment",
        words: ["Media", "omitted"],
      }),
      msg("Bob", "10:02", "This message was deleted", { lineType: "deleted" }),
      event("10:03"),
    ]);
    expect(rows).toEqual([{ sender: "Ada", words: 2, share: 1 }]);
  });

  it("sorts by words then alphabetically", () => {
    const rows = talkShareByWords([
      msg("Zoe", "10:00", "one two"),
      msg("Ada", "10:01", "one two"),
      msg("Mia", "10:02", "one two three"),
    ]);
    expect(rows.map((r) => r.sender)).toEqual(["Mia", "Ada", "Zoe"]);
  });

  it("returns nothing when there are no words to share", () => {
    expect(talkShareByWords([])).toEqual([]);
    expect(talkShareByWords([msg("Ada", "10:00", "?", { words: [] })])).toEqual([]);
  });

  it("shares add up to one", () => {
    const rows = talkShareByWords([
      msg("Ada", "10:00", "one two three"),
      msg("Bob", "10:01", "four five"),
      msg("Cy", "10:02", "six"),
    ]);
    expect(rows.reduce((sum, r) => sum + r.share, 0)).toBeCloseTo(1, 10);
  });
});

describe("wordsPerMessageBySender", () => {
  it("needs five chat messages per sender", () => {
    const rows = wordsPerMessageBySender(
      [
        ...[1, 2, 3, 4, 5].map((i) => msg("Ada", `10:0${i}`, "one two three")),
        msg("Bob", "10:06", "one two"),
      ],
      "mean",
    );
    expect(rows).toEqual([
      { sender: "Ada", value: 3 },
      { sender: "Bob", value: null },
    ]);
  });

  it("supports median, mean and p90", () => {
    const msgs = [1, 2, 3, 4, 5].map((i) => msg("Ada", `10:0${i}`, "word ".repeat(i).trim()));
    expect(wordsPerMessageBySender(msgs, "median")[0].value).toBe(3);
    expect(wordsPerMessageBySender(msgs, "mean")[0].value).toBe(3);
    expect(wordsPerMessageBySender(msgs, "p90")[0].value).toBeCloseTo(4.6, 10);
  });

  it("only counts chat lines towards the sample", () => {
    const rows = wordsPerMessageBySender(
      [
        ...[1, 2, 3, 4].map((i) => msg("Ada", `10:0${i}`, "one two")),
        msg("Ada", "10:05", "<Media omitted>", {
          lineType: "attachment",
          words: ["Media", "omitted"],
        }),
      ],
      "mean",
    );
    expect(rows).toEqual([{ sender: "Ada", value: null }]);
  });

  it("lists senders alphabetically", () => {
    const rows = wordsPerMessageBySender(
      [msg("Zoe", "10:00"), msg("Ada", "10:01"), msg("Mia", "10:02")],
      "median",
    );
    expect(rows.map((r) => r.sender)).toEqual(["Ada", "Mia", "Zoe"]);
  });

  it("returns nothing for an empty chat", () => {
    expect(wordsPerMessageBySender([], "median")).toEqual([]);
  });
});

describe("activeAndSilentDays", () => {
  it("is all zeros without countable lines", () => {
    expect(activeAndSilentDays([])).toEqual({ activeDays: 0, silentDays: 0, spanDays: 0 });
    expect(activeAndSilentDays([event("10:00")])).toEqual({
      activeDays: 0,
      silentDays: 0,
      spanDays: 0,
    });
  });

  it("counts one day as active with no silence", () => {
    expect(
      activeAndSilentDays([msg("Ada", "2024-03-05 09:00"), msg("Bob", "2024-03-05 23:30")]),
    ).toEqual({ activeDays: 1, silentDays: 0, spanDays: 1 });
  });

  it("counts the gap days between active days as silent", () => {
    expect(
      activeAndSilentDays([
        msg("Ada", "2024-03-01 09:00"),
        msg("Ada", "2024-03-03 09:00"),
        msg("Bob", "2024-03-05 09:00"),
      ]),
    ).toEqual({ activeDays: 3, silentDays: 2, spanDays: 5 });
  });

  it("counts attachments and deleted lines but not events", () => {
    expect(
      activeAndSilentDays([
        msg("Ada", "2024-03-01 09:00", "<Media omitted>", { lineType: "attachment" }),
        event("2024-03-02 09:00"),
        msg("Bob", "2024-03-03 09:00", "This message was deleted", { lineType: "deleted" }),
      ]),
    ).toEqual({ activeDays: 2, silentDays: 1, spanDays: 3 });
  });

  it("keeps whole days across a daylight-saving change", () => {
    expect(
      activeAndSilentDays([msg("Ada", "2024-03-01 09:00"), msg("Ada", "2024-03-31 09:00")]),
    ).toEqual({ activeDays: 2, silentDays: 29, spanDays: 31 });
  });
});

describe("longestSilenceSeconds", () => {
  it("needs two countable messages", () => {
    expect(longestSilenceSeconds([])).toBeNull();
    expect(longestSilenceSeconds([msg("Ada", "10:00")])).toBeNull();
    expect(longestSilenceSeconds([msg("Ada", "10:00"), event("12:00")])).toBeNull();
  });

  it("takes the largest gap between consecutive messages", () => {
    expect(
      longestSilenceSeconds([
        msg("Ada", "10:00"),
        msg("Bob", "10:01"),
        msg("Ada", "11:01"),
        msg("Bob", "11:02"),
      ]),
    ).toBe(3600);
  });

  it("sorts before measuring", () => {
    expect(
      longestSilenceSeconds([
        msg("Ada", "11:01"),
        msg("Bob", "10:00"),
        msg("Ada", "10:01"),
      ]),
    ).toBe(3600);
  });

  it("measures across events rather than stopping at them", () => {
    expect(
      longestSilenceSeconds([msg("Ada", "10:00"), event("10:30"), msg("Bob", "11:00")]),
    ).toBe(3600);
  });

  it("is zero when two messages share a timestamp", () => {
    expect(longestSilenceSeconds([msg("Ada", "10:00:00"), msg("Bob", "10:00:00")])).toBe(0);
  });
});
