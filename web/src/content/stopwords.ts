import englishSrc from "./stopwords/english.txt?raw";
import indonesianSrc from "./stopwords/indonesian.txt?raw";
import { parseStopwords } from "../metrics/words";

const LISTS: Record<string, string> = {
  english: englishSrc,
  indonesian: indonesianSrc,
};

export function stopwordSet(lang: string | null): Set<string> {
  if (!lang) return new Set();
  const src = LISTS[lang];
  return src ? parseStopwords(src) : new Set();
}
