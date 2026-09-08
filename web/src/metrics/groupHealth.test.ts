import { describe, expect, it } from "vitest";
import { event, msg } from "./fixtures";
import {
  messageConcentration,
  nightShare,
  questionRate,
  silentInFile,
  weekendShare,
} from "./groupHealth";

describe("silentInFile", () => {
  it("returns unique senders present in the file but missing from the filter", () => {
    const file = [
      msg("Ada", "2024-01-01 10:00"),
      msg("Bob", "2024-01-02 10:00"),
      msg("Cy", "2024-01-03 10:00"),
      event("2024-01-04 09:00"),
    ];
    const filtered = [msg("Ada", "2024-01-01 10:00"), msg("Bob", "2024-01-02 10:00")];
    expect(silentInFile(file, filtered)).toEqual(["Cy"]);
  });

  it("skips events and null senders", () => {
    const file = [
      msg("Ada", "10:00"),
      msg("Ghost", "10:01", "hi", { sender: null }),
      event("10:02"),
    ];
    expect(silentInFile(file, [])).toEqual(["Ada"]);
  });

  it("returns an empty list when every file sender is still in the filter", () => {
    const msgs = [msg("Ada", "10:00"), msg("Bob", "10:01")];
    expect(silentInFile(msgs, msgs)).toEqual([]);
  });
});

describe("messageConcentration", () => {
  it("is the Herfindahl index of countable message-count shares", () => {
    const msgs = [
      msg("Ada", "10:00"),
      msg("Ada", "10:01"),
      msg("Ada", "10:02"),
      msg("Bob", "10:03"),
      event("10:04"),
    ];
    // shares 0.75 and 0.25 → 0.5625 + 0.0625 = 0.625
    expect(messageConcentration(msgs)).toBeCloseTo(0.625, 10);
  });

  it("is 1 when one sender has every countable message", () => {
    expect(messageConcentration([msg("Ada", "10:00"), msg("Ada", "10:01")])).toBe(1);
  });

  it("is 0 when there are no countable senders", () => {
    expect(messageConcentration([])).toBe(0);
    expect(messageConcentration([event("10:00")])).toBe(0);
    expect(messageConcentration([msg("Ada", "10:00", "hi", { sender: null })])).toBe(0);
  });
});

describe("nightShare", () => {
  it("counts hours 22, 23, 0, 1, 2, 3, 4, 5 as night", () => {
    const msgs = [
      msg("Ada", "2024-01-01 21:59"),
      msg("Ada", "2024-01-01 22:00"),
      msg("Ada", "2024-01-01 23:00"),
      msg("Ada", "2024-01-02 00:00"),
      msg("Ada", "2024-01-02 05:00"),
      msg("Ada", "2024-01-02 06:00"),
    ];
    expect(nightShare(msgs)).toBeCloseTo(4 / 6, 10);
  });

  it("excludes events from the denominator", () => {
    expect(nightShare([event("2024-01-01 23:00"), msg("Ada", "2024-01-01 23:00")])).toBe(1);
  });

  it("is 0 for an empty selection", () => {
    expect(nightShare([])).toBe(0);
  });
});

describe("weekendShare", () => {
  it("counts Saturday and Sunday via getDay() 0 or 6", () => {
    // 2024-01-05 is Friday, 2024-01-06 Saturday, 2024-01-07 Sunday
    const msgs = [
      msg("Ada", "2024-01-05 10:00"),
      msg("Ada", "2024-01-06 10:00"),
      msg("Ada", "2024-01-07 10:00"),
      event("2024-01-06 11:00"),
    ];
    expect(weekendShare(msgs)).toBeCloseTo(2 / 3, 10);
  });

  it("is 0 for an empty selection", () => {
    expect(weekendShare([])).toBe(0);
  });
});

describe("questionRate", () => {
  it("counts chat lines whose body includes ? per sender", () => {
    const rows = questionRate([
      msg("Ada", "10:00", "hello?"),
      msg("Ada", "10:01", "?? really"),
      msg("Ada", "10:02", "no question"),
      msg("Bob", "10:03", "ok"),
      msg("Bob", "10:04", "<Media omitted>", { lineType: "attachment" }),
      event("10:05"),
    ]);
    expect(rows).toEqual([
      { sender: "Ada", questions: 2, chats: 3, rate: 2 / 3 },
      { sender: "Bob", questions: 0, chats: 1, rate: 0 },
    ]);
  });

  it("ignores attachments, events, and null senders", () => {
    expect(
      questionRate([
        event("10:00"),
        msg("Ada", "10:01", "why?", { lineType: "attachment" }),
        msg("Ghost", "10:02", "who?", { sender: null }),
      ]),
    ).toEqual([]);
  });
});
