import { describe, expect, it } from "vitest";
import { defaultFilter } from "../types/chat";
import { filterMessages } from "./filterMessages";
import { at, event, msg } from "./fixtures";

const sample = [
  msg("Ada", "2024-01-01 09:30"),
  msg("Bob", "2024-01-01 23:10"),
  event("2024-01-02 08:00"),
  msg("Ada", "2024-02-10 12:00", "<Media omitted>", { lineType: "attachment", words: [] }),
  msg("Bob", "2024-03-15 03:00", "This message was deleted", { lineType: "deleted" }),
];

describe("filterMessages", () => {
  it("keeps every sender when senders is 'all'", () => {
    const kept = filterMessages(sample, defaultFilter());
    expect(kept.map((m) => m.sender)).toEqual(["Ada", "Bob", "Ada", "Bob"]);
  });

  it("drops system events", () => {
    expect(filterMessages(sample, defaultFilter())).toHaveLength(sample.length - 1);
  });

  it("keeps attachments and deleted messages", () => {
    const kept = filterMessages(sample, defaultFilter());
    expect(kept.map((m) => m.lineType)).toContain("attachment");
    expect(kept.map((m) => m.lineType)).toContain("deleted");
  });

  it("keeps only the selected senders", () => {
    const kept = filterMessages(sample, { ...defaultFilter(), senders: ["Ada"] });
    expect(kept).toHaveLength(2);
    expect(new Set(kept.map((m) => m.sender))).toEqual(new Set(["Ada"]));
  });

  it("returns nothing for an empty sender selection", () => {
    expect(filterMessages(sample, { ...defaultFilter(), senders: [] })).toHaveLength(0);
  });

  it("applies an inclusive date range", () => {
    const kept = filterMessages(sample, {
      ...defaultFilter(),
      rangeStart: at("2024-01-01 09:30"),
      rangeEnd: at("2024-02-10 12:00"),
    });
    expect(kept).toHaveLength(3);
  });

  it("applies an inclusive hour range", () => {
    const kept = filterMessages(sample, {
      ...defaultFilter(),
      hourStart: 9,
      hourEnd: 12,
    });
    expect(kept.map((m) => m.timestamp.getHours())).toEqual([9, 12]);
  });

  it("supports an hour range that wraps past midnight", () => {
    const kept = filterMessages(sample, {
      ...defaultFilter(),
      hourStart: 22,
      hourEnd: 3,
    });
    expect(kept.map((m) => m.timestamp.getHours())).toEqual([23, 3]);
  });

  it("reply window does not change volume", () => {
    const f1 = { ...defaultFilter(), replyWindowMinutes: 30 as const };
    const f2 = { ...defaultFilter(), replyWindowMinutes: 1440 as const };
    const v1 = filterMessages(sample, f1).length;
    const v2 = filterMessages(sample, f2).length;
    expect(v1).toBe(v2);
    expect(v1).toBeGreaterThan(0);
  });

  it("stop-word language does not change volume", () => {
    const withLang = filterMessages(sample, { ...defaultFilter(), stopwordLang: "indonesian" });
    const withoutLang = filterMessages(sample, { ...defaultFilter(), stopwordLang: null });
    expect(withLang.length).toBe(withoutLang.length);
  });

  it("does not mutate the input array", () => {
    const input = [msg("Ada", "10:00"), msg("Bob", "09:00")];
    filterMessages(input, defaultFilter());
    expect(input.map((m) => m.sender)).toEqual(["Ada", "Bob"]);
  });
});
