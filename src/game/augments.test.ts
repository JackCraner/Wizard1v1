import {expect,it} from 'vitest';
import {AUGMENTS,augmentOffers,validateAugments} from './augments';
import {shopIncome,rerollCost,trashRefund} from './augments';
import {deriveStats} from './engine';
import {fighter,simulate} from './engine';
import {offersFor} from './shop';
import {LocalGameGateway} from '../services/localGateway';
import {createBotStates,prepareBot,grantBotAugment} from './botAI';
import type {Session} from './model';
const raw=(g:LocalGameGateway)=>(g as unknown as {session:Session}).session;
const duel=(deck:string[],augments:string[],enemy=['current'])=>simulate(fighter('A',deck,augments),fighter('B',enemy));
it('offers only the 27 domain-free augments without duplicates',()=>{
 expect(Object.keys(AUGMENTS)).toHaveLength(27);
 expect(Object.values(AUGMENTS).every(a=>!('domain' in a)&&!a.description.includes('attuned'))).toBe(true);
 let owned:string[]=[];
 for(let round=2;round<30;round+=2){const choices=augmentOffers(round,owned);expect(new Set(choices).size).toBe(choices.length);expect(choices.every(id=>!owned.includes(id))).toBe(true);expect(augmentOffers(round,owned)).toEqual(choices);owned.push(...choices);}
 expect(owned).toHaveLength(27);expect(augmentOffers(30,owned)).toEqual([]);
 expect(()=>validateAugments(['wild-garden'])).toThrow();
});
it('changes economy values and rounds Recycler refunds down',async()=>{
 expect(shopIncome(['deep-pockets'])).toBe(13);
 expect([0,1,2,3].map(n=>rerollCost(['scavenger'],n))).toEqual([0,0,1,1]);
 expect([1,2,3,4,5].map(n=>trashRefund(['recycler'],n))).toEqual([0,1,2,3,4]);
 const g=new LocalGameGateway();let s=await g.start('normal',42);
 Object.assign(raw(g),{augments:['recycler','scavenger','deep-pockets'],spells:['starsurge'],spellXp:[0]});
 s=await g.execute(s.id,s.revision,{type:'trash',index:0});expect(s.gold).toBe(12);
 for(let i=0;i<3;i++)s=await g.execute(s.id,s.revision,{type:'reroll'});
 expect(s.gold).toBe(11);
});
it('Specialist triples the most common domain weight',()=>{
 let base=0,specialist=0;
 for(let roll=0;roll<1000;roll++)for(const [augments,add] of [[[],false],[['specialist'],true]] as const){
  const count=offersFor(1,roll,['wrath'],[...augments]).shop.filter(id=>['thorn-lash','healing-seed','barkskin','moonblight','regrowth','wrath'].includes(id)).length;
  if(add)specialist+=count;else base+=count;
 }
 expect(specialist).toBeGreaterThan(base*1.5);
});
it('sequence augments multiply direct damage but Finisher does not empower healing or Ward',()=>{
 expect(duel(['spark'],['first-strike']).frames[1].bot.health).toBe(432);
 expect(duel(['spark'],['finisher']).frames[1].bot.health).toBe(432);
 expect(duel(['aegis'],['finisher']).frames[1].player.shield).toBe(50);
 const a=fighter('A',['healing-seed'],['finisher']);a.health=100;
 expect(simulate(a,fighter('B',['current'])).frames[1].player.health).toBe(120);
 expect(duel(['current','spark'],['alternation']).frames[2].bot.health).toBe(446);
 expect(duel(['current','spark'],['crescendo']).frames[2].bot.health).toBe(453);
});
it('Opening Ward starts with 100 and does not refresh each cycle',()=>{
 const r=duel(['current'],['opening-ward'],['spark']);
 expect(r.frames[0].player).toMatchObject({shield:100,wardCapacity:100});
 expect(r.frames[3].player.shield).toBe(10);
 expect(r.frames[5].player.shield).toBe(0);
});
it('Heavy Hitters uses printed cast time and Momentum grants Fury after three printed 1T casts',()=>{
 const a=fighter('A',['pyroblast'],['heavy-hitter']);a.statuses.heat=5;
 expect(simulate(a,fighter('B',['current'])).frames[1].bot.health).toBe(290);
 const r=duel(['current','current','current','spark'],['momentum']);
 expect(r.frames[3].player.statuses.fury).toBe(5);
 expect(r.frames[4].bot.health).toBe(450);
 const b=fighter('A',['holy-light','current','current'],['momentum']);
 expect(simulate(b,fighter('B',['current'])).frames[3].player.statuses.fury).toBeUndefined();
});
it('self damage grants Regeneration and Potency only when Health is lost',()=>{
 const r=duel(['flare'],['blood-magic','blood-infusion']);
 expect(r.frames[1].player.statuses).toMatchObject({regeneration:3,potency:1});
 const a=fighter('A',['flare'],['blood-magic','blood-infusion']);a.shield=100;
 expect(simulate(a,fighter('B',['current'])).frames[1].player.statuses).not.toHaveProperty('potency');
 const loop=duel(['current'],['reckless-loop','blood-magic','blood-infusion']);
 expect(loop.frames[1].player.health).toBe(475);
 expect(loop.frames[1].player.statuses).toMatchObject({regeneration:3,potency:1});
});
it('risk augments preserve their Health tradeoffs and Second Wind cannot revive',()=>{
 expect(duel(['spark'],['glass-cannon']).frames[1]).toMatchObject({player:{maxHealth:375},bot:{health:441}});
 const low=fighter('A',['pyroblast'],['last-stand']);low.health=140;
 expect(simulate(low,fighter('B',['current'])).frames[2].events.some(e=>e.spell==='pyroblast')).toBe(true);
 const wind=fighter('A',['current'],['second-wind']);wind.health=150;
 expect(simulate(wind,fighter('B',['spark'])).frames[1].player.health).toBe(225);
 wind.health=45;expect(simulate(wind,fighter('B',['spark'])).frames[1].player.health).toBe(0);
});
it('Wildfire works without any domain attunement and hits an enemy Imp first',()=>{
 const a=fighter('A',['agony'],['wildfire']);a.attuned=[];a.statuses.heat=1;
 const b=fighter('B',['current']);b.imp={health:50,maxHealth:50,guard:0};
 const r=simulate(a,b).frames[1];expect(r.bot.imp?.health).toBe(30);expect(r.bot.statuses.poison).toBe(5);
});
it('Super Poison stacks with spell potency and other damage modifiers',()=>{
 const a=fighter('A',['current'],['super-poison','glass-cannon']);a.memory.poisonPower=1.5;a.statuses.fury=2;
 const b=fighter('B',['current']);b.statuses.poison=1;
 expect(simulate(a,b).frames[1].bot.health).toBe(457);
});
it('Toxic Start applies Poison and Curse before the first spell',()=>{
 const r=duel(['current'],['toxic-start']);
 expect(r.frames[0].bot.statuses).toMatchObject({poison:5,curse:1});
 expect(r.frames[1].bot.health).toBe(490);
});
it('Cursed adds exactly one reshuffle tick, including against Reckless Loop',()=>{
 const a=fighter('A',['current'],['toxic-start','cursed']);
 const r=simulate(a,fighter('B',['current']));
 expect(r.frames[1].bot.reshuffleRemaining).toBe(2);expect(r.frames[2].bot.cycle).toBe(1);expect(r.frames[3].bot.cycle).toBe(2);
 const q=simulate(a,fighter('B',['current'],['reckless-loop']));
 expect(q.frames[1].bot.reshuffleRemaining).toBe(1);expect(q.frames[2].bot.cycle).toBe(2);expect(q.frames[2].bot.health).toBe(445);
});
it('Hot Stuff has a flat outgoing and incoming multiplier while Heat is active',()=>{
 const a=fighter('A',['spark'],['hot-stuff']);a.statuses.heat=2;
 const r=simulate(a,fighter('B',['spark'])).frames[1];expect(r.bot.health).toBe(450);expect(r.player.health).toBe(450);
});
it('Friendly Imp redirects direct healing with overflow but never HoTs or revives',()=>{
 const a=fighter('A',['healing-surge'],['friendly-imp']);a.health=400;a.imp={health:30,maxHealth:50,guard:0};
 const r=simulate(a,fighter('B',['current'])).frames[2];expect(r.player.imp?.health).toBe(50);expect(r.player.health).toBe(420);
 expect(r.healingEvents).toMatchObject([{target:'imp',amount:20},{amount:20}]);
 a.statuses.regeneration=1;expect(simulate(a,fighter('B',['current'])).frames[1].player).toMatchObject({health:410,imp:{health:30}});
 a.imp.health=0;a.statuses={};expect(simulate(a,fighter('B',['current'])).frames[2].player.health).toBe(440);
});
it('Bloom fires once on natural expiry, not when Poison is consumed',()=>{
 const a=fighter('A',['current'],['bloom']),b=fighter('B',['current']);b.statuses.poison=1;
 const r=simulate(a,b);expect(r.frames[1].bot.health).toBe(430);expect(r.frames[2].bot.health).toBe(430);
 const c=fighter('A',['nightmare'],['bloom']);b.statuses.poison=5;
 const q=simulate(c,b);expect(q.frames[2].bot.health).toBe(450);expect(q.frames[3].bot.health).toBe(450);
});
it('Criticality grants Heat on crossing 10 Potency, not every later gain',()=>{
 const a=fighter('A',['scorch'],['criticality']);a.statuses.potency=9;
 const r=simulate(a,fighter('B',['current']));expect(r.frames[2].player.statuses.heat).toBe(15);
 expect(r.frames[4].player.statuses.heat).toBe(10);
});
it('Monster scales with levels and Tough Skin improves Resilience',()=>{
 expect(deriveStats(['monster'],1).health).toBe(700);expect(deriveStats(['monster'],3).health).toBe(1100);
 expect(deriveStats(['monster','glass-cannon'],3).health).toBe(975);
 const a=fighter('A',['current'],['tough-skin']);a.statuses.resilience=5;
 expect(simulate(a,fighter('B',['dark-grab'])).frames[3].player.health).toBe(465);
});
it('grants every player a reward after round two, charges nothing, locks other actions, and persists into combat',async()=>{const g=new LocalGameGateway();let s=await g.start();s=await g.execute(s.id,s.revision,{type:'buy',spell:s.shop[0]!});for(let r=1;r<=2;r++){s=await g.execute(s.id,s.revision,{type:'fight'});s=await g.execute(s.id,s.revision,{type:'next'});if(r===1){expect(s.phase).toBe('shop');expect(s.augments).toEqual([]);}}expect(s.round).toBe(2);expect(s.phase).toBe('augment');expect(s.battle).toBeNull();expect(s.augmentOffers).toHaveLength(3);expect(s.lobby.players.slice(1).every(p=>p.augments.length===1)).toBe(true);const gold=s.gold,revision=s.revision;await expect(g.execute(s.id,revision,{type:'reroll'})).rejects.toThrow('locked');await expect(g.execute(s.id,revision,{type:'next'})).rejects.toThrow('Finish');await expect(g.execute(s.id,revision,{type:'chooseAugment',augment:'fake'})).rejects.toThrow('unavailable');const selected=s.augmentOffers[0];s=await g.execute(s.id,revision,{type:'chooseAugment',augment:selected});expect(s.phase).toBe('shop');expect(s.round).toBe(3);expect(s.gold).toBe(gold+10+(selected==='deep-pockets'?3:0));expect(s.augments).toEqual([selected]);expect(s.augmentOffers).toEqual([]);await expect(g.execute(s.id,revision,{type:'chooseAugment',augment:selected})).rejects.toThrow('out of date');s=await g.execute(s.id,s.revision,{type:'fight'});expect(s.battle!.frames[0].player.augments).toEqual([selected]);expect(s.battle!.frames[0].bot.augments).toHaveLength(1);expect(s.lobby.players.every(p=>p.lastCombatAugments.length===1)).toBe(true);});
it('bots receive exactly one reward on each scheduled round and retain it across shopping',()=>{const state=createBotStates(['bot']).bot;let deck=prepareBot(state,[],1,1,'normal');grantBotAugment(state,deck,1,1);expect(state.augments).toHaveLength(0);grantBotAugment(state,deck,2,1);const chosen=[...state.augments];grantBotAugment(state,deck,2,1);expect(state.augments).toEqual(chosen);deck=prepareBot(state,deck,3,1,'normal');expect(state.augments).toEqual(chosen);grantBotAugment(state,deck,4,1);expect(state.augments).toHaveLength(2);expect(new Set(state.augments).size).toBe(2);});
it.each(Object.keys(AUGMENTS))('%s is legal and isolated in replay snapshots',id=>{const result=duel(['moonblight','current','ember','aegis','wrath'],[id]);expect(result.frames[0].player.augments).toEqual([id]);expect(result.frames.every(f=>Number.isFinite(f.player.health)&&f.player.health>=0)).toBe(true);result.frames.at(-1)!.player.augments.push('fake');expect(result.frames[0].player.augments).toEqual([id]);});
