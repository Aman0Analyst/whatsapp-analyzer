import type { ParsedMessage } from "../types/chat";

export function topEmojis(messages: ParsedMessage[], limit: number): { emoji: string; n: number }[] {
  const counts = new Map<string, number>();
  for (const message of messages) {
    for (const emoji of message.emojis) {
      counts.set(emoji, (counts.get(emoji) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([emoji, n]) => ({ emoji, n }))
    .sort((a, b) => b.n - a.n || a.emoji.localeCompare(b.emoji))
    .slice(0, limit);
}

export function topDomains(messages: ParsedMessage[], limit: number): { domain: string; n: number }[] {
  const counts = new Map<string, number>();
  for (const message of messages) {
    for (const domain of message.domains) {
      counts.set(domain, (counts.get(domain) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([domain, n]) => ({ domain, n }))
    .sort((a, b) => b.n - a.n || a.domain.localeCompare(b.domain))
    .slice(0, limit);
}

export function contentRates(messages: ParsedMessage[]): {
  messages: number;
  attachments: number;
  deleted: number;
  links: number;
  attachmentRate: number;
  deletedRate: number;
  linkRate: number;
} {
  const rows = messages.filter((m) => m.lineType !== "event");
  const attachments = rows.filter((m) => m.lineType === "attachment").length;
  const deleted = rows.filter((m) => m.lineType === "deleted").length;
  const links = rows.filter((m) => m.domains.length > 0).length;
  const total = rows.length;
  const rate = (n: number) => (total === 0 ? 0 : n / total);
  return {
    messages: total,
    attachments,
    deleted,
    links,
    attachmentRate: rate(attachments),
    deletedRate: rate(deleted),
    linkRate: rate(links),
  };
}
