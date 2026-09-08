export type LineType = "chat" | "attachment" | "event" | "deleted";

export type TimeGrain = "day" | "week" | "month" | "quarter";

export type CountStat = "sum";
export type DurationStat = "median" | "p90" | "mean";

export interface ParsedMessage {
  timestamp: Date;
  sender: string | null;
  body: string;
  lineType: LineType;
  words: string[];
  emojis: string[];
  domains: string[];
}

export interface ReplyEvent {
  at: Date;
  delaySeconds: number;
  replier: string;
}

export interface FilterState {
  senders: string[] | "all";
  rangeStart: Date | null;
  rangeEnd: Date | null;
  grain: TimeGrain;
  durationStat: DurationStat;
  hourStart: number; // 0–23 inclusive
  hourEnd: number;   // 0–23 inclusive
  replyWindowMinutes: 30 | 120 | 720 | 1440;
  stopwordLang: string | null;
  /** When true, drop parsed emojis before scoring long / outlier messages. */
  stripEmojisForLength: boolean;
}

export const defaultFilter = (): FilterState => ({
  senders: "all",
  rangeStart: null,
  rangeEnd: null,
  grain: "month",
  durationStat: "median",
  hourStart: 0,
  hourEnd: 23,
  replyWindowMinutes: 120,
  stopwordLang: "english",
  stripEmojisForLength: true,
});
