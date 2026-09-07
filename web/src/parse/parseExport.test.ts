import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseExport } from "./parseExport";

const fixture = (name: string) =>
  readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), "utf8");

describe("starting line formats", () => {
  it("parses android dash format", () => {
    const { messages } = parseExport("14/10/18, 11:16 - Ada: hello\n");
    expect(messages[0].sender).toBe("Ada");
    expect(messages[0].body.trim()).toBe("hello");
    expect(messages[0].lineType).toBe("chat");
  });

  it("parses ios brackets and pm", () => {
    const { messages } = parseExport("[23/10/2020, 5:00:00 pm] User: message 🍆\n");
    expect(messages[0].emojis).toContain("🍆");
    expect(messages[0].timestamp.getHours()).toBe(17);
  });

  it("reads 12am as hour zero and uppercase AM/PM with dots", () => {
    const { messages } = parseExport(
      "[24/10/2020, 12:05:00 A.M.] User: night\n[24/10/2020, 12:05:00 P.M.] User: noon\n",
    );
    expect(messages[0].timestamp.getHours()).toBe(0);
    expect(messages[1].timestamp.getHours()).toBe(12);
  });

  it("accepts dash date separators and dotted times", () => {
    const { messages } = parseExport("23-10-2020, 21.05 - Ada: hi\n");
    expect(messages[0].timestamp.getHours()).toBe(21);
    expect(messages[0].timestamp.getMinutes()).toBe(5);
  });

  it("resolves ambiguous dates month-first and falls back to day-first", () => {
    const { messages } = parseExport(
      "2/22/19, 14:01 - Ada: month first\n14/10/18, 11:16 - Ada: day first\n",
    );
    // 2/22/19 cannot be day-first (month 22), so February 22 2019
    expect(messages[0].timestamp.getFullYear()).toBe(2019);
    expect(messages[0].timestamp.getMonth()).toBe(1);
    expect(messages[0].timestamp.getDate()).toBe(22);
    // 14/10/18 cannot be month-first (month 14), so 14 October 2018
    expect(messages[1].timestamp.getFullYear()).toBe(2018);
    expect(messages[1].timestamp.getMonth()).toBe(9);
    expect(messages[1].timestamp.getDate()).toBe(14);
  });

  it("keeps seconds when the export has them", () => {
    const { messages } = parseExport("[23/10/2020, 17:00:42] Ada: hi\n");
    expect(messages[0].timestamp.getSeconds()).toBe(42);
  });

  it("strips direction marks and non-breaking spaces", () => {
    const { messages } = parseExport("\u200e[23/10/2020, 5:00:00 pm]\u00a0Ada: \u202ahi\u202c\n");
    expect(messages[0].sender).toBe("Ada");
    expect(messages[0].body).toBe("hi");
  });

  it("keeps one sender when a phone number uses a non-breaking space", () => {
    const { messages } = parseExport(
      "2/22/19, 14:01 - +62\u00a08xx-xxx-x09: one\n2/22/19, 14:02 - +62 8xx-xxx-x09: two\n",
    );
    expect(new Set(messages.map((m) => m.sender))).toEqual(new Set(["+62 8xx-xxx-x09"]));
  });
});

describe("line types", () => {
  it("marks media omitted as attachment", () => {
    const { messages } = parseExport("2/22/19, 14:01 - Ada: <Media omitted>\n");
    expect(messages[0].lineType).toBe("attachment");
  });

  it("marks ios omitted media and attached files as attachment", () => {
    const { messages } = parseExport(
      "[23/10/2020, 5:01:12 pm] Bob: \u200eimage omitted\n" +
        "[23/10/2020, 5:01:13 pm] Bob: \u200e<attached: 00000042-PHOTO-2020-10-23.jpg>\n",
    );
    expect(messages.map((m) => m.lineType)).toEqual(["attachment", "attachment"]);
  });

  it("marks deleted messages", () => {
    const { messages } = parseExport(
      "6/14/19, 11:24 - Ada: This message was deleted\n" +
        "6/14/19, 11:25 - Ada: You deleted this message.\n",
    );
    expect(messages.map((m) => m.lineType)).toEqual(["deleted", "deleted"]);
    expect(messages[0].words).toEqual([]);
  });

  it("marks system lines as events with no sender", () => {
    const { messages } = parseExport(
      '9/29/17, 13:11 - Ada created group "Devs"\n' +
        "9/29/17, 13:12 - Bob's security code changed. Tap for more info.\n" +
        "9/29/17, 13:13 - Bob left\n",
    );
    expect(messages.map((m) => m.lineType)).toEqual(["event", "event", "event"]);
    expect(messages.every((m) => m.sender === null)).toBe(true);
  });

  it("does not mistake a chat about adding things for an event", () => {
    const { messages } = parseExport("9/29/17, 13:11 - Ada: I added milk to the list\n");
    expect(messages[0].lineType).toBe("chat");
    expect(messages[0].sender).toBe("Ada");
  });
});

describe("multiline messages", () => {
  it("joins following lines onto previous sender", () => {
    const text = `4/4/19, 20:41 - Bob: line one
still bob
4/4/19, 20:42 - Ada: next
`;
    const { messages } = parseExport(text);
    expect(messages.filter((m) => m.sender === "Bob").length).toBeGreaterThanOrEqual(1);
    expect(messages).toHaveLength(2);
    expect(messages[0].body).toBe("line one\nstill bob");
    expect(messages[0].words).toContain("still");
  });

  it("keeps blank lines inside a message and drops them between messages", () => {
    const text = "4/4/19, 20:41 - Bob: one\n\ntwo\n4/4/19, 20:42 - Ada: next\n\n";
    const { messages } = parseExport(text);
    expect(messages).toHaveLength(2);
    expect(messages[0].body).toBe("one\n\ntwo");
  });
});

describe("content extraction", () => {
  it("collects domains and keeps urls out of the words", () => {
    const { messages } = parseExport(
      "2/21/19, 22:27 - Ada: see https://cantunsee.space/ and www.reddit.com/r/x now\n",
    );
    expect(messages[0].domains).toEqual(["cantunsee.space", "www.reddit.com"]);
    expect(messages[0].words).toEqual(["see", "and", "now"]);
  });

  it("survives a url-like run of punctuation", () => {
    const started = performance.now();
    const { messages } = parseExport(`4/4/19, 20:41 - Ada: https://${".".repeat(200)} end\n`);
    expect(performance.now() - started).toBeLessThan(1000);
    expect(messages[0].words).toContain("end");
  });

  it("does not treat an email address as a url", () => {
    const { messages } = parseExport("4/4/19, 20:41 - Ada: mail ronald@akasia.id ok\n");
    expect(messages[0].domains).toEqual([]);
  });

  it("collects emoji including multi-codepoint sequences", () => {
    const { messages } = parseExport("4/4/19, 20:41 - Ada: 👏👏 hi 👨‍👩‍👧 🇮🇩 done\n");
    expect(messages[0].emojis).toEqual(["👏", "👏", "👨‍👩‍👧", "🇮🇩"]);
    expect(messages[0].words).toEqual(["hi", "done"]);
  });

  it("keeps non-ascii words and drops punctuation", () => {
    const { messages } = parseExport("4/4/19, 20:41 - Ada: héllo, dunia! #tag_1\n");
    expect(messages[0].words).toEqual(["héllo", "dunia", "tag_1"]);
  });

  it("leaves words empty on attachments and events", () => {
    const { messages } = parseExport(
      "2/22/19, 14:01 - Ada: <Media omitted>\n9/29/17, 13:11 - Ada left\n",
    );
    expect(messages[0].words).toEqual([]);
    expect(messages[1].words).toEqual([]);
  });
});

describe("warnings", () => {
  it("reports an empty export", () => {
    const { messages, warnings } = parseExport("");
    expect(messages).toEqual([]);
    expect(warnings.join(" ")).toMatch(/no whatsapp messages/i);
  });

  it("leads with the empty result when nothing parsed", () => {
    const { messages, warnings } = parseExport("just some notes\nand another line\n");
    expect(messages).toEqual([]);
    expect(warnings[0]).toMatch(/no whatsapp messages/i);
    expect(warnings[1]).toMatch(/before the first dated message/i);
  });

  it("reports lines before the first dated message", () => {
    const { messages, warnings } = parseExport("garbage header\n14/10/18, 11:16 - Ada: hello\n");
    expect(messages).toHaveLength(1);
    expect(warnings.join(" ")).toMatch(/before the first dated message/i);
  });

  it("reports lines with an impossible date", () => {
    const { messages, warnings } = parseExport("32/13/19, 11:16 - Ada: hello\n");
    expect(messages).toEqual([]);
    expect(warnings.join(" ")).toMatch(/date/i);
  });
});

describe("fixtures", () => {
  it("parses the android fixture", () => {
    const { messages, warnings } = parseExport(fixture("android.txt"));
    const senders = new Set(messages.map((m) => m.sender).filter(Boolean));
    expect(senders).toEqual(new Set(["Ada", "Bob"]));
    expect(messages.filter((m) => m.lineType === "event")).toHaveLength(4);
    expect(messages.filter((m) => m.lineType === "attachment")).toHaveLength(1);
    expect(messages.filter((m) => m.lineType === "deleted")).toHaveLength(1);
    expect(messages.filter((m) => m.lineType === "chat")).toHaveLength(4);
    expect(warnings).toEqual([]);
  });

  it("parses the ios fixture", () => {
    const { messages } = parseExport(fixture("ios.txt"));
    expect(messages.filter((m) => m.lineType === "event")).toHaveLength(1);
    expect(messages.filter((m) => m.lineType === "attachment")).toHaveLength(1);
    expect(messages.filter((m) => m.lineType === "deleted")).toHaveLength(1);
    expect(messages[messages.length - 1].timestamp.getHours()).toBe(0);
    expect(messages.map((m) => m.timestamp.getTime())).toEqual(
      [...messages].map((m) => m.timestamp.getTime()).sort((a, b) => a - b),
    );
  });

  it("parses the real export fixture", () => {
    const { messages } = parseExport(fixture("chat_example.txt"));
    const senders = new Set(messages.map((m) => m.sender).filter(Boolean));
    expect(senders.size).toBeGreaterThan(1);
    expect(messages.filter((m) => m.lineType === "chat").length).toBeGreaterThan(100);
    expect(messages.filter((m) => m.lineType === "attachment").length).toBeGreaterThan(0);
    expect(messages.filter((m) => m.lineType === "deleted")).toHaveLength(1);
    expect(messages.filter((m) => m.lineType === "event").length).toBeGreaterThan(0);
    expect(messages.some((m) => m.domains.includes("github.com"))).toBe(true);
    expect(messages.every((m) => !Number.isNaN(m.timestamp.getTime()))).toBe(true);
  });
});
