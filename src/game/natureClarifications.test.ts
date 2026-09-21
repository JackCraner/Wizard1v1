import {expect,it} from 'vitest';
import {fighter,simulate,canAddSpell,PLAYABLE_SPELLS} from './engine';
import {LocalGameGateway} from '../services/localGateway';
import {offersFor} from './shop';
import {createBotStates,prepareBot} from './botAI';
import type {Session} from './model';

it('enables all three Nature spells and their upgrades',()=>{
 for(const id of ['lifebloom','germination','flourish']){
  expect(PLAYABLE_SPELLS).toContain(id);
  expect(()=>simulate(fighter('A',[id],[],[3]),fighter('B',['splash']))).not.toThrow();
 }
});
it('Lifebloom heals per remaining stack before aging while Growth stays flat',()=>{
 const a=fighter('A',['splash']);a.health=100;a.statuses={lifebloom:5,growth:2};
 const frames=simulate(a,fighter('B',['splash'])).frames;
 expect(frames.slice(1,6).map(f=>f.player.health)).toEqual([160,210,240,260,270]);
 expect(frames.slice(1,6).map(f=>f.player.statuses.lifebloom??0)).toEqual([4,3,2,1,0]);
});
it('Lifebloom adds stacks and does not heal until the next HoT phase',()=>{
 const a=fighter('A',['lifebloom','lifebloom']);a.health=100;
 const frames=simulate(a,fighter('B',['splash'])).frames;
 expect(frames[2].player.health).toBe(100);expect(frames[2].player.statuses.lifebloom).toBe(4);
 expect(frames[3].player.health).toBe(140);expect(frames[4].player.health).toBe(170);
 expect(frames[4].player.statuses.lifebloom).toBe(6);expect(frames[5].player.health).toBe(230);
});
it('Germination counts remaining enemy DoT stacks only, after normal countdown',()=>{
 const a=fighter('A',['germination']);a.mana=50;a.statuses.moonfire=20;
 const b=fighter('B',['splash']);b.statuses={moonfire:5,sunfire:3,growth:6,rain:6};
 const f=simulate(a,b).frames[1];
 expect(f.player.mana).toBe(51); // 50 - 5 + (4 Moonfire + 2 Sunfire)
 expect(f.manaEvents).toContainEqual({side:'player',amount:6,kind:'effect'});
 a.statuses['next-instant']=1;
 expect(simulate(a,b).frames[1].player.mana).toBe(53); // Instant counts 5 + 3 before countdown.
 a.statuses={};b.statuses={};
 expect(simulate(a,b).frames[1].player.mana).toBe(45);
});
it('Flourish doubles only the caster HoTs after countdown, without another heal',()=>{
 const a=fighter('A',['flourish']);a.health=100;a.statuses={lifebloom:5,growth:5,fury:5,moonfire:5};
 a.casting={spell:'flourish',index:0,remaining:1,totalTicks:2,mana:5,tidecaller:false};
 const b=fighter('B',['splash']);b.statuses.growth=5;
 const frames=simulate(a,b).frames;
 expect(frames[1].player.health).toBe(150); // DoT 10, Lifebloom 50, Growth 10.
 expect(frames[1].player.statuses).toEqual({lifebloom:8,growth:8,fury:4,moonfire:4});
 expect(frames[1].bot.statuses.growth).toBe(4);
 expect(frames[2].player.health).toBe(230);
});
it('Unique rejects duplicate combat entries, including mixed upgrade tiers',()=>{
 expect(canAddSpell(['flourish'],'flourish')).toBe(false);
 expect(canAddSpell(['flourish'],'lifebloom')).toBe(true);
 expect(()=>fighter('A',['flourish','flourish'],[],[0,3])).toThrow('Unique');
 const a=fighter('A',['flourish']);a.spells.push('flourish');a.spellXp=[0,3];
 expect(()=>simulate(a,fighter('B',['splash']))).toThrow('Unique');
});
it('Unique rejects buying another deck copy but permits buying upgrade XP',async()=>{
 const g=new LocalGameGateway();await g.start();const internal=(g as unknown as {session:Session}).session;
 internal.spells=['flourish'];internal.spellXp=[0];internal.shop=['flourish'];
 await expect(g.execute(internal.id,0,{type:'buy',spell:'flourish'})).rejects.toThrow('Unique');
 expect(internal.gold).toBe(10);expect(internal.revision).toBe(0);
 const s=await g.execute(internal.id,0,{type:'buy',spell:'flourish',target:0});
 expect(s.spells).toEqual(['flourish']);expect(s.spellXp).toEqual([1]);expect(s.gold).toBe(7);
 expect(Array.from({length:100},(_,n)=>offersFor(6,n,['flourish']).shop).flat()).toContain('flourish');
});
it('bots never put multiple Unique copies into their deck',()=>{
 const states=createBotStates(['bot']);const state=states.bot;let deck=['flourish','moonfire','regrowth'];
 for(let round=1;round<=8;round++){
  deck=prepareBot(state,deck,round,1,'hard');
  expect(deck.filter(id=>id==='flourish').length).toBeLessThanOrEqual(1);
 }
});
