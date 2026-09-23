import {expect,it} from 'vitest';
import {LocalGameGateway} from '../services/localGateway';
import type {Session} from './model';
import {AUGMENTS} from './augments';
async function reward(seed=123){
 const g=new LocalGameGateway();let s=await g.start('normal',seed);
 s=await g.execute(s.id,s.revision,{type:'buy',spell:s.shop[0]!});
 for(let i=0;i<2;i++){s=await g.execute(s.id,s.revision,{type:'fight'});s=await g.execute(s.id,s.revision,{type:'next'});}
 return {g,s};
}
it('rerolls each slot once for free, with distinct unowned seeded choices',async()=>{
 const a=await reward(),b=await reward();
 for(let slot=0;slot<3;slot++){
  const before=[...a.s.augmentOffers],gold=a.s.gold;
  a.s=await a.g.execute(a.s.id,a.s.revision,{type:'rerollAugment',slot});
  b.s=await b.g.execute(b.s.id,b.s.revision,{type:'rerollAugment',slot});
  expect(a.s.augmentOffers).toEqual(b.s.augmentOffers);
  expect(before).not.toContain(a.s.augmentOffers[slot]);
  expect(a.s.augments).not.toContain(a.s.augmentOffers[slot]);
  expect(a.s.gold).toBe(gold);
  before.forEach((id,i)=>{if(i!==slot)expect(a.s.augmentOffers[i]).toBe(id);});
  await expect(a.g.execute(a.s.id,a.s.revision,{type:'rerollAugment',slot})).rejects.toThrow('already');
 }
 a.s=await a.g.execute(a.s.id,a.s.revision,{type:'chooseAugment',augment:a.s.augmentOffers[0]});
 await expect(a.g.execute(a.s.id,a.s.revision,{type:'rerollAugment',slot:0})).rejects.toThrow('unavailable');
 for(let i=0;i<2;i++){a.s=await a.g.execute(a.s.id,a.s.revision,{type:'fight'});a.s=await a.g.execute(a.s.id,a.s.revision,{type:'next'});}
 expect(a.s.augmentRerolledSlots).toEqual([]);
});
it('rejects invalid slots and an exhausted pool without consuming the reroll',async()=>{
 const {g,s}=await reward();
 for(const slot of [-1,3,.5])await expect(g.execute(s.id,s.revision,{type:'rerollAugment',slot})).rejects.toThrow('unavailable');
 const internal=(g as unknown as {session:Session}).session;
 internal.augments=Object.keys(AUGMENTS).filter(id=>!s.augmentOffers.includes(id));
 await expect(g.execute(s.id,s.revision,{type:'rerollAugment',slot:0})).rejects.toThrow('No other');
 expect(internal.augmentRerolledSlots).toEqual([]);
});
