import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { parseStopwords, topWords } from "../metrics/words";
import { msg } from "../metrics/fixtures";
import englishSrc from "./stopwords/english.txt?raw";
import { ContentSection } from "./ContentSection";
import { FilterProvider } from "../state/FilterProvider";
import type { FilterState, ParsedMessage } from "../types/chat";

/** Nine short chat lines, so `longMessages` clears its 8-message minimum. */
function filler(): ParsedMessage[] {
  return Array.from({ length: 9 }, (_, i) => msg("Bob", `10:${String(i + 10)}`, `line ${i}`));
}

function show(messages: ParsedMessage[], initialFilter?: Partial<FilterState>) {
  return render(
    <FilterProvider messages={messages} initialFilter={initialFilter}>
      <ContentSection messages={messages} />
    </FilterProvider>,
  );
}

describe("stopwords", () => {
  it("drops english the from the word list", () => {
    const stop = parseStopwords(englishSrc);
    const rows = topWords([msg("Ada", "10:00", "the coffee")], stop, 10);
    expect(rows.map((r) => r.word)).not.toContain("the");
    expect(rows.map((r) => r.word)).toContain("coffee");
  });
});

describe("ContentSection", () => {
  it("recomputes words when people change", () => {
    const messages = [msg("Ada", "10:00", "coffee beans"), msg("Bob", "10:01", "tea leaves")];
    const { rerender } = render(
      <FilterProvider key="ada" messages={messages} initialFilter={{ senders: ["Ada"] }}>
        <ContentSection messages={messages} />
      </FilterProvider>,
    );
    expect(screen.getByText("coffee")).toBeInTheDocument();
    expect(screen.queryByText("tea")).not.toBeInTheDocument();
    rerender(
      <FilterProvider key="bob" messages={messages} initialFilter={{ senders: ["Bob"] }}>
        <ContentSection messages={messages} />
      </FilterProvider>,
    );
    expect(screen.getByText("tea")).toBeInTheDocument();
  });

  it("ranks shared sites as a compact list, busiest first", () => {
    const messages = [
      msg("Ada", "10:00", "read this", { domains: ["news.example.com"] }),
      msg("Bob", "10:01", "and this", { domains: ["news.example.com"] }),
      msg("Ada", "10:02", "also", { domains: ["blog.example.org"] }),
    ];
    const { container } = show(messages);

    expect(screen.getByText("Most shared sites")).toBeInTheDocument();
    const rows = [...container.querySelectorAll(".mini-rank-row")].map((row) => row.textContent);
    expect(rows).toEqual(["1news.example.com2", "2blog.example.org1"]);
  });

  it("hides the site list when nothing was linked", () => {
    show([msg("Ada", "10:00", "no links here")]);
    expect(screen.queryByText("Most shared sites")).not.toBeInTheDocument();
  });

  it("groups top emojis by person and skips people with none", () => {
    const messages = [
      msg("Ada", "10:00", "yes 🎉🎉", { emojis: ["🎉", "🎉"] }),
      msg("Ada", "10:01", "ok 👍", { emojis: ["👍"] }),
      msg("Bob", "10:02", "plain text"),
      msg("Cara", "10:03", "hi 🙂", { emojis: ["🙂"] }),
    ];
    const { container } = show(messages);

    expect(screen.getByText("Emojis per person")).toBeInTheDocument();
    const people = [...container.querySelectorAll(".emoji-people > li")].map(
      (row) => row.textContent ?? "",
    );
    // Ada first: three emoji occurrences against Cara's one. Bob sent none.
    expect(people).toHaveLength(2);
    expect(people[0]).toContain("Ada");
    expect(people[0]).toContain("🎉");
    expect(people[0]).toContain("👍");
    expect(people[1]).toContain("Cara");
    expect(people.join(" ")).not.toContain("Bob");
  });

  it("hides the per-person emoji block when the range has no emojis", () => {
    show([msg("Ada", "10:00", "words only")]);
    expect(screen.queryByText("Emojis per person")).not.toBeInTheDocument();
  });

  it("lists long messages as a reading list with sender, time and truncated body", () => {
    const body = `war and peace ${"and more words ".repeat(30)}`;
    const messages = [...filler(), msg("Ada", "11:30", body)];
    const { container } = show(messages);

    expect(screen.getByText("Longest messages")).toBeInTheDocument();
    const rows = container.querySelectorAll(".longest-row");
    expect(rows).toHaveLength(1);

    const row = rows[0];
    expect(row.textContent).toContain("Ada");
    expect(row.textContent).toContain(`${body.length.toLocaleString()} characters`);

    const shown = row.querySelector(".longest-body")?.textContent ?? "";
    expect(shown.startsWith("war and peace")).toBe(true);
    expect(shown.endsWith("…")).toBe(true);
    expect(shown.length).toBeLessThanOrEqual(161);
  });

  it("reads filter.stripEmojisForLength when scoring length", () => {
    // 200 plain characters plus one emoji, which costs 2 UTF-16 units.
    const long = msg("Ada", "11:30", `${"x".repeat(200)}🙂`, { emojis: ["🙂"] });
    const messages = [...filler(), long];

    const stripped = show(messages, { stripEmojisForLength: true });
    expect(stripped.container.querySelector(".longest-length")?.textContent).toBe(
      "200 characters",
    );
    stripped.unmount();

    const kept = show(messages, { stripEmojisForLength: false });
    expect(kept.container.querySelector(".longest-length")?.textContent).toBe("202 characters");
  });

  it("hides the reading list when there are too few messages to compare", () => {
    show([msg("Ada", "10:00", "short"), msg("Bob", "10:01", "also short")]);
    expect(screen.queryByText("Longest messages")).not.toBeInTheDocument();
  });
});
