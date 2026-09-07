export type ReadChatResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export async function readChatFile(file: File): Promise<ReadChatResult> {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".txt")) {
    return { ok: false, error: "Please choose a .txt WhatsApp export (unzip first if needed)." };
  }
  const text = await file.text();
  if (!text.trim()) {
    return { ok: false, error: "That file is empty." };
  }
  return { ok: true, text };
}
