import {expect,it} from 'vitest';
import {attunedDomains,attunementRanking,requiredDomains} from './attunement';
import {fighter,simulate} from './engine';
import {cardAt} from './upgrades';
import {createBotStates,prepareBot,scoreBotDeck} from './botAI';
import {LocalGameGateway} from '../services/localGateway';
import type {Session} from './model';

it('selects at most two domains by count, then oldest surviving card, independent of cast order',()=>{
 const deck=['scorch','wrath','splash'];
 expect(attunedDomains([])).toEqual([]);
 expect(attunedDomains(['scorch'])).toEqual(['fire']);
 expect(attunedDomains(deck,[0,1,2])).toEqual(['fire','nature']);
 expect(attunedDomains(['splash','wrath','scorch'],[2,1,0])).toEqual(['fire','nature']);
 expect(attunedDomains([...deck,'splash'],[0,1,2,3])).toEqual(['water','fire']);
 expect(attunementRanking(['scorch','wrath','splash','scorch'],[4,1,2,0])[0]).toEqual({domain:'fire',count:2,oldest:0});
});
it('keeps useful basic damage while gating Heat and Tide behind the two attunements',()=>{
 const deck=['scorch','wrath','splash'];
 const inactive=simulate(fighter('A',deck,[],[],[2,0,1]),fighter('B',['riptide']));
 expect(inactive.frames[1].bot.health).toBe(470);
 expect(inactive.frames[1].player.statuses.heat).toBeUndefined();
 expect(inactive.frames[3].player.statuses.tide).toBe(1);
 const active=simulate(fighter('A',deck,[],[],[0,1,2]),fighter('B',['riptide']));
 expect(active.frames[1].player.statuses.heat).toBe(2);
 expect(active.frames[3].player.statuses.tide).toBeUndefined();
});
it('reserves most high-rank damage for attunement in base and upgraded spells',()=>{
 for(const xp of [0,3]) {
  const deck=['pyroblast','wrath','splash'];
  const off=simulate(fighter('A',deck,[],[xp,0,0],[2,0,1]),fighter('B',['riptide']));
  const on=simulate(fighter('A',deck,[],[xp,0,0],[0,1,2]),fighter('B',['riptide']));
  expect(off.frames[3].bot.health).toBe(500-(xp?101:72));
  expect(on.frames[3].bot.health).toBe(500-(xp?252:180));
 }
});
it('incoming enemy Poison still affects a fighter without Nature attunement',()=>{
 const battle=simulate(fighter('A',['moonfire']),fighter('B',['riptide']));
 expect(battle.frames[0].bot.attuned).toEqual(['water']);
 expect(battle.frames[2].bot.health).toBe(465);
 expect(battle.frames[2].bot.statuses.poison).toBe(3);
});
it('gates augment keyword production including nested Tide spends',()=>{
 const off=simulate(fighter('A',['scorch'],['reservoir','verdant-cycle']),fighter('B',['riptide']));
 expect(off.frames[0].player.statuses).toEqual({});
 const a=fighter('A',['riptide'],['reservoir','blighted-tide']);
 const b=fighter('B',['scorch']);b.statuses.poison=4;
 const battle=simulate(a,b);
 expect(battle.frames[1].bot.statuses.poison).toBe(3);
 const hex=simulate(fighter('A',['hex'],['venomous-hex']),fighter('B',['riptide']));
 expect(hex.frames[1].bot.statuses.poison).toBeUndefined();
 expect(hex.frames[1].bot.statuses.slow).toBe(1);
});
it('purchase, reorder, merge and trash preserve surviving ownership age and combat attunement',async()=>{
 const g=new LocalGameGateway();let s=await g.start();
 Object.assign((g as unknown as {session:Session}).session,{shop:['scorch','wrath','splash','scorch','scorch']});
 for(const spell of ['scorch','wrath','splash','scorch'])s=await g.execute(s.id,s.revision,{type:'buy',spell});
 expect(s.spellAcquired).toEqual([0,1,2,3]);
 s=await g.execute(s.id,s.revision,{type:'buy',spell:'scorch',target:0});
 expect(s.spellAcquired).toEqual([0,1,2,3]);
 s=await g.execute(s.id,s.revision,{type:'move',from:0,to:3});
 expect(s.spellAcquired).toEqual([1,2,3,0]);
 expect(attunedDomains(s.spells,s.spellAcquired)).toEqual(['fire','nature']);
 // Merging the oldest donor into the younger recipient removes the donor's age.
 s=await g.execute(s.id,s.revision,{type:'merge',from:3,to:2});
 expect(s.spellAcquired).toEqual([1,2,3]);
 expect(attunedDomains(s.spells,s.spellAcquired)).toEqual(['nature','water']);
 s=await g.execute(s.id,s.revision,{type:'trash',index:0});
 expect(attunedDomains(s.spells,s.spellAcquired)).toEqual(['water','fire']);
 s=await g.execute(s.id,s.revision,{type:'fight'});
 expect(s.battle!.frames[0].player.attuned).toEqual(['water','fire']);
 expect(s.lobby.players.find(p=>p.human)!.lastCombatAttuned).toEqual(['water','fire']);
});
it('bots value attuned late-game effects and retain unique ages across shopping and cast-order sorting',()=>{
 const deck=['pyroblast','wrath','splash'];
 expect(scoreBotDeck(deck,0,[],[0,1,2])).toBeGreaterThan(scoreBotDeck(deck,0,[],[2,0,1]));
 const state=createBotStates(['bot']).bot;let spells:string[]=[];
 for(let round=1;round<=8;round++){
  spells=prepareBot(state,spells,round,1,'normal');
  expect(state.spellAcquired).toHaveLength(spells.length);
  expect(new Set(state.spellAcquired).size).toBe(spells.length);
  expect(state.spellAcquired.every(n=>n<state.nextAcquisition)).toBe(true);
  expect(attunedDomains(spells,state.spellAcquired).length).toBeLessThanOrEqual(2);
 }
});
it('inspection derives all required domains for Fire and hybrid Poison spells',()=>{
 expect(requiredDomains(cardAt('pyroblast').combat!.effects!)).toEqual(['fire']);
 expect(requiredDomains(cardAt('moonfire').combat!.effects!)).toEqual(['nature']);
});
