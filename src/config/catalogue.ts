import type { Effect } from '../game/model';
import natureCards from './nature/spell.json';
import waterCards from './water/spell.json';
import fireCards from './fire/spell.json';
import holyCards from './holy/spell.json';
import afflictionCards from './affliction/spell.json';
const rawCards = [...natureCards, ...waterCards, ...fireCards, ...holyCards, ...afflictionCards];
import rawKeywords from './keywords.json';

export type Domain = 'nature' | 'water' | 'fire' | 'holy' | 'affliction';
export interface CardDefinition {
  xp?: number; upgraded?: boolean;
  upgrade?: { castTicks:number|null;  rules:string; keywords:string[]; combat?:{effects?:Effect[];blockedReason?:string}; notes?:string[] };
  id: string; name: string; domain: Domain; stars: number; castTicks: number | null;
  combat?: { effects?: Effect[]; blockedReason?: string };
  rules: string; keywords: string[]; notes: string[];
}
export interface Keyword { name: string; aliases: string[]; description: string; related: string[] }
export const KEYWORDS: Record<string, Keyword> = rawKeywords;
export const CARDS: readonly CardDefinition[] = rawCards as CardDefinition[];
export const CARD_BY_ID = Object.fromEntries(CARDS.map(card => [card.id, card])) as Record<string, CardDefinition>;
export const goldCost = (card: Pick<CardDefinition, 'stars'>) => card.stars;
export const castLabel = (ticks: number | null) => ticks === null ? 'TBD' : ticks === 0 ? 'Instant' : `${ticks}T`;
export function explainedKeywords(ids: readonly string[]) {
  const found = new Set<string>();
  const visit = (id: string) => { if (found.has(id) || !KEYWORDS[id]) return; found.add(id); KEYWORDS[id].related.forEach(visit); };
  ids.forEach(visit);
  return [...found].map(id => ({ id, ...KEYWORDS[id] }));
}
// Use text spans rather than injecting markup. Longer names win over shorter terms.
export function keywordSpans(text: string, ids: readonly string[]) {
  const words = explainedKeywords(ids).flatMap(k => [k.name, ...k.aliases]).sort((a,b) => b.length - a.length);
  if (!words.length) return [{ text, bold: false }];
  const escaped = words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  const spans: { text: string; bold: boolean }[] = [];
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index!;
    if (index > offset) spans.push({ text: text.slice(offset, index), bold: false });
    spans.push({ text: match[0], bold: true }); offset = index + match[0].length;
  }
  if (offset < text.length) spans.push({ text: text.slice(offset), bold: false });
  return spans;
}
