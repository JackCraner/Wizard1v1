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
 expect([0,1,2,3].map(n=>rerollCost(['scavenger'],n))).toEqual([0,0,2,2]);
 expect([1,2,3,4,5].map(n=>trashRefund(['recycler'],n))).toEqual([0,1,2,3,4]);
 const g=new LocalGameGateway();let s=await g.start('normal',42);
 Object.assign(raw(g),{augments:['recycler','scavenger','deep-pockets'],spells:['starsurge'],spellXp:[0]});
 s=await g.execute(s.id,s.revision,{type:'trash',index:0});expect(s.gold).toBe(13);
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
it('grants every player a reward after round two, charges nothing, locks other actions, and persists into combat',async()=>{const g=new LocalGameGateway();let s=await g.start();s=await g.execute(s.id,s.revision,{type:'buy',spell:s.shop[0]!});for(let r=1;r<=2;r++){s=await g.execute(s.id,s.revision,{type:'fight'});s=await g.execute(s.id,s.revision,{type:'next'});if(r===1){expect(s.phase).toBe('shop');expect(s.augments).toEqual([]);}}expect(s.round).toBe(2);expect(s.phase).toBe('augment');expect(s.battle).toBeNull();expect(s.augmentOffers).toHaveLength(3);expect(s.lobby.players.slice(1).every(p=>p.augments.length===1)).toBe(true);const revision=s.revision;await expect(g.execute(s.id,revision,{type:'reroll'})).rejects.toThrow('locked');await expect(g.execute(s.id,revision,{type:'next'})).rejects.toThrow('Finish');await expect(g.execute(s.id,revision,{type:'chooseAugment',augment:'fake'})).rejects.toThrow('unavailable');const selected=s.augmentOffers[0];s=await g.execute(s.id,revision,{type:'chooseAugment',augment:selected});expect(s.phase).toBe('shop');expect(s.round).toBe(3);expect(s.gold).toBe(10+(selected==='deep-pockets'?3:0));expect(s.augments).toEqual([selected]);expect(s.augmentOffers).toEqual([]);await expect(g.execute(s.id,revision,{type:'chooseAugment',augment:selected})).rejects.toThrow('out of date');s=await g.execute(s.id,s.revision,{type:'fight'});expect(s.battle!.frames[0].player.augments).toEqual([selected]);expect(s.battle!.frames[0].bot.augments).toHaveLength(1);expect(s.lobby.players.every(p=>p.lastCombatAugments.length===1)).toBe(true);});
it('bots receive exactly one reward on each scheduled round and retain it across shopping',()=>{const state=createBotStates(['bot']).bot;let deck=prepareBot(state,[],1,1,'normal');grantBotAugment(state,deck,1,1);expect(state.augments).toHaveLength(0);grantBotAugment(state,deck,2,1);const chosen=[...state.augments];grantBotAugment(state,deck,2,1);expect(state.augments).toEqual(chosen);deck=prepareBot(state,deck,3,1,'normal');expect(state.augments).toEqual(chosen);grantBotAugment(state,deck,4,1);expect(state.augments).toHaveLength(2);expect(new Set(state.augments).size).toBe(2);});
it.each(Object.keys(AUGMENTS))('%s is legal and isolated in replay snapshots',id=>{const result=duel(['moonblight','current','ember','aegis','wrath'],[id]);expect(result.frames[0].player.augments).toEqual([id]);expect(result.frames.every(f=>Number.isFinite(f.player.health)&&f.player.health>=0)).toBe(true);result.frames.at(-1)!.player.augments.push('fake');expect(result.frames[0].player.augments).toEqual([id]);});
it('redesigned augments use Heat, Empowered and Guard rather than removed statuses',()=>{
 const a=fighter('A',['flare'],['blood-infusion','blood-magic']);const r=simulate(a,fighter('B',['healing-seed'])).frames[1];expect(r.player.statuses.heat).toBe(2);expect(r.player.statuses.regeneration).toBe(3);
 const m=simulate(fighter('A',['healing-seed','healing-seed','healing-seed','spark'],['momentum']),fighter('B',['healing-seed']));expect(m.frames[4].events.find(e=>e.side==='player')?.details).toContain('Empowered');
 const c=fighter('A',['wrath'],['criticality']),b=fighter('B',['healing-seed']);b.statuses.poison=5;expect(simulate(c,b).frames[1].player.statuses.heat).toBe(2);
 const g=fighter('A',['healing-seed'],['tough-skin']);g.statuses.guard=1;expect(simulate(g,fighter('B',['spark'])).frames[1].player.shield).toBe(40);
});
it('Super Poison stacks with permanent Poison modifiers, and Glass Cannon still affects DoT',()=>{const a=fighter('A',['healing-seed'],['super-poison','glass-cannon']);a.memory.rules={poisonPower:2};const b=fighter('B',['regrowth']);b.statuses.poison=2;expect(simulate(a,b).frames[1].bot.health).toBe(448);});
it('Cursed adds one pause and Reckless Loop removes only the normal pause',()=>{const a=fighter('A',['healing-seed'],['toxic-start','cursed']);expect(simulate(a,fighter('B',['healing-seed'])).frames[1].bot.reshuffleRemaining).toBe(2);expect(simulate(a,fighter('B',['healing-seed'],['reckless-loop'])).frames[1].bot.reshuffleRemaining).toBe(1);});
it('Monster and Glass Cannon adjust starting health',()=>{expect(deriveStats(['monster'],3).health).toBe(1100);expect(deriveStats(['monster','glass-cannon'],3).health).toBe(975);});
it('Friendly Imp heals the living Imp first with overflow and does not revive it',()=>{const a=fighter('A',['healing-seed'],['friendly-imp']);a.health=100;a.imp={health:20,maxHealth:30,guard:0};const r=simulate(a,fighter('B',['healing-seed'])).frames[1];expect(r.player.imp?.health).toBe(30);expect(r.player.health).toBe(115);});
