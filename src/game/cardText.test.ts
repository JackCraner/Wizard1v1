import {expect,it} from 'vitest';
import {CARDS} from '../config/catalogue';
import {cardAt} from './upgrades';
import {cardRequirements,ruleSections,upgradeSummary} from './cardText';
it('upgrade previews describe cast changes and updated effects',()=>{expect(upgradeSummary(cardAt('starsurge'))).toBe('Cast time becomes 1T.');expect(upgradeSummary(cardAt('prayer'))).toBe('Gain 5 Regeneration.');});
it('only bracketed clauses take their domain colour',()=>{const c=cardAt('ember',3),s=ruleSections(c.rules,c);expect(s[0].domain).toBeUndefined();expect(s[1].domain).toBe('fire');expect(s[1].text).toContain('2 additional Heat');expect(cardRequirements(cardAt('lay-on-hands')).whole).toBeUndefined();expect(cardRequirements(cardAt('firebolt',3)).domains).toContain('fire');});
it('all spell text survives formatting without bracket delimiters',()=>{for(const c of CARDS)for(const xp of [0,3]){const v=cardAt(c.id,xp);const normalize=(s:string)=>s.toLowerCase().replace(/[\s\[\]]/g,'');expect(normalize(ruleSections(v.rules,v).map(s=>s.text).join(''))).toBe(normalize(v.rules));}});
