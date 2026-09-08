import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, Button, Card, Kpi, ReadingList, ReadingRow } from "./UiKit";

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

describe("ReadingList", () => {
  it("renders each row as a list item with its title, meta and body", () => {
    render(
      <ReadingList>
        <ReadingRow title="Ada" meta="3 Mar, 21:04" body="The whole passage, as written." />
        <ReadingRow title="Grace" meta="4 Mar, 08:12" body="A second passage." />
      </ReadingList>,
    );
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Ada");
    expect(rows[0]).toHaveTextContent("3 Mar, 21:04");
    expect(rows[0]).toHaveTextContent("The whole passage, as written.");
    expect(screen.getByRole("list")).toHaveClass("readlist");
  });

  it("tints the swatch from a series token and drops it when unset", () => {
    const { container, rerender } = render(
      <ReadingList>
        <ReadingRow title="Ada" body="Passage." colorVar="--series-3" />
      </ReadingList>,
    );
    expect(container.querySelector(".readlist-swatch")).toHaveStyle({
      background: "var(--series-3)",
    });

    rerender(
      <ReadingList>
        <ReadingRow title="Ada" body="Passage." />
      </ReadingList>,
    );
    expect(container.querySelector(".readlist-swatch")).toBeNull();
    expect(container.querySelector(".readlist-meta")).toBeNull();
  });

  it("accepts an aside for badges alongside the title", () => {
    render(
      <ReadingList>
        <ReadingRow title="Ada" body="Passage." aside={<Badge tone="accent">Longest 1%</Badge>} />
      </ReadingList>,
    );
    expect(screen.getByText("Longest 1%")).toHaveClass("badge-accent");
  });
});
