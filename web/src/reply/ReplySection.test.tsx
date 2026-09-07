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
});
