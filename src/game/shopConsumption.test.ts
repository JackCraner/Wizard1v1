import {expect,it} from 'vitest';
import {LocalGameGateway} from '../services/localGateway';
import type {Session} from './model';
import {offersFor} from './shop';
it('consumes exactly the purchased slot, rejects rebuys and refills on reroll',async()=>{
 const g=new LocalGameGateway();const first=await g.start();const spell=first.shop[1]!;
 let s=await g.execute(first.id,0,{type:'buy',spell,shopSlot:1});
 expect(s.shop).toEqual(first.shop.map((id,i)=>i===1?null:id));
 const gold=s.gold;
 await expect(g.execute(s.id,s.revision,{type:'buy',spell,shopSlot:1})).rejects.toThrow('unavailable');
 await expect(g.execute(s.id,s.revision,{type:'buy',spell})).rejects.toThrow('unavailable');
 s=await g.execute(s.id,s.revision,{type:'reroll'});
 expect(s.gold).toBe(gold-1);expect(s.shop).toEqual(offersFor(1,1).shop);expect(s.shop.every(Boolean)).toBe(true);
});
it('consumes the chosen duplicate offer when buying XP, even with a full hand',async()=>{
 const g=new LocalGameGateway();await g.start();const raw=(g as unknown as {session:Session}).session;
 raw.shop=['wrath','wrath',null,'splash'];raw.spells=Array(10).fill('wrath');raw.spellXp=Array(10).fill(0);
 let s=await g.execute(raw.id,0,{type:'buy',spell:'wrath',shopSlot:1,target:0});
 expect(s.shop).toEqual(['wrath',null,null,'splash']);expect(s.spellXp?.[0]).toBe(1);expect(s.spells).toHaveLength(10);
 await expect(g.execute(s.id,s.revision,{type:'buy',spell:'wrath',shopSlot:1,target:0})).rejects.toThrow('unavailable');
 s=await g.execute(s.id,s.revision,{type:'buy',spell:'wrath',shopSlot:0,target:0});
 expect(s.spellXp?.[0]).toBe(2);expect(s.gold).toBe(8);
});
it('does not consume offers or money on failed purchases and refills next round',async()=>{
 const g=new LocalGameGateway();await g.start();const raw=(g as unknown as {session:Session}).session;
 raw.shop=['wrath','seed-shot',null,null];raw.gold=0;
 await expect(g.execute(raw.id,0,{type:'buy',spell:'wrath',shopSlot:0})).rejects.toThrow('gold');
 expect(raw.shop[0]).toBe('wrath');expect(raw.revision).toBe(0);
 raw.gold=10;
 await expect(g.execute(raw.id,0,{type:'buy',spell:'wrath',shopSlot:1})).rejects.toThrow('unavailable');
 let s=await g.execute(raw.id,0,{type:'buy',spell:'wrath',shopSlot:0});
 s=await g.execute(s.id,s.revision,{type:'fight'});s=await g.execute(s.id,s.revision,{type:'next'});
 expect(s.shop).toEqual(offersFor(2,0,s.spells).shop);expect(s.shop.every(Boolean)).toBe(true);
});
