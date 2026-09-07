import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FilterProvider } from "../state/FilterProvider";
import { Dashboard } from "./Dashboard";
import { msg } from "../metrics/fixtures";

describe("Dashboard", () => {
  it("uses a 1:1 subtitle for two senders", () => {
    render(
      <FilterProvider messages={[msg("Ada", "10:00"), msg("Bob", "10:01")]}>
        <Dashboard
          messages={[msg("Ada", "10:00"), msg("Bob", "10:01")]}
          warnings={[]}
          onReset={() => undefined}
        />
      </FilterProvider>,
    );
    expect(screen.getByText(/two-person chat/i)).toBeInTheDocument();
    expect(screen.getAllByText(/entire export/i).length).toBeGreaterThan(0);
  });

  it("uses a group subtitle for three senders", () => {
    const messages = [msg("Ada", "10:00"), msg("Bob", "10:01"), msg("Cy", "10:02")];
    render(
      <FilterProvider messages={messages}>
        <Dashboard messages={messages} warnings={[]} onReset={() => undefined} />
      </FilterProvider>,
    );
    expect(screen.getByText(/group chat/i)).toBeInTheDocument();
  });
});
