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
});
