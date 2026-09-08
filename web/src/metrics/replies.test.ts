import { describe, expect, it } from "vitest";
import { defaultFilter } from "../types/chat";
import { at, event, msg } from "./fixtures";
import {
  buildReplies,
  buildTurns,
  filterReplies,
  replySummary,
  replyTrend,
  replyVsPreviousPeriod,
} from "./replies";

const oneReply = (sender: string, when: string, delaySeconds: number) => ({
  at: at(when),
  delaySeconds,
  replier: sender,
});

describe("buildTurns", () => {
  it("collapses a same-sender burst into one turn", () => {
    const turns = buildTurns([
      msg("Ada", "10:00"),
      msg("Ada", "10:01"),
      msg("Bob", "10:03"),
    ]);
    expect(turns).toEqual([
      { sender: "Ada", start: at("10:00"), end: at("10:01") },
      { sender: "Bob", start: at("10:03"), end: at("10:03") },
    ]);
  });

  it("skips events and deleted messages", () => {
    const turns = buildTurns([
      msg("Ada", "10:00"),
      event("10:01"),
      msg("Bob", "10:02", "This message was deleted", { lineType: "deleted" }),
      msg("Bob", "10:03"),
    ]);
    expect(turns.map((t) => t.sender)).toEqual(["Ada", "Bob"]);
    expect(turns[1].start).toEqual(at("10:03"));
  });
});

describe("buildReplies", () => {
  it("does not count A then A as a reply", () => {
    const msgs = [msg("Ada", "10:00"), msg("Ada", "10:01"), msg("Bob", "10:03")];
    const r = buildReplies(msgs, 120);
    expect(r).toHaveLength(1);
    expect(r[0].replier).toBe("Bob");
    expect(r[0].delaySeconds).toBe(120);
  });

  it("excludes 10h gap at 2h window", () => {
    const r = buildReplies([msg("Ada", "10:00"), msg("Bob", "20:00")], 120);
    expect(r).toHaveLength(0);
  });

  it("includes a gap exactly equal to the window", () => {
    const r = buildReplies([msg("Ada", "10:00"), msg("Bob", "12:00")], 120);
    expect(r).toHaveLength(1);
    expect(r[0].delaySeconds).toBe(7200);
  });

  it("stamps the reply at the replier's first message", () => {
    const r = buildReplies([msg("Ada", "10:00"), msg("Bob", "10:05"), msg("Bob", "10:06")], 120);
    expect(r[0].at).toEqual(at("10:05"));
  });

  it("records a reply for each turn change inside the window", () => {
    const r = buildReplies(
      [msg("Ada", "10:00"), msg("Bob", "10:02"), msg("Ada", "10:05")],
      120,
    );
    expect(r.map((e) => e.replier)).toEqual(["Bob", "Ada"]);
    expect(r.map((e) => e.delaySeconds)).toEqual([120, 180]);
  });

  it("keeps a later reply after an out-of-window gap", () => {
    const r = buildReplies(
      [msg("Ada", "10:00"), msg("Bob", "20:00"), msg("Ada", "20:10")],
      120,
    );
    expect(r).toHaveLength(1);
    expect(r[0].replier).toBe("Ada");
  });

  it("sorts unordered input before walking turns", () => {
    const r = buildReplies([msg("Bob", "10:03"), msg("Ada", "10:00")], 120);
    expect(r).toHaveLength(1);
    expect(r[0].replier).toBe("Bob");
  });

  it("ignores a wider window for message-independent output", () => {
    const msgs = [msg("Ada", "10:00"), msg("Bob", "20:00")];
    expect(buildReplies(msgs, 30)).toHaveLength(0);
    expect(buildReplies(msgs, 1440)).toHaveLength(1);
  });
});

describe("filterReplies", () => {
  const events = [
    oneReply("Ada", "2024-01-01 09:00", 60),
    oneReply("Bob", "2024-02-01 23:00", 120),
    oneReply("Ada", "2024-03-01 12:00", 180),
  ];

  it("keeps everyone when senders is 'all'", () => {
    expect(filterReplies(events, defaultFilter())).toHaveLength(3);
  });

  it("keeps only the selected repliers", () => {
    const kept = filterReplies(events, { ...defaultFilter(), senders: ["Ada"] });
    expect(kept.map((e) => e.delaySeconds)).toEqual([60, 180]);
  });

  it("applies the date range and hour range", () => {
    expect(
      filterReplies(events, {
        ...defaultFilter(),
        rangeStart: at("2024-02-01 00:00"),
        rangeEnd: at("2024-02-29 23:59"),
      }),
    ).toHaveLength(1);
    expect(filterReplies(events, { ...defaultFilter(), hourStart: 8, hourEnd: 13 })).toHaveLength(2);
  });
});

describe("replyTrend", () => {
  const sameWeek = (sender: string, day: number, delaySeconds: number) =>
    oneReply(sender, `2024-01-0${day} 12:00`, delaySeconds);

  it("omits median when bucket has 2 replies", () => {
    const twoEventsSameWeek = [sameWeek("Ada", 1, 60), sameWeek("Ada", 2, 120)];
    const points = replyTrend(twoEventsSameWeek, {
      ...defaultFilter(),
      grain: "week",
      durationStat: "median",
    });
    expect(points).toHaveLength(1);
    expect(points[0].seconds).toBeNull();
  });

  it("plots the median once a bucket has five replies", () => {
    const events = [1, 2, 3, 4, 5].map((d) => sameWeek("Ada", d, d * 60));
    const points = replyTrend(events, { ...defaultFilter(), grain: "week" });
    expect(points).toEqual([{ t: at("2024-01-01 00:00"), sender: "Ada", seconds: 180 }]);
  });

  it("honours the duration statistic", () => {
    const events = [1, 2, 3, 4, 5].map((d) => sameWeek("Ada", d, d * 60));
    expect(replyTrend(events, { ...defaultFilter(), grain: "week", durationStat: "mean" })[0].seconds).toBe(180);
    expect(
      replyTrend(events, { ...defaultFilter(), grain: "week", durationStat: "p90" })[0].seconds,
    ).toBeCloseTo(276, 10);
  });

  it("emits one point per bucket and sender, sorted by time then name", () => {
    const events = [
      sameWeek("Bob", 1, 60),
      sameWeek("Ada", 2, 60),
      oneReply("Ada", "2024-02-05 12:00", 60),
    ];
    const points = replyTrend(events, { ...defaultFilter(), grain: "month" });
    expect(points.map((p) => [p.t.getMonth(), p.sender])).toEqual([
      [0, "Ada"],
      [0, "Bob"],
      [1, "Ada"],
    ]);
  });

  it("applies the shared people and date filters", () => {
    const events = [sameWeek("Bob", 1, 60), sameWeek("Ada", 2, 60)];
    const points = replyTrend(events, {
      ...defaultFilter(),
      grain: "month",
      senders: ["Ada"],
    });
    expect(points.map((p) => p.sender)).toEqual(["Ada"]);
  });
});

describe("replySummary", () => {
  it("reports per-person median, p90, mean and sample size", () => {
    const events = [
      ...[1, 2, 3, 4, 5].map((d) => oneReply("Ada", `2024-01-0${d} 12:00`, d * 60)),
      oneReply("Bob", "2024-01-06 12:00", 600),
    ];
    const rows = replySummary(events);
    expect(rows).toEqual([
      { sender: "Ada", n: 5, medianSeconds: 180, p90Seconds: 276, meanSeconds: 180 },
      { sender: "Bob", n: 1, medianSeconds: 600, p90Seconds: 600, meanSeconds: 600 },
    ]);
  });

  it("returns nothing without events", () => {
    expect(replySummary([])).toEqual([]);
  });
});

describe("replyVsPreviousPeriod", () => {
  const onDay = (day: number, delaySeconds: number, sender = "Ada") =>
    oneReply(sender, `2024-01-${String(day).padStart(2, "0")} 12:00`, delaySeconds);

  // Jan 1–5 then Jan 6–10, so the midpoint of the reply times falls between them.
  const twoHalves = [
    ...[1, 2, 3, 4, 5].map((d) => onDay(d, 60)),
    ...[6, 7, 8, 9, 10].map((d) => onDay(d, 120)),
  ];

  it("splits at the midpoint of the reply times when no range is set", () => {
    expect(replyVsPreviousPeriod(twoHalves, defaultFilter())).toEqual({
      current: 120,
      previous: 60,
      deltaSeconds: 60,
    });
  });

  it("splits the filtered range rather than the reply times", () => {
    // Midpoint is 2024-01-11, so every reply lands in the earlier half.
    expect(
      replyVsPreviousPeriod(twoHalves, {
        ...defaultFilter(),
        rangeStart: at("2024-01-01 00:00"),
        rangeEnd: at("2024-01-21 00:00"),
      }),
    ).toEqual({ current: null, previous: 90, deltaSeconds: null });
  });

  it("leaves a side null when it holds fewer than five replies", () => {
    const thinRecently = [
      ...[1, 2, 3, 4, 5].map((d) => onDay(d, 60)),
      ...[6, 7, 8].map((d) => onDay(d, 120)),
    ];
    expect(
      replyVsPreviousPeriod(thinRecently, {
        ...defaultFilter(),
        rangeStart: at("2024-01-01 00:00"),
        rangeEnd: at("2024-01-11 00:00"),
      }),
    ).toEqual({ current: null, previous: 60, deltaSeconds: null });
  });

  it("honours the duration statistic", () => {
    const spread = [
      ...[1, 2, 3, 4, 5].map((d) => onDay(d, d * 60)),
      ...[6, 7, 8, 9, 10].map((d) => onDay(d, 600)),
    ];
    expect(replyVsPreviousPeriod(spread, { ...defaultFilter(), durationStat: "mean" })).toEqual({
      current: 600,
      previous: 180,
      deltaSeconds: 420,
    });
  });

  it("applies the shared filters before splitting", () => {
    const withOutsider = [...twoHalves, onDay(20, 9999, "Bob")];
    expect(replyVsPreviousPeriod(withOutsider, { ...defaultFilter(), senders: ["Ada"] })).toEqual({
      current: 120,
      previous: 60,
      deltaSeconds: 60,
    });
  });

  it("returns null when nothing survives the filters", () => {
    expect(replyVsPreviousPeriod([], defaultFilter())).toBeNull();
    expect(replyVsPreviousPeriod(twoHalves, { ...defaultFilter(), senders: ["Bob"] })).toBeNull();
  });
});
