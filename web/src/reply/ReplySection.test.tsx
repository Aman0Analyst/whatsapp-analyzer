import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReplySection } from "./ReplySection";
import { FilterProvider } from "../state/FilterProvider";
import { msg } from "../metrics/fixtures";

describe("ReplySection", () => {
  it("explains send-time replies and greys sparse people", () => {
    const messages = [
      msg("Ada", "10:00"),
      msg("Bob", "10:03"),
      msg("Ada", "10:04"),
    ];
    render(
      <FilterProvider messages={messages}>
        <ReplySection messages={messages} uniqueSenderCount={16} />
      </FilterProvider>,
    );
    expect(screen.getByText(/not read receipts/i)).toBeInTheDocument();
    expect(screen.getAllByText(/not enough replies/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/last-speaker proxy/i)).toBeInTheDocument();
  });

  it("says nothing about earlier replies when there are too few to split", () => {
    const messages = [msg("Ada", "10:00"), msg("Bob", "10:03")];
    render(
      <FilterProvider messages={messages}>
        <ReplySection messages={messages} uniqueSenderCount={2} />
      </FilterProvider>,
    );
    expect(screen.queryByText(/earlier on/i)).not.toBeInTheDocument();
  });

  it("compares the recent half of the stretch with the earlier half", () => {
    // One exchange a day: a minute apart for the first five days, ten for the last five.
    const messages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].flatMap((day) => {
      const date = `2024-01-${String(day).padStart(2, "0")}`;
      return [
        msg("Ada", `${date} 12:00`),
        msg("Bob", `${date} ${day <= 5 ? "12:01" : "12:10"}`),
      ];
    });
    render(
      <FilterProvider messages={messages}>
        <ReplySection messages={messages} uniqueSenderCount={2} />
      </FilterProvider>,
    );
    expect(screen.getByText(/Typical reply: 10m more recently, 1m earlier on — 9m slower\./)).toBeInTheDocument();
  });
});
