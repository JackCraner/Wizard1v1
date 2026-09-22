import {expect,it} from 'vitest';
import {LocalGameGateway} from '../services/localGateway';
import {deriveStats} from './engine';
import type {Session} from './model';
const raw=(g:LocalGameGateway)=>(g as unknown as {session:Session}).session;

it('levels every player after two rounds, grants one augment and carries increased Health into combat',async()=>{
 const g=new LocalGameGateway();let s=await g.start();
 expect(s.level).toBe(1);expect(s.trophies).toBe(0);
 s=await g.execute(s.id,s.revision,{type:'buy',spell:s.shop[0]!});
 for(let round=1;round<=4;round++){
  const level=1+Math.floor((round-1)/2);
  s=await g.execute(s.id,s.revision,{type:'fight'});
  expect(s.level).toBe(level);
  for(const unit of [s.battle!.frames[0].player,s.battle!.frames[0].bot]){
   expect(unit.level).toBe(level);
   expect(unit.maxHealth).toBe(deriveStats(unit.augments,level).health);
   expect(unit.health).toBe(unit.maxHealth);
  }
  expect(s.trophies).toBe(s.lobby.players[0].trophies);
  expect(s.lobby.players.every(p=>p.level===level)).toBe(true);
  const before=s.trophies;
  s=await g.execute(s.id,s.revision,{type:'next'});
  if(round%2===0){
   expect(s.level).toBe(level+1);
   expect(s.lobby.players.every(p=>p.level===level+1)).toBe(true);
   expect(s.lobby.players.slice(1).every(p=>p.augments.length===round/2)).toBe(true);
   expect(s.augmentOffers).toHaveLength(3);
   const revision=s.revision;
   await expect(g.execute(s.id,revision,{type:'next'})).rejects.toThrow('Finish');
   s=await g.execute(s.id,revision,{type:'chooseAugment',augment:s.augmentOffers[0]});
   expect(s.level).toBe(level+1);expect(s.augments).toHaveLength(round/2);
  }else expect(s.level).toBe(level);
  expect(s.trophies).toBe(before);
 }
 expect(s.round).toBe(5);expect(s.level).toBe(3);
 expect(deriveStats([],s.level).health).toBe(700);
});
it('a level-three win grants three trophies and ends the game even when it overshoots 20',async()=>{
 const g=new LocalGameGateway();const initial=await g.start(),state=raw(g);
 state.level=3;state.round=5;state.spells=Array(10).fill('spark');
 for(const p of state.lobby.players){p.level=3;p.deck=['current'];}
 state.lobby.players[0].trophies=19;
 for(const b of Object.values((g as unknown as {bots:Record<string,{lastPreparedRound:number}>}).bots))b.lastPreparedRound=5;
 const s=await g.execute(initial.id,initial.revision,{type:'fight'});
 expect(s.battle!.outcome).toBe('victory');expect(s.trophies).toBe(22);expect(s.wins).toBe(1);
 expect(s.lobby.finished).toBe(true);expect(s.lobby.winnerIds).toEqual(['player']);
 expect(s.lobby.players.slice(1).every(p=>p.trophies===0)).toBe(true);
});
it('a level-two bot win grants two trophies while draws grant none',async()=>{
 const g=new LocalGameGateway();const initial=await g.start(),state=raw(g);
 state.level=2;state.round=3;state.spells=['current'];
 for(const p of state.lobby.players){p.level=2;p.deck=Array(10).fill('spark');}
 for(const b of Object.values((g as unknown as {bots:Record<string,{lastPreparedRound:number}>}).bots))b.lastPreparedRound=3;
 const s=await g.execute(initial.id,initial.revision,{type:'fight'});
 expect(s.trophies).toBe(0);expect(s.losses).toBe(1);
 expect(s.lobby.players.filter(p=>p.trophies===2)).toHaveLength(1);
 expect(s.lobby.players.filter(p=>p.draws===1).every(p=>p.trophies===0)).toBe(true);
});
it('Glass Cannon retains its penalty but receives the full 100 Health per level',()=>{
 expect(deriveStats([],1).health).toBe(500);
 expect(deriveStats(['glass-cannon'],1).health).toBe(375);
 expect(deriveStats(['glass-cannon'],2).health).toBe(475);
 expect(deriveStats(['glass-cannon'],3).health).toBe(575);
});
