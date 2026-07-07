// Parse pasted Quizlet / Anki / CSV card data into front/back pairs.
// Ported from the native mobile app (v65) — pure module, no framework deps.

export type TermSeparator = 'tab' | 'comma' | 'semicolon';

export interface ParsedCard {
  front: string;
  back: string;
}

export interface ParseResult {
  cards: ParsedCard[];
  skipped: number;
  separator: TermSeparator;
}

export const MAX_IMPORT_CARDS = 500;

const SEP_CHAR: Record<TermSeparator, string> = {
  tab: '\t',
  comma: ',',
  semicolon: ';',
};

export function detectSeparator(raw: string): TermSeparator {
  if (raw.includes('\t')) return 'tab';
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  const onLines = (ch: string) => lines.filter(l => l.includes(ch)).length;
  const semi = onLines(';');
  const comma = onLines(',');
  if (semi > 0 && semi >= comma) return 'semicolon';
  if (comma > 0) return 'comma';
  return 'tab';
}

function stripQuotes(s: string): string {
  const t = s.trim();
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
    return t.slice(1, -1).replace(/""/g, '"').trim();
  }
  return t;
}

export function parseDeckImport(
  raw: string,
  separator: TermSeparator | 'auto' = 'auto',
): ParseResult {
  const resolved = separator === 'auto' ? detectSeparator(raw) : separator;
  const ch = SEP_CHAR[resolved];
  const cards: ParsedCard[] = [];
  let skipped = 0;

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const idx = line.indexOf(ch);
    if (idx === -1) {
      skipped++;
      continue;
    }
    const front = stripQuotes(line.slice(0, idx));
    const back = stripQuotes(line.slice(idx + 1));
    if (!front || !back) {
      skipped++;
      continue;
    }
    cards.push({ front, back });
  }

  return { cards, skipped, separator: resolved };
}
