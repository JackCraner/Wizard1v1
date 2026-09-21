import {expect,it} from 'vitest';
import {LocalGameGateway} from '../services/localGateway';
import {roundPairings} from './tournament';
import type {Session} from './model';
const internal=(g:LocalGameGateway)=>(g as unknown as {session:Session}).session;

it('starts exactly eight players with zero trophies and no invented combat history',async()=>{
 const s=await new LocalGameGateway().start();
 expect(s.lobby.players).toHaveLength(8);expect(s.lobby.winsToWin).toBe(8);
 expect(s.spells).toEqual([]);expect(s.lobby.players.filter(p=>p.human)).toHaveLength(1);
 for(const p of s.lobby.players){expect(p.wins).toBe(0);expect(p.lastCombatDeck).toEqual([]);expect(p.lastCombatRound).toBeNull();}
});
it('pairs everyone exactly once per round and meets all seven opponents',()=>{
 const ids=Array.from({length:8},(_,i)=>String(i)),meetings=new Set<string>();
 for(let round=1;round<=7;round++){
  const pairs=roundPairings(ids,round);expect(pairs.flat().sort()).toEqual(ids);
  for(const pair of pairs){expect(pair[0]).not.toBe(pair[1]);meetings.add([...pair].sort().join('-'));}
 }
 expect(meetings.size).toBe(28);
});
it('resolves every duel and snapshots decks independently from later shopping',async()=>{
 const g=new LocalGameGateway();let s=await g.start();
 s=await g.execute(s.id,s.revision,{type:'buy',spell:s.shop[0]!});
 s=await g.execute(s.id,s.revision,{type:'fight'});
 for(const p of s.lobby.players){expect(p.wins+p.losses+p.draws).toBe(1);expect(p.lastCombatRound).toBe(1);expect(p.lastCombatDeck.length).toBeGreaterThan(0);}
 const snapshot=[...s.lobby.players[0].lastCombatDeck];
 s=await g.execute(s.id,s.revision,{type:'next'});s=await g.execute(s.id,s.revision,{type:'trash',index:0});
 expect(s.spells).toEqual([]);expect(s.lobby.players[0].lastCombatDeck).toEqual(snapshot);
 s.lobby.players[0].lastCombatDeck.push('wrath');expect(internal(g).lobby.players[0].lastCombatDeck).toEqual(snapshot);
});
it('awards the human their eighth trophy, locks the game and can start fresh',async()=>{
 const g=new LocalGameGateway();const initial=await g.start(),state=internal(g);
 state.spells=Array(10).fill('ember');state.lobby.players[0].wins=7;
 for(const bot of state.lobby.players.slice(1))bot.deck=Array(10).fill('splash');
 const s=await g.execute(initial.id,initial.revision,{type:'fight'});
 expect(s.battle?.outcome).toBe('victory');expect(s.wins).toBe(8);
 expect(s.lobby.finished).toBe(true);expect(s.lobby.winnerIds).toEqual(['player']);
 await expect(g.execute(s.id,s.revision,{type:'next'})).rejects.toThrow('complete');
 const fresh=await g.start();expect(fresh.wins).toBe(0);expect(fresh.lobby.finished).toBe(false);expect(fresh.id).not.toBe(s.id);
});
it('can lose the tournament to a bot and awards no wins for bot draws',async()=>{
 const g=new LocalGameGateway();const initial=await g.start(),state=internal(g);
 state.spells=['splash'];
 for(const bot of state.lobby.players.slice(1)){bot.deck=Array(10).fill('ember');bot.wins=7;}
 const s=await g.execute(initial.id,initial.revision,{type:'fight'});
 expect(s.lobby.finished).toBe(true);expect(s.lobby.winnerIds).toEqual(['bot-7']);expect(s.losses).toBe(1);
 expect(s.lobby.players.filter(p=>p.draws===1)).toHaveLength(6);
});
it('awards shared victory when separate duels reach eight wins in the same round',async()=>{
 const g=new LocalGameGateway();const initial=await g.start(),state=internal(g);
 state.spells=Array(10).fill('ember');state.lobby.players[0].wins=7;
 for(const bot of state.lobby.players.slice(1))bot.deck=Array(10).fill('splash');
 state.lobby.players[1].deck=Array(10).fill('ember');state.lobby.players[1].wins=7;
 const s=await g.execute(initial.id,initial.revision,{type:'fight'});
 expect(s.lobby.winnerIds).toEqual(['player','bot-1']);
});
