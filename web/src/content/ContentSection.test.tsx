import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { parseStopwords, topWords } from "../metrics/words";
import { msg } from "../metrics/fixtures";
import englishSrc from "./stopwords/english.txt?raw";
import { ContentSection } from "./ContentSection";
import { FilterProvider } from "../state/FilterProvider";

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
});
