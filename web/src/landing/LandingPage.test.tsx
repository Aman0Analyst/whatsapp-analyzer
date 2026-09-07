import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingPage } from "./LandingPage";
import { readChatFile } from "./readChatFile";

describe("LandingPage", () => {
  it("shows privacy copy before the file picker", () => {
    render(<LandingPage onParsed={() => undefined} />);
    const privacy = screen.getByText(/stays on this device/i);
    const picker = screen.getByLabelText(/choose a \.txt export/i);
    expect(privacy).toBeInTheDocument();
    expect(privacy.compareDocumentPosition(picker) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("readChatFile", () => {
  it("reads txt via file.text and rejects other types", async () => {
    const ok = new File(["14/10/18, 11:16 - Ada: hi\n"], "chat.txt", { type: "text/plain" });
    Object.defineProperty(ok, "text", { value: async () => "14/10/18, 11:16 - Ada: hi\n" });
    const result = await readChatFile(ok);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.text).toContain("Ada");

    const pdf = new File(["x"], "notes.pdf", { type: "application/pdf" });
    const bad = await readChatFile(pdf);
    expect(bad.ok).toBe(false);
  });

  it("rejects an empty file", async () => {
    const empty = new File([""], "chat.txt", { type: "text/plain" });
    Object.defineProperty(empty, "text", { value: async () => "" });
    const result = await readChatFile(empty);
    expect(result.ok).toBe(false);
  });
});
