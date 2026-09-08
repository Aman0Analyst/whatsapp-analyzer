import { describe, expect, it } from "vitest";
import { contentRates, topDomains, topEmojis, topEmojisBySender } from "./content";
import { event, msg } from "./fixtures";

describe("topEmojis", () => {
  it("counts emojis across messages", () => {
    const rows = topEmojis(
      [
        msg("Ada", "10:00", "hi", { emojis: ["🙏", "🙏"] }),
        msg("Bob", "10:01", "yo", { emojis: ["👌"] }),
      ],
      10,
    );
    expect(rows).toEqual([
      { emoji: "🙏", n: 2 },
      { emoji: "👌", n: 1 },
    ]);
  });

  it("honours the limit and returns nothing when there are no emojis", () => {
    const msgs = [msg("Ada", "10:00", "hi", { emojis: ["🙏", "👌", "🎉"] })];
    expect(topEmojis(msgs, 2)).toHaveLength(2);
    expect(topEmojis([msg("Ada", "10:00")], 5)).toEqual([]);
  });
});

describe("topEmojisBySender", () => {
  it("counts occurrences per sender, skips empty senders, and sorts by total", () => {
    const rows = topEmojisBySender(
      [
        msg("Ada", "10:00", "hi", { emojis: ["🙏", "🙏", "🎉"] }),
        msg("Bob", "10:01", "yo", { emojis: ["👌"] }),
        msg("Cara", "10:02", "plain"),
      ],
      10,
    );
    expect(rows).toEqual([
      {
        sender: "Ada",
        emojis: [
          { emoji: "🙏", n: 2 },
          { emoji: "🎉", n: 1 },
        ],
      },
      { sender: "Bob", emojis: [{ emoji: "👌", n: 1 }] },
    ]);
  });

  it("honours the per-sender limit", () => {
    const rows = topEmojisBySender(
      [msg("Ada", "10:00", "hi", { emojis: ["🙏", "🙏", "👌", "🎉"] })],
      2,
    );
    expect(rows[0]?.emojis).toHaveLength(2);
    expect(rows[0]?.emojis[0]).toEqual({ emoji: "🙏", n: 2 });
  });
});

describe("topDomains", () => {
  it("counts shared domains", () => {
    const rows = topDomains(
      [
        msg("Ada", "10:00", "look", { domains: ["youtube.com"] }),
        msg("Bob", "10:01", "and", { domains: ["youtube.com", "github.com"] }),
      ],
      10,
    );
    expect(rows).toEqual([
      { domain: "youtube.com", n: 2 },
      { domain: "github.com", n: 1 },
    ]);
  });
});

describe("contentRates", () => {
  it("reports counts and rates over non-event messages", () => {
    const msgs = [
      msg("Ada", "10:00"),
      msg("Ada", "10:01", "<Media omitted>", { lineType: "attachment", words: [] }),
      msg("Bob", "10:02", "This message was deleted", { lineType: "deleted" }),
      msg("Bob", "10:03", "see github.com", { domains: ["github.com"] }),
      event("10:04"),
    ];
    expect(contentRates(msgs)).toEqual({
      messages: 4,
      attachments: 1,
      deleted: 1,
      links: 1,
      attachmentRate: 0.25,
      deletedRate: 0.25,
      linkRate: 0.25,
    });
  });

  it("reports zero rates for an empty selection", () => {
    expect(contentRates([])).toEqual({
      messages: 0,
      attachments: 0,
      deleted: 0,
      links: 0,
      attachmentRate: 0,
      deletedRate: 0,
      linkRate: 0,
    });
  });
});
