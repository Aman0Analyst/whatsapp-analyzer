import { RankBars } from "../charts/RankBars";
import { senderRank } from "../metrics/volume";
import { Card } from "../theme/UiKit";
import type { ParsedMessage } from "../types/chat";

export function RankSection({ messages }: { messages: ParsedMessage[] }) {
  const rows = senderRank(messages).map((row) => ({ label: row.sender, n: row.n }));
  return (
    <Card>
      <h2>Sender rank</h2>
      <RankBars rows={rows} />
    </Card>
  );
}
