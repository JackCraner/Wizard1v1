import {expect,it} from 'vitest';
import {attunedDomains,attunementRanking,requiredDomains} from './attunement';
import {fighter,simulate} from './engine';
import {cardAt} from './upgrades';
import {createBotStates,prepareBot,scoreBotDeck} from './botAI';
import {LocalGameGateway} from '../services/localGateway';
import type {Session} from './model';

it('selects at most two domains by count, then oldest surviving card, independent of cast order',()=>{
 const deck=['scorch','wrath','current'];
 expect(attunedDomains([])).toEqual([]);
 expect(attunedDomains(['scorch'])).toEqual(['fire']);
 expect(attunedDomains(deck,[0,1,2])).toEqual(['fire','nature']);
 expect(attunedDomains(['current','wrath','scorch'],[2,1,0])).toEqual(['fire','nature']);
 expect(attunedDomains([...deck,'current'],[0,1,2,3])).toEqual(['water','fire']);
 expect(attunementRanking(['scorch','wrath','current','scorch'],[4,1,2,0])[0]).toEqual({domain:'fire',count:2,oldest:0});
});
it('purchase, reorder, merge and trash preserve surviving ownership age and combat attunement',async()=>{
 const g=new LocalGameGateway();let s=await g.start();
 Object.assign((g as unknown as {session:Session}).session,{shop:['spark','wrath','current','spark','spark']});
 for(const spell of ['spark','wrath','current','spark'])s=await g.execute(s.id,s.revision,{type:'buy',spell});
 expect(s.spellAcquired).toEqual([0,1,2,3]);
 s=await g.execute(s.id,s.revision,{type:'buy',spell:'spark',target:0});
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

it('unbracketed early effects work off-domain but bracketed upgrades require attunement',()=>{
 const deck=['ember','wrath','current'];
 const off=simulate(fighter('A',deck,[],[0,0,0],[2,0,1]),fighter('B',['current']));
 expect(off.frames[1].player.statuses.heat).toBe(1);
 const upgradedOff=simulate(fighter('A',deck,[],[3,0,0],[2,0,1]),fighter('B',['current']));
 expect(upgradedOff.frames[1].player.statuses.heat).toBe(1);
 const upgradedOn=simulate(fighter('A',deck,[],[3,0,0],[0,1,2]),fighter('B',['current']));
 expect(upgradedOn.frames[1].player.statuses.heat).toBe(2);
});
it('inspection matches explicit bracket requirements instead of inferring locks from keyword names',()=>{
 expect(requiredDomains(cardAt('pyroblast').combat!.effects!)).toEqual([]);
 expect(requiredDomains(cardAt('moonblight').combat!.effects!)).toEqual([]);
 expect(requiredDomains(cardAt('immolate').combat!.effects!)).toEqual(['fire']);
});
it('bot shopping retains unique acquisition ages',()=>{
 const state=createBotStates(['bot']).bot;let deck:string[]=[];
 for(let round=1;round<=8;round++){deck=prepareBot(state,deck,round,1,'normal');expect(new Set(state.spellAcquired).size).toBe(deck.length);expect(attunedDomains(deck,state.spellAcquired).length).toBeLessThanOrEqual(2);}
});
