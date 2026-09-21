import { describe, expect, it } from 'vitest';
import { CARDS, CARD_BY_ID, goldCost, KEYWORDS, keywordSpans, explainedKeywords, manaLabel, castLabel } from './catalogue';

describe('spell catalogue', () => {
  it('contains all 98 unique spells in the supplied four domains', () => {
    expect(CARDS).toHaveLength(98);
    expect(new Set(CARDS.map(c => c.id)).size).toBe(98);
    expect(['nature','water','fire','holy'].map(d => CARDS.filter(c => c.domain === d).length)).toEqual([25,25,21,27]);
    for (const card of CARDS) {
      expect(card.stars).toBeGreaterThanOrEqual(1); expect(card.stars).toBeLessThanOrEqual(5);
      expect(goldCost(card)).toBe(card.stars);
      expect(card.castTicks === null || (Number.isInteger(card.castTicks) && card.castTicks >= 0)).toBe(true);
      expect(card.mana === null || card.mana === 'half' || (Number.isInteger(card.mana) && card.mana >= 0)).toBe(true);
      card.keywords.forEach(id => expect(KEYWORDS[id], `${card.id}: ${id}`).toBeDefined());
    }
  });
  it('derives gold cost and distinguishes unknown, free, instant and half-mana values', () => {
    expect(goldCost({ stars: 4 })).toBe(4);
    expect(manaLabel(null)).toBe('TBD'); expect(manaLabel(0)).toBe('0'); expect(manaLabel('half')).toBe('½');
    expect(castLabel(0)).toBe('Instant'); expect(castLabel(null)).toBe('TBD');
    expect(CARD_BY_ID['celestial-alignment'].castTicks).toBe(1);
    expect(CARD_BY_ID['celestial-alignment'].mana).toBe(0);
    expect(CARD_BY_ID['cloud-heart'].mana).toBe(10);
    expect(CARD_BY_ID['wild-growth'].rules).toContain('30 health');
    expect(CARD_BY_ID['renew'].rules).toContain('Gain 5 Growth and apply 5 Growth');
  });
  it('bolds whole keywords without corrupting the original rules', () => {
    const text = 'Gain 1 Star Empowerment. DoTs can crit; critical is not a keyword.';
    const spans = keywordSpans(text, ['star-empowerment','crit']);
    expect(spans.map(s => s.text).join('')).toBe(text);
    expect(spans.filter(s => s.bold).map(s => s.text)).toEqual(['Star Empowerment','DoTs','crit']);
  });
  it('resolves related explanations once, including Combust for Hotstreak', () => {
    const ids = explainedKeywords(['hotstreak','crit','hotstreak']).map(k => k.id);
    expect(ids).toEqual(['hotstreak','crit','combust']);
    for (const keyword of Object.values(KEYWORDS)) keyword.related.forEach(id => expect(KEYWORDS[id]).toBeDefined());
  });
});
