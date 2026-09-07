import { describe, expect, it } from "vitest";
import {
  MIN_DURATION_SAMPLE,
  bucketStart,
  mean,
  median,
  p90,
  reduceDuration,
} from "./buckets";
import { at } from "./fixtures";

describe("bucketStart", () => {
  it("truncates to midnight for day grain", () => {
    expect(bucketStart(at("2024-03-05 22:27"), "day")).toEqual(at("2024-03-05 00:00"));
  });

  it("uses Monday as the start of the week", () => {
    // 2024-03-05 is a Tuesday.
    expect(bucketStart(at("2024-03-05 22:27"), "week")).toEqual(at("2024-03-04 00:00"));
  });

  it("puts Sunday in the week that started the previous Monday", () => {
    // 2024-03-10 is a Sunday.
    expect(bucketStart(at("2024-03-10 09:00"), "week")).toEqual(at("2024-03-04 00:00"));
  });

  it("truncates to the first of the month", () => {
    expect(bucketStart(at("2024-03-31 23:59"), "month")).toEqual(at("2024-03-01 00:00"));
  });

  it("truncates to the first day of the quarter", () => {
    expect(bucketStart(at("2024-05-20 12:00"), "quarter")).toEqual(at("2024-04-01 00:00"));
    expect(bucketStart(at("2024-12-31 12:00"), "quarter")).toEqual(at("2024-10-01 00:00"));
  });
});

describe("stat reducers", () => {
  it("averages the two middle values for an even sample", () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it("takes the middle value for an odd sample", () => {
    expect(median([5, 1, 3])).toBe(3);
  });

  it("interpolates p90", () => {
    expect(p90([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBeCloseTo(9.1, 10);
  });

  it("computes the mean", () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });
});

describe("reduceDuration", () => {
  it("requires five samples", () => {
    expect(MIN_DURATION_SAMPLE).toBe(5);
    expect(reduceDuration([1, 2, 3, 4], "median")).toBeNull();
    expect(reduceDuration([1, 2, 3, 4, 5], "median")).toBe(3);
  });

  it("honours the requested statistic", () => {
    const values = [10, 20, 30, 40, 1000];
    expect(reduceDuration(values, "median")).toBe(30);
    expect(reduceDuration(values, "mean")).toBe(220);
    expect(reduceDuration(values, "p90")).toBeCloseTo(616, 10);
  });

  it("returns null for an empty sample", () => {
    expect(reduceDuration([], "mean")).toBeNull();
  });
});
