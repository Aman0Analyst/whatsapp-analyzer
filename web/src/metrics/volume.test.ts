import { describe, expect, it } from "vitest";
import { at, event, msg } from "./fixtures";
import {
  dateSpan,
  messageCount,
  messagesPerDay,
  senderRank,
  uniqueSenders,
  volumeTrend,
  volumeTrendBySender,
} from "./volume";

const sample = [
  msg("Ada", "2024-01-01 10:00"),
  msg("Ada", "2024-01-01 11:00"),
  msg("Bob", "2024-01-03 09:00"),
  event("2024-01-04 09:00"),
  msg("Bob", "2024-03-02 09:00"),
];

describe("volumeTrend", () => {
  it("sums messages per day bucket and fills empty buckets with zero", () => {
    const points = volumeTrend(sample.slice(0, 3), "day");
    expect(points).toEqual([
      { t: at("2024-01-01 00:00"), n: 2 },
      { t: at("2024-01-02 00:00"), n: 0 },
      { t: at("2024-01-03 00:00"), n: 1 },
    ]);
  });

  it("buckets by month", () => {
    const points = volumeTrend(sample, "month");
    expect(points).toEqual([
      { t: at("2024-01-01 00:00"), n: 3 },
      { t: at("2024-02-01 00:00"), n: 0 },
      { t: at("2024-03-01 00:00"), n: 1 },
    ]);
  });

  it("excludes system events", () => {
    const points = volumeTrend([event("2024-01-04 09:00")], "day");
    expect(points).toEqual([]);
  });

  it("returns an empty series for no messages", () => {
    expect(volumeTrend([], "week")).toEqual([]);
  });
});

describe("volumeTrendBySender", () => {
  it("gives every sender the same bucket axis", () => {
    const series = volumeTrendBySender(sample, "month");
    expect(series.map((s) => s.sender)).toEqual(["Ada", "Bob"]);
    expect(series[0].points.map((p) => p.n)).toEqual([2, 0, 0]);
    expect(series[1].points.map((p) => p.n)).toEqual([1, 0, 1]);
    expect(series[0].points.map((p) => p.t)).toEqual(series[1].points.map((p) => p.t));
  });
});

describe("senderRank", () => {
  it("ranks by count and reports share of the included total", () => {
    const rows = senderRank(sample);
    expect(rows).toEqual([
      { sender: "Ada", n: 2, share: 0.5 },
      { sender: "Bob", n: 2, share: 0.5 },
    ]);
  });

  it("shares sum to one", () => {
    const rows = senderRank([...sample, msg("Cy", "2024-01-05 10:00")]);
    const total = rows.reduce((acc, r) => acc + r.share, 0);
    expect(total).toBeCloseTo(1, 10);
    expect(rows[0].sender).toBe("Ada");
  });

  it("returns an empty ranking for no messages", () => {
    expect(senderRank([event("2024-01-04 09:00")])).toEqual([]);
  });
});

describe("headline helpers", () => {
  it("counts messages excluding events", () => {
    expect(messageCount(sample)).toBe(4);
  });

  it("averages messages over the inclusive day span", () => {
    // 2024-01-01 .. 2024-01-03 is 3 days, 3 messages.
    expect(messagesPerDay(sample.slice(0, 3))).toBe(1);
    expect(messagesPerDay([])).toBe(0);
  });

  it("lists unique senders alphabetically", () => {
    expect(uniqueSenders(sample)).toEqual(["Ada", "Bob"]);
  });

  it("reports the first and last message timestamp", () => {
    expect(dateSpan(sample)).toEqual({
      start: at("2024-01-01 10:00"),
      end: at("2024-03-02 09:00"),
    });
    expect(dateSpan([])).toBeNull();
  });
});
