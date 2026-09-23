import {expect,it} from 'vitest';
import {CARDS} from '../config/catalogue';
import {cardAt} from './upgrades';
import {cardRequirements,ruleSections,upgradeSummary} from './cardText';

it('summarizes upgrade changes while retaining attunement and complete upgraded rules',()=>{
 expect(upgradeSummary(cardAt('starsurge'))).toBe('Cast time becomes 1T.');
 expect(upgradeSummary(cardAt('prayer'))).toBe('Holy attuned: Gain Resilience for 1 tick.');
 expect(upgradeSummary(cardAt('germination'))).toBe('Nature attuned: Become Instant.');
 expect(upgradeSummary(cardAt('ice-block'))).toBe('Cast time becomes 1T.');
 expect(cardAt('starsurge',3).rules).toContain('Deal 100 damage');
 expect(upgradeSummary(cardAt('leech'))).toBe('Deal 45 damage. Heal 20.');
});

it('does not confuse a themed keyword with an attunement requirement',()=>{
 const agony=cardAt('agony');expect(cardRequirements(agony).domains).toEqual([]);
 expect(ruleSections(agony.rules,agony).every(s=>!s.domain)).toBe(true);
 const prayer=cardAt('prayer',3),sections=ruleSections(prayer.rules,prayer);
 expect(sections[0]).toEqual({text:'Gain Regeneration for 3 ticks.',domain:undefined});
 expect(sections[1].domain).toBe('holy');expect(sections[1].text).toContain('Resilience');
});
it('distinguishes whole spell locks, numerical bonuses and conditional cast speed',()=>{
 expect(cardRequirements(cardAt('lay-on-hands')).whole).toBe('holy');
 expect(ruleSections(cardAt('lay-on-hands').rules,cardAt('lay-on-hands')).every(s=>s.domain==='holy')).toBe(true);
 const malison=cardAt('malison',3);expect(cardRequirements(malison).whole).toBeUndefined();expect(ruleSections(malison.rules,malison).at(-1)?.domain).toBe('affliction');
 const bolt=cardAt('firebolt',3),parts=ruleSections(bolt.rules,bolt);expect(parts[0].domain).toBe('fire');expect(parts.at(-1)?.domain).toBeUndefined();expect(parts.at(-1)?.text).toContain('Deal 80');
});
it('preserves all authored rule text, decimals and fallbacks across the complete catalogue',()=>{
 for(const card of CARDS)for(const xp of [0,3]){const variant=cardAt(card.id,xp);expect(ruleSections(variant.rules,variant).map(s=>s.text).join('').replace(/\s/g,''),variant.id).toBe(variant.rules.replace(/\s/g,''));}
 expect(ruleSections('Heal 1.5 per tick. Deal 2.5 damage.')[0].text).toContain('1.5');
});
