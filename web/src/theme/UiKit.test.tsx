import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, Card, Kpi } from "./UiKit";

describe("UiKit", () => {
  it("renders a card, kpi and brown button", () => {
    render(
      <Card>
        <Kpi label="Messages" value="12" hint="this range" />
        <Button>Ready</Button>
      </Card>,
    );
    expect(screen.getByText("Messages")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ready" })).toHaveClass("btn-primary");
  });
});
