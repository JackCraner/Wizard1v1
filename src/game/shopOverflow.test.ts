import {expect,it} from 'vitest';
import {LocalGameGateway} from '../services/localGateway';
import {SPELLS} from './engine';
import type {Session} from './model';

async function fullShop(){
 const g=new LocalGameGateway();await g.start('normal',42);
 const raw=(g as unknown as {session:Session}).session;
 Object.assign(raw,{spells:['spark','jet','thorn-lash','prayer','leech','wrath'],spellXp:[0,1,2,0,0,0],spellAcquired:[0,1,2,3,4,5],nextAcquisition:6,shop:['backdraft','wrath','pyroblast',null,null],gold:20});
 return {g,raw};
}
it('buys multiple temporary bench cards at full price and blocks combat without changing state',async()=>{
 const {g,raw}=await fullShop();
 let s=await g.execute(raw.id,raw.revision,{type:'buy',spell:'backdraft',shopSlot:0});
 s=await g.execute(s.id,s.revision,{type:'buy',spell:'pyroblast',shopSlot:2});
 expect(s.spells).toHaveLength(8);expect(s.gold).toBe(20-SPELLS.backdraft.price-SPELLS.pyroblast.price);
 expect(s.spellXp).toEqual([0,1,2,0,0,0,0,0]);expect(s.spellAcquired).toEqual([0,1,2,3,4,5,6,7]);
 const revision=s.revision;
 await expect(g.execute(s.id,revision,{type:'fight'})).rejects.toThrow('Reduce your hand to 6');
 s=await g.execute(s.id,revision,{type:'move',from:7,to:0});expect(s.spells[0]).toBe('pyroblast');expect(s.spellAcquired?.[0]).toBe(7);
 s=await g.execute(s.id,s.revision,{type:'trash',index:1});
 await expect(g.execute(s.id,s.revision,{type:'fight'})).rejects.toThrow('Reduce your hand to 6');
 s=await g.execute(s.id,s.revision,{type:'trash',index:1});
 expect(s.gold).toBe(11);s=await g.execute(s.id,s.revision,{type:'fight'});
 expect(s.battle?.frames[0].player.spells).toHaveLength(6);
 expect(s.battle?.frames[0].player.spells[0]).toBe('pyroblast');
});
it('merging a temporary copy restores a legal hand and buy-to-merge does not increase its size',async()=>{
 const {g,raw}=await fullShop();let s=await g.execute(raw.id,raw.revision,{type:'buy',spell:'wrath',shopSlot:1});
 expect(s.spells).toHaveLength(7);
 s=await g.execute(s.id,s.revision,{type:'merge',from:6,to:5});expect(s.spells).toHaveLength(6);expect(s.spellXp?.[5]).toBe(1);
 expect(s.gold).toBe(18);s=await g.execute(s.id,s.revision,{type:'fight'});expect(s.phase).toBe('result');
});
it('an oversized hand still cannot buy an unaffordable spell',async()=>{
 const {g,raw}=await fullShop();raw.gold=1;raw.spells.push('spark');raw.spellXp?.push(0);raw.spellAcquired?.push(6);
 await expect(g.execute(raw.id,raw.revision,{type:'buy',spell:'backdraft',shopSlot:0})).rejects.toThrow('Not enough gold');
 expect(raw.gold).toBe(1);expect(raw.shop[0]).toBe('backdraft');expect(raw.spells).toHaveLength(7);
});
