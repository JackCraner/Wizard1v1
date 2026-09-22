import {expect,it,vi} from 'vitest';
import {LocalGameGateway} from '../services/localGateway';
import {offersFor} from './shop';
import {augmentOffers} from './augments';

it('creates a fresh run seed and uses it for the opening shop',async()=>{
 const random=vi.spyOn(Math,'random').mockReturnValueOnce(.125).mockReturnValueOnce(.875);
 try {
  const a=await new LocalGameGateway().start(),b=await new LocalGameGateway().start();
  expect(a.seed).not.toBe(b.seed);
  expect(a.shop).toEqual(offersFor(1,0,[],[],a.seed).shop);
  expect(a.shop).not.toEqual(b.shop);
  expect(augmentOffers(2,[],a.seed)).not.toEqual(augmentOffers(2,[],b.seed));
 } finally {random.mockRestore();}
});

it('replays shops, rerolls, battles and level-up rewards from the same run seed',async()=>{
 async function play(seed:number) {
  const gateway=new LocalGameGateway();let s=await gateway.start('normal',seed);
  const shops=[s.shop];
  s=await gateway.execute(s.id,s.revision,{type:'reroll'});shops.push(s.shop);
  expect(s.shop).toEqual(offersFor(1,1,[],[],seed).shop);
  s=await gateway.execute(s.id,s.revision,{type:'buy',spell:s.shop[0]!,shopSlot:0});
  const battles=[];
  for(let round=1;round<=2;round++) {
   s=await gateway.execute(s.id,s.revision,{type:'fight'});battles.push(s.battle);
   s=await gateway.execute(s.id,s.revision,{type:'next'});
   expect(s.seed).toBe(seed);
   if(s.phase==='shop')shops.push(s.shop);
  }
  expect(s.phase).toBe('augment');
  expect(s.augmentOffers).toEqual(augmentOffers(2,[],seed));
  return {shops,battles,augments:s.augmentOffers,lobby:s.lobby};
 }
 expect(await play(123456)).toEqual(await play(123456));
});

it('accepts zero as an explicit seed and rejects invalid seeds',async()=>{
 expect((await new LocalGameGateway().start('normal',0)).seed).toBe(0);
 for(const seed of [-1,1.5,NaN,4294967296])await expect(new LocalGameGateway().start('normal',seed)).rejects.toThrow('seed');
});
