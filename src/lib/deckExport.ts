// Serialize a deck's cards into copy-pasteable text.
// Ported from mobile (v67). Round-trippable with deckImport.ts.

import type { TermSeparator } from './deckImport';

export type { TermSeparator };

export interface ExportCard {
  front: string;
  back: string;
}

const SEP_CHAR: Record<TermSeparator, string> = {
  tab: '\t',
  comma: ',',
  semicolon: ';',
};

export const SEP_LABEL: Record<TermSeparator, string> = {
  tab: 'Tab',
  comma: 'Comma',
  semicolon: 'Semicolon',
};

function encodeField(field: string, sep: TermSeparator): string {
  const ch = SEP_CHAR[sep];
  if (sep === 'tab') {
    return field.replace(/[\t\r\n]+/g, ' ');
  }
  const needsQuote = field.includes(ch) || field.includes('"') || /[\r\n]/.test(field);
  if (!needsQuote) return field;
  return `"${field.replace(/"/g, '""')}"`;
}

export function serializeDeck(
  cards: ExportCard[],
  separator: TermSeparator = 'tab',
): string {
  const ch = SEP_CHAR[separator];
  const lines: string[] = [];
  for (const c of cards) {
    const front = (c.front ?? '').trim();
    const back = (c.back ?? '').trim();
    if (!front || !back) continue;
    lines.push(encodeField(front, separator) + ch + encodeField(back, separator));
  }
  return lines.join('\n');
}

export function exportableCount(cards: ExportCard[]): number {
  let n = 0;
  for (const c of cards) {
    if ((c.front ?? '').trim() && (c.back ?? '').trim()) n++;
  }
  return n;
}
