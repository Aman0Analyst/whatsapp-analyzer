import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterBar } from "./FilterBar";
import { FilterProvider, useFilter } from "./FilterProvider";
import { msg } from "../metrics/fixtures";

function GrainProbe() {
  const { filter } = useFilter();
  return <div data-testid="grain">{filter.grain}</div>;
}

function StripProbe() {
  const { filter } = useFilter();
  return <div data-testid="strip">{String(filter.stripEmojisForLength)}</div>;
}

const messages = [msg("Ada", "2024-01-01 10:00"), msg("Bob", "2024-01-02 11:00")];

describe("FilterBar", () => {
  it("updates grain in context consumers", async () => {
    const user = userEvent.setup();
    render(
      <FilterProvider messages={messages}>
        <FilterBar />
        <GrainProbe />
      </FilterProvider>,
    );
    expect(screen.getByTestId("grain")).toHaveTextContent("month");
    await user.selectOptions(screen.getByRole("combobox", { name: /time grain/i }), "week");
    expect(screen.getByTestId("grain")).toHaveTextContent("week");
  });

  it("labels the reply window as response time only", () => {
    render(
      <FilterProvider messages={messages}>
        <FilterBar />
      </FilterProvider>,
    );
    expect(screen.getByRole("combobox", { name: /response time only/i })).toBeInTheDocument();
  });

  it("offers the emoji-strip toggle on by default and turns it off", async () => {
    const user = userEvent.setup();
    render(
      <FilterProvider messages={messages}>
        <FilterBar />
        <StripProbe />
      </FilterProvider>,
    );
    const box = screen.getByRole("checkbox", { name: /ignore emojis in long messages/i });
    expect(box).toBeChecked();
    expect(screen.getByTestId("strip")).toHaveTextContent("true");
    await user.click(box);
    expect(screen.getByTestId("strip")).toHaveTextContent("false");
  });

  it("explains the emoji-strip toggle in plain language", async () => {
    const user = userEvent.setup();
    render(
      <FilterProvider messages={messages}>
        <FilterBar />
      </FilterProvider>,
    );
    await user.click(
      screen.getByRole("button", { name: /what is ignore emojis in long messages\?/i }),
    );
    expect(screen.getByRole("note")).toHaveTextContent(/only affects the long-message list/i);
  });
});
