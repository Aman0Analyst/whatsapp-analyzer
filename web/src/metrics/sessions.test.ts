import { describe, expect, it } from "vitest";
import { at, event, msg } from "./fixtures";
import { buildSessions, sessionClosers, sessionGapMinutes, sessionStarts, sessionStats } from "./sessions";

describe("buildSessions", () => {
  it("ships a 45 minute gap", () => {
    expect(sessionGapMinutes).toBe(45);
  });

  it("keeps messages 10 minutes apart in one session", () => {
    const sessions = buildSessions([
      msg("Ada", "10:00"),
      msg("Bob", "10:10"),
      msg("Ada", "10:20"),
    ]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      start: at("10:00"),
      end: at("10:20"),
      starter: "Ada",
      closer: "Ada",
      messageCount: 3,
    });
    expect(sessions[0].participants).toEqual(["Ada", "Bob"]);
  });

  it("starts a new session after a two hour gap", () => {
    const sessions = buildSessions([
      msg("Ada", "10:00"),
      msg("Bob", "10:10"),
      msg("Bob", "12:10"),
    ]);
    expect(sessions).toHaveLength(2);
    expect(sessions[1].starter).toBe("Bob");
    expect(sessions[1].messageCount).toBe(1);
  });

  it("treats a gap exactly equal to the threshold as the same session", () => {
    expect(buildSessions([msg("Ada", "10:00"), msg("Bob", "10:45")])).toHaveLength(1);
    expect(buildSessions([msg("Ada", "10:00"), msg("Bob", "10:46")])).toHaveLength(2);
  });

  it("ignores system events", () => {
    const sessions = buildSessions([
      msg("Ada", "10:00"),
      event("11:00"),
      msg("Ada", "10:30"),
    ]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].messageCount).toBe(2);
  });

  it("sorts unordered input before splitting", () => {
    const sessions = buildSessions([msg("Bob", "10:20"), msg("Ada", "10:00")]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].starter).toBe("Ada");
  });

  it("accepts a custom gap", () => {
    expect(buildSessions([msg("Ada", "10:00"), msg("Bob", "10:20")], 10)).toHaveLength(2);
  });
});

describe("sessionStarts", () => {
  it("counts who opened each session with a share", () => {
    const rows = sessionStarts([
      msg("Ada", "2024-01-01 10:00"),
      msg("Bob", "2024-01-01 10:10"),
      msg("Ada", "2024-01-01 14:00"),
      msg("Bob", "2024-01-02 09:00"),
    ]);
    expect(rows).toEqual([
      { sender: "Ada", n: 2, share: 2 / 3 },
      { sender: "Bob", n: 1, share: 1 / 3 },
    ]);
  });

  it("returns nothing without messages", () => {
    expect(sessionStarts([])).toEqual([]);
  });
});

describe("sessionStats", () => {
  it("returns count with null medians below the sample threshold", () => {
    const stats = sessionStats([
      msg("Ada", "10:00"),
      msg("Bob", "10:10"),
      msg("Ada", "12:00"),
    ]);
    expect(stats).toEqual({
      count: 2,
      medianDurationSeconds: null,
      medianMessageCount: null,
      medianPeoplePerBurst: null,
    });
  });

  it("returns zeros and nulls with no sessions", () => {
    expect(sessionStats([])).toEqual({
      count: 0,
      medianDurationSeconds: null,
      medianMessageCount: null,
      medianPeoplePerBurst: null,
    });
  });

  it("medians duration, message count, and people per burst from five sessions", () => {
    const stats = sessionStats([
      msg("Ada", "10:00"),
      msg("Ada", "12:00"),
      msg("Bob", "12:10"),
      msg("Bob", "14:00"),
      msg("Ada", "14:05"),
      msg("Cal", "14:10"),
      msg("Ada", "16:00"),
      msg("Bob", "18:00"),
      msg("Ada", "18:30"),
    ]);
    expect(stats).toEqual({
      count: 5,
      medianDurationSeconds: 600,
      medianMessageCount: 2,
      medianPeoplePerBurst: 2,
    });
  });
});

describe("sessionClosers", () => {
  it("counts who sent the last message in each session", () => {
    const rows = sessionClosers([
      msg("Ada", "10:00"),
      msg("Bob", "10:10"),
      msg("Ada", "14:00"),
      msg("Bob", "16:00"),
      msg("Cal", "16:05"),
    ]);
    expect(rows).toEqual([
      { sender: "Ada", n: 1, share: 1 / 3 },
      { sender: "Bob", n: 1, share: 1 / 3 },
      { sender: "Cal", n: 1, share: 1 / 3 },
    ]);
  });

  it("returns nothing without messages", () => {
    expect(sessionClosers([])).toEqual([]);
  });
});
