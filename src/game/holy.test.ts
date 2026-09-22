import {expect,it} from 'vitest';
import {fighter,simulate} from './engine';
import {activeSpellIndices} from './rotation';
import {continuousCombatFrame} from './playback';
const idle=()=>fighter('B',['current']);

it('Fragile breaks one copy only after completing, skips it next cycle and preserves replay indexes',()=>{
 const a=fighter('A',['lay-on-hands','spark']);a.health=100;
 const b=simulate(a,idle());expect(b.frames[3].player.health).toBe(500);expect(b.frames[3].player.broken).toEqual([0]);
 expect(b.frames.flatMap(f=>f.events).filter(e=>e.side==='player'&&e.spell==='lay-on-hands')).toHaveLength(1);
 expect(b.frames[6].events.find(e=>e.side==='player')?.index).toBe(1);
 expect(a.broken).toBeUndefined();expect(a.spells).toEqual(['lay-on-hands','spark']);
 expect(continuousCombatFrame(b,4).player.broken).toEqual([0]);expect(b.frames[0].player.broken).toBeUndefined();
 expect(activeSpellIndices(b.frames[3].player)).toEqual([1]);
});
it('each Fragile copy can cast once and an exhausted deck safely idles',()=>{
 const r=simulate(fighter('A',['lay-on-hands','lay-on-hands']),idle());
 expect(r.frames[6].player.broken).toEqual([0,1]);expect(r.frames.at(-1)?.player.casting).toBeNull();
 expect(r.frames.at(-1)?.player.reshuffleRemaining).toBe(0);
 expect(r.frames.flatMap(f=>f.events).filter(e=>e.side==='player')).toHaveLength(2);
});
it('an interrupted or unattuned Fragile spell does not break; Echo completes before breaking',()=>{
 const a=fighter('A',['lay-on-hands']);a.attuned=[];
 expect(simulate(a,idle()).frames.at(-1)?.player.broken).toBeUndefined();
 expect(simulate(fighter('A',['lay-on-hands']),fighter('B',['disrupt'])).frames[1].player.broken).toBeUndefined();
 const e=fighter('A',['lay-on-hands']);e.statuses.tidecaller=5;e.health=100;
 const r=simulate(e,idle());expect(r.frames[3].player.broken).toEqual([0]);expect(r.frames[3].events[0].repeats).toBe(2);expect(r.frames[3].player.health).toBe(500);
});
it('Restraint watches two following full ticks and grants its full Guard duration',()=>{
 const r=simulate(fighter('A',['oath-restraint','prayer','current']),idle());
 expect(r.frames[1].player.oath?.remaining).toBe(2);expect(r.frames[2].player.oath?.remaining).toBe(1);
 expect(r.frames[3].player.statuses.guard).toBe(4);expect(r.frames[3].player.memory.oathCompleted).toBe(true);
 expect(r.frames[4].player.memory.oathCompleted).toBe(false);
});
it('Restraint fails from Poison damage; self damage is not damage dealt to the enemy',()=>{
 const b=idle();b.statuses.poison=4;
 const r=simulate(fighter('A',['oath-restraint','prayer']),b);expect(r.frames[2].player.oath).toBeUndefined();expect(r.frames[2].notices?.some(n=>n.text==='Oath broken')).toBe(true);
 const s=simulate(fighter('A',['oath-restraint','blood-pact','current']),idle());expect(s.frames[3].player.statuses.guard).toBe(4);
});
it('Eye for an Eye totals real damage across two ticks and rejects a shortfall',()=>{
 const r=simulate(fighter('A',['oath-eye-for-an-eye','radiant-spear','radiant-spear']),idle());
 expect(r.frames[2].player.oath?.progress).toBe(50);expect(r.frames[3].player.statuses.fury).toBe(6);
 const s=simulate(fighter('A',['oath-eye-for-an-eye','spark','spark']),idle());expect(s.frames[3].player.statuses.fury).toBeUndefined();
 const b=idle();b.shield=200;expect(simulate(fighter('A',['oath-eye-for-an-eye','radiant-spear','radiant-spear']),b).frames[3].player.statuses.fury).toBeUndefined();
});
it('Judgement counts damage after protection, rewards Stun, and fails on Health damage',()=>{
 const a=fighter('A',['oath-judgement','aegis','aegis']);a.shield=200;
 const r=simulate(a,fighter('B',['spark']));expect(r.frames[3].bot.statuses.stun).toBe(2);
 const s=simulate(fighter('A',['oath-judgement','current','current']),fighter('B',['spark']));expect(s.frames[3].player.oath).toBeUndefined();expect(s.frames[3].bot.statuses.stun).toBeUndefined();
});
it('Meditation pauses five full ticks and rewards damage only when finished',()=>{
 const r=simulate(fighter('A',['oath-meditation'],[],[3]),idle());
 expect(r.frames[5].bot.health).toBe(500);expect(r.frames[6].bot.health).toBe(100);
 expect(r.frames[6].player.memory.oathCompleted).toBe(true);expect(r.frames[6].player.statuses.stun).toBeUndefined();
 expect(r.frames.slice(2,7).every(f=>!f.events.some(e=>e.side==='player'))).toBe(true);
});
it('a new Oath replaces the old one; interrupting another spell does not break a timed Oath',()=>{
 const a=fighter('A',['oath-restraint','oath-eye-for-an-eye','radiant-spear','radiant-spear']);
 const r=simulate(a,idle());expect(r.frames[2].player.oath?.id).toBe('eye-for-an-eye');expect(r.frames[4].player.statuses.fury).toBe(6);expect(r.frames[4].player.statuses.guard).toBeUndefined();
 const b=fighter('B',['current','disrupt','current']);
 const s=simulate(fighter('A',['oath-restraint','smite','prayer']),b);expect(s.frames[3].player.statuses.guard).toBe(4);
});
it('Oath Echo retains full rewards and Sacred Rhythm empowers the next Holy spell',()=>{
 const a=fighter('A',['oath-restraint','current','current','radiant-spear'],['sacred-rhythm']);a.statuses.tidecaller=5;
 const r=simulate(a,idle());expect(r.frames[3].player.statuses.guard).toBe(4);expect(r.frames[4].bot.health).toBe(425);expect(r.frames[4].player.memory.nextHolyEmpowered).toBe(false);
});
it('Consecration grants Ward only after an Oath completed in the current cycle',()=>{
 const r=simulate(fighter('A',['oath-restraint','prayer','current','consecration']),idle());expect(r.frames[5].player.shield).toBe(50);
 const s=simulate(fighter('A',['consecration']),idle());expect(s.frames[2].player.shield).toBe(0);
});
it('Forgiveness consumes own Curse and heals per stack without Regeneration potency',()=>{
 const a=fighter('A',['forgiveness'],[],[3]);a.statuses.curse=4;a.health=200;a.memory.regenerationPower=2;
 const r=simulate(a,idle()).frames[2];expect(r.player.health).toBe(320);expect(r.player.statuses.curse).toBeUndefined();
});
it('Penance checks Regeneration and attunement; Redemption uses remaining ticks rounded down',()=>{
 const a=fighter('A',['penance'],[],[3]);a.statuses.regeneration=2;
 expect(simulate(a,idle()).frames[1].bot.health).toBe(400);a.attuned=[];expect(simulate(a,idle()).frames[1].bot.health).toBe(440);
 const b=fighter('A',['redemption']);b.statuses.regeneration=10;expect(simulate(b,idle()).frames[3].player.statuses.resilience).toBe(3);
});
it('Holy Light heals before lethal Poison and is Instant without attunement',()=>{
 const a=fighter('A',['holy-light']);a.health=5;a.statuses.poison=2;a.attuned=[];
 const r=simulate(a,idle()).frames[1];expect(r.player.health).toBe(75);expect(r.events.find(e=>e.side==='player')?.details).toContain('Instant');
});
it('Unholy converts direct and periodic healing, even at full health, and expires',()=>{
 const a=fighter('A',['turn-unholy','holy-light','current','current','current','current','holy-light']);a.health=100;
 const r=simulate(a,idle());expect(r.frames[3].bot.health).toBe(420);expect(r.frames[3].player.health).toBe(100);expect(r.frames[8].player.health).toBe(180);
 const h=fighter('A',['turn-unholy','holy-light']);h.statuses.regeneration=5;
 const s=simulate(h,idle());expect(s.frames[3].bot.health).toBe(410);expect(s.frames[3].player.health).toBe(500);
});
it('Unholy leaves the enemy healing unchanged and heal-to-full converts missing Health only',()=>{
 const a=fighter('A',['lay-on-hands']);a.statuses.unholy=5;a.health=200;const b=idle();b.health=400;b.statuses.regeneration=5;
 const r=simulate(a,b).frames[3];expect(r.player.health).toBe(200);expect(r.bot.health).toBe(130);
});
it('Holy and Imp timing is symmetric when duel sides are swapped',()=>{
 const a=fighter('A',['oath-judgement','aegis','lay-on-hands','holy-light','turn-unholy']);
 const b=fighter('B',['ritual','agony','empowered-imp','life-drain']);
 const forward=simulate(a,b),reverse=simulate(b,a);
 expect(forward.frames.length).toBe(reverse.frames.length);
 forward.frames.forEach((frame,index)=>{
  expect(frame.player.health).toBe(reverse.frames[index].bot.health);
  expect(frame.bot.health).toBe(reverse.frames[index].player.health);
  expect(frame.player.broken).toEqual(reverse.frames[index].bot.broken);
 });
});
