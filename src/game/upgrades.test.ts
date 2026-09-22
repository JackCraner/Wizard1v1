import { expect,it } from 'vitest';
import { CARDS } from '../config/catalogue';
import { cardAt,mergeCards,UPGRADE_XP } from './upgrades';
import { fighter,simulate,PLAYABLE_SPELLS } from './engine';
import { LocalGameGateway } from '../services/localGateway';
import type { Session } from './model';
import { createBotStates,prepareBot,botFighter } from './botAI';

it('defines a literal upgraded version for every catalogue card and preserves availability',()=>{
 for(const c of CARDS){
  expect(c.upgrade,c.id).toBeDefined();const u=cardAt(c.id,3);
  expect(u.upgraded).toBe(true);expect(u.id).toBe(c.id);expect(u.stars).toBe(c.stars);
  expect(u.combat?.blockedReason).toBe(c.combat?.blockedReason);
  if(c.id==='corrupt-ward') expect(u.combat).toEqual(c.combat); // No upgraded effect supplied yet.
  else expect(JSON.stringify([u.castTicks,u.rules,u.combat]),c.id).not.toBe(JSON.stringify([c.castTicks,c.rules,c.combat]));
 }
});
it('merges only the selected copy, consumes exactly one card and caps XP at three',()=>{
 const deck=['wrath','wrath','wrath','wrath','wrath'],xp=[0,0,0,0,0];
 mergeCards(deck,xp,1,0);expect(xp).toEqual([1,0,0,0]);
 mergeCards(deck,xp,1,0);mergeCards(deck,xp,1,0);
 expect(deck).toEqual(['wrath','wrath']);expect(xp).toEqual([3,0]);
 expect(()=>mergeCards(deck,xp,1,0)).toThrow();expect(()=>mergeCards(deck,xp,0,1)).toThrow();
 expect(()=>mergeCards(deck,xp,1,1)).toThrow();expect(()=>mergeCards(deck,xp,-1,1)).toThrow();
 expect(()=>mergeCards(['wrath','spark'],[0,0],0,1)).toThrow();
});
it('consuming a partially trained copy still grants exactly one XP',()=>{
 const deck=['wrath','wrath'],xp=[2,0];mergeCards(deck,xp,0,1);expect(xp).toEqual([1]);
});
it('applies upgrades per card, with real upgraded damage, costs and cast times',()=>{
 const a=fighter('A',['wrath','wrath'],[],[3,0]);
 const battle=simulate(a,fighter('B',['current']));
 expect(battle.frames[1].bot.health).toBe(430);expect(battle.frames[2].bot.health).toBe(410);
 expect(battle.frames[1].events[0].xp).toBe(3);expect(a.spellXp).toEqual([3,0]);
 const pyro=simulate(fighter('A',['pyroblast'],[],[3]),fighter('B',['current']));
 expect(pyro.frames[3].bot.health).toBe(200);
 expect(()=>fighter('bad',['wrath'],[],[4])).toThrow();
});
it('upgrades status duration while retaining the shared per-tick power',()=>{
 const battle=simulate(fighter('A',['moonblight'],[],[3]),fighter('B',['current']));
 expect(battle.frames[1].bot.statuses.poison).toBe(8);
 expect(battle.frames[2].bot.statuses.poison).toBe(7);expect(battle.frames[2].bot.health).toBe(490);
});
it('runs every playable upgrade deterministically with legal resources',()=>{
 for(const id of PLAYABLE_SPELLS){
  const a=fighter('A',[id],[],[UPGRADE_XP]),b=fighter('B',['current']);
  const result=simulate(a,b);expect(simulate(a,b)).toEqual(result);
  expect(result.frames.every(f=>[f.player,f.bot].every(p=>p.health>=0&&p.health<=p.maxHealth)),id).toBe(true);
 }
});
it('buys XP into a full hand, validates transactions, and preserves XP through reorder, trash and combat',async()=>{
 const g=new LocalGameGateway();await g.start();
 const internal=(g as unknown as {session:Session}).session;
 internal.spells=Array(10).fill('wrath');internal.spellXp=[2,0,0,0,0,0,0,0,0,0];internal.shop=['wrath'];
 let s=await g.execute(internal.id,0,{type:'buy',spell:'wrath',target:0});
 expect(s.gold).toBe(9);expect(s.spells).toHaveLength(10);expect(s.spellXp?.[0]).toBe(3);
 await expect(g.execute(s.id,s.revision,{type:'buy',spell:'wrath',target:0})).rejects.toThrow();
 await expect(g.execute(s.id,s.revision-1,{type:'merge',from:2,to:1})).rejects.toThrow('out of date');
 s=await g.execute(s.id,s.revision,{type:'move',from:0,to:4});expect(s.spellXp?.[4]).toBe(3);
 s=await g.execute(s.id,s.revision,{type:'trash',index:1});expect(s.spellXp?.[3]).toBe(3);
 s=await g.execute(s.id,s.revision,{type:'merge',from:0,to:1});expect(s.spellXp?.[0]).toBe(1);expect(s.gold).toBe(9);
 const xp=[...s.spellXp!];s=await g.execute(s.id,s.revision,{type:'fight'});
 expect(s.battle?.frames[0].player.spellXp).toEqual(xp);
 expect(s.lobby.players[0].lastCombatXp).toEqual(xp);
 await expect(g.execute(s.id,s.revision,{type:'merge',from:1,to:0})).rejects.toThrow('locked');
 s=await g.execute(s.id,s.revision,{type:'next'});expect(s.spellXp).toEqual(xp);
});
it('bots earn upgrades and retain XP in combat snapshots as decks evolve',()=>{
 const state=createBotStates(['bot']).bot;let deck:string[]=[];
 let earnedUpgrade=false;
 for(let round=1;round<=24;round++){deck=prepareBot(state,deck,round,1,'hard');earnedUpgrade ||= state.spellXp?.some(x=>x===3)??false;expect(botFighter('Bot',deck,state).spellXp).toEqual(state.spellXp);const before=[...state.spellXp!];expect(prepareBot(state,deck,round,1,'hard')).toEqual(deck);expect(state.spellXp).toEqual(before);}
 expect(state.spellXp).toHaveLength(deck.length);
 expect(earnedUpgrade).toBe(true);
 expect(botFighter('Bot',deck,state).spellXp).toEqual(state.spellXp);
 expect(state.gold).toBeGreaterThanOrEqual(0);
});
