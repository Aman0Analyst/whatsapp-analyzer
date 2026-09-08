import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FilterProvider } from "../state/FilterProvider";
import { Dashboard } from "./Dashboard";
import { msg } from "../metrics/fixtures";

const pair = [msg("Ada", "10:00"), msg("Bob", "10:01")];
const group = [msg("Ada", "10:00"), msg("Bob", "10:01"), msg("Cy", "10:02")];

function show(messages: typeof pair) {
  render(
    <FilterProvider messages={messages}>
      <Dashboard messages={messages} warnings={[]} onReset={() => undefined} />
    </FilterProvider>,
  );
}

describe("Dashboard", () => {
  it("uses a 1:1 subtitle for two senders", () => {
    show(pair);
    expect(screen.getByText(/two-person chat/i)).toBeInTheDocument();
    expect(screen.getAllByText(/entire export/i).length).toBeGreaterThan(0);
  });

  it("uses a group subtitle for three senders", () => {
    show(group);
    expect(screen.getByText(/group chat/i)).toBeInTheDocument();
  });

  it("shows longest silence and talk share alongside the volume headline", () => {
    show(pair);
    expect(screen.getByText("Longest silence")).toBeInTheDocument();
    expect(screen.getByText("Who fills the space")).toBeInTheDocument();
    expect(screen.getByText(/words per message/i)).toBeInTheDocument();
  });

  it("shows who opens and who closes conversations for a two-person chat", () => {
    show(pair);
    expect(screen.getByText("Who reaches out first")).toBeInTheDocument();
    expect(screen.getByText("Who has the last word")).toBeInTheDocument();
    expect(screen.queryByText("People each")).not.toBeInTheDocument();
  });

  it("swaps starters and closers for people-per-conversation in a group", () => {
    show(group);
    expect(screen.getByText("People each")).toBeInTheDocument();
    expect(screen.queryByText("Who reaches out first")).not.toBeInTheDocument();
    expect(screen.queryByText("Who has the last word")).not.toBeInTheDocument();
  });

  it("reads group health for a group", () => {
    show(group);
    expect(screen.getByText("How the room behaves")).toBeInTheDocument();
    expect(screen.getByText("Concentration")).toBeInTheDocument();
  });

  it("hides the group health section for a pair", () => {
    show(pair);
    expect(screen.queryByText("How the room behaves")).not.toBeInTheDocument();
  });
});
