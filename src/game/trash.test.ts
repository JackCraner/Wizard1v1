import { expect,it } from 'vitest';
import { LocalGameGateway } from '../services/localGateway';
import { canAddSpell, PLAYABLE_SPELLS } from './engine';
import type { Session } from './model';

it('trashes exactly the selected copy for one gold, preserving the other cards and freeing domains',async()=>{
 const g=new LocalGameGateway();await g.start();
 const state=(g as unknown as {session:Session}).session;
 state.spells=['wrath','spark','wrath'];
 let s=await g.execute(state.id,state.revision,{type:'trash',index:1});
 expect(s.spells).toEqual(['wrath','wrath']);expect(s.gold).toBe(11);expect(s.revision).toBe(1);
 expect(canAddSpell(s.spells,'current')).toBe(true);
 s=await g.execute(s.id,s.revision,{type:'trash',index:0});expect(s.spells).toEqual(['wrath']);
 s=await g.execute(s.id,s.revision,{type:'trash',index:0});expect(s.spells).toEqual([]);
 await expect(g.execute(s.id,s.revision,{type:'fight'})).rejects.toThrow('Equip a spell');
});
it('rejects stale, invalid and combat-phase trash requests',async()=>{
 const g=new LocalGameGateway();let s=await g.start();s=await g.execute(s.id,s.revision,{type:'buy',spell:s.shop[0]!});
 for(const index of [-1,1,.5])await expect(g.execute(s.id,s.revision,{type:'trash',index})).rejects.toThrow('Invalid');
 await expect(g.execute(s.id,s.revision-1,{type:'trash',index:0})).rejects.toThrow('out of date');
 s=await g.execute(s.id,s.revision,{type:'fight'});
 await expect(g.execute(s.id,s.revision,{type:'trash',index:0})).rejects.toThrow('locked');
});

it('sells every rarity and upgrade for exactly one gold without Recycler',async()=>{
 const g=new LocalGameGateway();await g.start();
 for(const spell of PLAYABLE_SPELLS)for(const xp of [0,3]){
  const state=(g as unknown as {session:Session}).session;
  Object.assign(state,{spells:[spell],spellXp:[xp],spellAcquired:[0],gold:0});
  const s=await g.execute(state.id,state.revision,{type:'trash',index:0});
  expect(s.gold).toBe(1);expect(s.spells).toEqual([]);expect(s.spellXp).toEqual([]);
 }
});
