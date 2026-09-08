import { describe, expect, it } from "vitest";
import { msg } from "./fixtures";
import { collapseLetterRuns, findStretchedWords } from "./stretched";

describe("collapseLetterRuns", () => {
  it("collapses consecutive letters ignoring case", () => {
    expect(collapseLetterRuns("Jaaaan")).toBe("jan");
    expect(collapseLetterRuns("Jaaaannnnn")).toBe("jan");
    expect(collapseLetterRuns("goooodddd")).toBe("god");
    expect(collapseLetterRuns("gggooood")).toBe("god");
    expect(collapseLetterRuns("jaan")).toBe("jan");
    expect(collapseLetterRuns("good")).toBe("god");
  });

  it("drops digits, punctuation and leftover emoji", () => {
    expect(collapseLetterRuns("jaaaan!!!")).toBe("jan");
    expect(collapseLetterRuns("gooood 🎉")).toBe("god");
  });
});

describe("findStretchedWords", () => {
  it("groups stretched spellings of the query and ignores exact unstretched words", () => {
    const rows = findStretchedWords(
      [
        msg("Ada", "10:00", "Jaaaan"),
        msg("Ada", "10:01", "Jaaaannnnn again"),
        msg("Bob", "10:02", "jaan"),
        msg("Cara", "10:03", "hello"),
      ],
      "jaan",
    );
    expect(rows.collapsed).toBe("jan");
    expect(rows.total).toBe(2);
    expect(rows.variants.map((row) => row.word)).toEqual(["jaaaan", "jaaaannnnn"]);
    expect(rows.variants.map((row) => row.n)).toEqual([1, 1]);
  });

  it("treats extra leading letters as the same stretch family", () => {
    const rows = findStretchedWords(
      [
        msg("Ada", "10:00", "goooodddd"),
        msg("Bob", "10:01", "gggooood"),
        msg("Cara", "10:02", "good"),
        msg("Dan", "10:03", "god"),
      ],
      "good",
    );
    expect(rows.collapsed).toBe("god");
    expect(rows.total).toBe(2);
    expect(rows.variants.map((row) => row.word).sort()).toEqual(["gggooood", "goooodddd"]);
  });

  it("returns nothing for a blank query or a query with no letters", () => {
    const messages = [msg("Ada", "10:00", "Jaaaan")];
    expect(findStretchedWords(messages, "   ").variants).toEqual([]);
    expect(findStretchedWords(messages, "!!!").variants).toEqual([]);
  });

  it("counts chat tokens only", () => {
    const rows = findStretchedWords(
      [msg("Ada", "10:00", "Jaaaan", { lineType: "attachment", words: ["Jaaaan"] })],
      "jaan",
    );
    expect(rows.total).toBe(0);
  });
});
