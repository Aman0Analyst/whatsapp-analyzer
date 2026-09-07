/**
 * Stable sender -> palette slot mapping. Keyed off the sorted sender list so a
 * person keeps the same colour in every chart, whatever order a section ranks
 * them in.
 */
export function senderColors(senders: string[]): Map<string, string> {
  const sorted = [...senders].sort((a, b) => a.localeCompare(b));
  return new Map(sorted.map((name, i) => [name, `--series-${(i % 8) + 1}`]));
}

export function colorFor(senders: string[], sender: string): string {
  return senderColors(senders).get(sender) ?? "--series-1";
}
