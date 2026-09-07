import { useState } from "react";
import type { ParsedMessage } from "../types/chat";
import { parseExport } from "../parse/parseExport";
import { Button, Page } from "../theme/UiKit";
import { readChatFile } from "./readChatFile";
import "./LandingPage.css";

export function LandingPage({
  onParsed,
}: {
  onParsed: (messages: ParsedMessage[], warnings: string[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setStatus("Reading on this device…");
    const read = await readChatFile(file);
    if (!read.ok) {
      setStatus(null);
      setError(read.error);
      return;
    }
    const { messages, warnings } = parseExport(read.text);
    setStatus(null);
    if (messages.length === 0) {
      setError(warnings[0] ?? "No WhatsApp messages found.");
      return;
    }
    onParsed(messages, warnings);
  };

  return (
    <Page>
      <div className="landing">
        <h1>WhatsApp Analyzer</h1>
        <p className="lede">
          Charts for who talks, when, and how fast people reply. The file never leaves this
          browser.
        </p>
        <p className="privacy">
          Privacy: your export stays on this device. We read it with FileReader only — nothing is
          uploaded, and closing the tab forgets the chat.
        </p>
        <div className="drop">
          <label htmlFor="chat-file">Choose a .txt export</label>
          <input
            id="chat-file"
            type="file"
            accept=".txt,text/plain"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <Button type="button" variant="ghost" onClick={() => document.getElementById("chat-file")?.click()}>
            Choose file
          </Button>
        </div>
        {status ? <p className="status">{status}</p> : null}
        {error ? <p className="error">{error}</p> : null}
        <p className="lede">
          Export in WhatsApp with <strong>Without Media</strong>, then drop the .txt here. If you
          received a .zip, unzip it first.
        </p>
      </div>
    </Page>
  );
}
