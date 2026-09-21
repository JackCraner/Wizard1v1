import {it,expect} from 'vitest';
import {EQUIPMENT,equipmentModifiers,validateInventory,itemTotals} from './equipment';
import {fighter,simulate,deriveStats} from './engine';
import {offersFor} from './shop';
import {LocalGameGateway} from '../services/localGateway';
import type {ItemInventory} from './model';
const geared=(inventory:ItemInventory,deck=['wrath'])=>fighter('Items',deck,equipmentModifiers(inventory));
const idle=()=>fighter('Idle',['splash'],[{health:5000}]);
it('imports exactly the 80 supplied items, priced by rank, without retired slots or Focus',()=>{
 expect(Object.keys(EQUIPMENT)).toHaveLength(80);
 for(const e of Object.values(EQUIPMENT)){expect(e.price).toBe(e.stars);expect(e.stars).toBeGreaterThanOrEqual(1);expect(e.stars).toBeLessThanOrEqual(5);expect(e.effects.length).toBeGreaterThan(0);expect(e).not.toHaveProperty('slot');expect(JSON.stringify(e)).not.toMatch(/focus/i);}
 expect(EQUIPMENT.thorn_seed.affinity).toBe('nature');
});
it('aggregates unlimited copies and all distinct items without positional slots',()=>{
 const f=geared({vitality_charm:1000,mana_flask:200,iron_buckle:2});expect(f.maxHealth).toBe(20520);expect(f.maxMana).toBe(904);expect(f.equipment).toEqual({vitality_charm:1000,mana_flask:200,iron_buckle:2});
 const all=Object.fromEntries(Object.keys(EQUIPMENT).map(id=>[id,3]));expect(Object.keys(geared(all).equipment!)).toHaveLength(80);
});
it('applies stat floors after summing all items so insertion order cannot change Health or Mana',()=>{
 const a=geared({glass_pendant:100,vitality_charm:100,broken_wand:100,mana_flask:100});const b=geared({mana_flask:100,broken_wand:100,vitality_charm:100,glass_pendant:100});expect(a.maxHealth).toBe(500);expect(a.maxHealth).toBe(b.maxHealth);expect(a.maxMana).toBe(b.maxMana);
 expect(deriveStats(equipmentModifiers({glass_pendant:100,broken_wand:100}))).toEqual({health:1,mana:0});
});
it('rejects unknown, fractional, negative and non-finite stacks',()=>{
 for(const value of [0,-1,1.5,NaN,Infinity])expect(()=>validateInventory({vitality_charm:value})).toThrow('Invalid');
 expect(()=>validateInventory({retired_item:1})).toThrow('Invalid');
});
it('purchases duplicate offers once each and adds copies instead of replacing items',async()=>{
 const g=new LocalGameGateway();let s=await g.start();(g as any).session.equipmentShop=['vitality_charm','vitality_charm','mana_flask'];
 s=await g.execute(s.id,s.revision,{type:'buyEquipment',item:'vitality_charm',shopSlot:1});expect(s.equipment.vitality_charm).toBe(1);expect(s.equipmentShop).toEqual(['vitality_charm',null,'mana_flask']);
 await expect(g.execute(s.id,s.revision,{type:'buyEquipment',item:'vitality_charm',shopSlot:1})).rejects.toThrow('unavailable');
 s=await g.execute(s.id,s.revision,{type:'buyEquipment',item:'vitality_charm',shopSlot:0});s=await g.execute(s.id,s.revision,{type:'buyEquipment',item:'mana_flask',shopSlot:2});expect(s.equipment).toEqual({vitality_charm:2,mana_flask:1});expect(s.gold).toBe(7);
 await expect(g.execute(s.id,s.revision-1,{type:'reroll'})).rejects.toThrow('out of date');
 s.equipment.vitality_charm=999;s=await g.execute(s.id,s.revision,{type:'buy',spell:s.shop[0]!});s=await g.execute(s.id,s.revision,{type:'fight'});expect(s.battle!.frames[0].player.maxHealth).toBe(540);
 s=await g.execute(s.id,s.revision,{type:'next'});expect(s.equipment.vitality_charm).toBe(2);expect(s.equipmentShop).toHaveLength(3);
});
it('retains an offer and inventory on insufficient gold or mismatched slot',async()=>{
 const g=new LocalGameGateway();const s=await g.start();const internal=(g as any).session;internal.gold=0;internal.equipmentShop=['vitality_charm','mana_flask','polished_lens'];
 await expect(g.execute(s.id,s.revision,{type:'buyEquipment',item:'vitality_charm',shopSlot:0})).rejects.toThrow('gold');
 await expect(g.execute(s.id,s.revision,{type:'buyEquipment',item:'vitality_charm',shopSlot:1})).rejects.toThrow('unavailable');expect(internal.equipment).toEqual({});expect(internal.equipmentShop[0]).toBe('vitality_charm');
});
it('creates three offers with rank odds independent of catalogue counts',()=>{
 let rank5=0;for(let i=0;i<1500;i++){expect(offersFor(1,i).equipmentShop).toHaveLength(3);expect(offersFor(1,i).equipmentShop.every(id=>EQUIPMENT[id].stars===1)).toBe(true);rank5+=offersFor(10,i).equipmentShop.filter(id=>EQUIPMENT[id].stars===5).length;}
 expect(rank5/4500).toBeGreaterThan(.07);expect(rank5/4500).toBeLessThan(.13);
});
it('favors owned domains but keeps neutral and off-domain items available',()=>{
 const counts:Record<string,number>={};for(let roll=0;roll<2000;roll++)for(const id of offersFor(3,roll,['ember','holy_smite']).equipmentShop){const a=EQUIPMENT[id].affinity;counts[a]=(counts[a]??0)+1;}
 expect(counts.neutral/6000).toBeGreaterThan(.3);expect((counts.fire+counts.holy)/6000).toBeGreaterThan(.55);expect(counts.water).toBeGreaterThan(0);expect(counts.nature).toBeGreaterThan(0);
});
it('sums damage percentages in one item bucket and keeps spell buffs separate',()=>{
 const a=geared({glass_pendant:2,arcane_splinter:3,ember_shard:5},['ember']);a.statuses.fury=3;
 expect(simulate(a,idle()).frames[1].damageEvents?.[0].amount).toBe(Math.round(60*1.30*1.1));
});
it('shows total per-item bonuses and explicit caps',()=>{
 expect(itemTotals(EQUIPMENT.polished_lens,3)).toEqual(['+6% crit chance']);expect(itemTotals(EQUIPMENT.lucky_coin,20)[0]).toContain('+10');expect(itemTotals(EQUIPMENT.lucky_coin,20)[0]).toContain('cap 10');
});
it('runs every item with multiple copies deterministically without mutating inputs',()=>{
 for(const e of Object.values(EQUIPMENT)){
  const p=geared({[e.id]:7},['overheat','immolate','firekick','splash','tidal-burst','mistveil']);p.health=Math.min(200,p.maxHealth);p.statuses={rain:10,tide:10,growth:5,burn:5};
  const before=JSON.stringify(p),b=simulate(p,idle(),897);expect(JSON.stringify(p),e.id).toBe(before);expect(b,e.id).toEqual(simulate(p,idle(),897));
  for(const frame of b.frames)for(const side of ['player','bot'] as const){const f=frame[side];expect(Number.isFinite(f.health),e.id).toBe(true);expect(f.health,e.id).toBeGreaterThanOrEqual(0);expect(f.health,e.id).toBeLessThanOrEqual(f.maxHealth);expect(f.mana,e.id).toBeGreaterThanOrEqual(0);expect(f.mana,e.id).toBeLessThanOrEqual(f.maxMana);expect(f.shield,e.id).toBeGreaterThanOrEqual(0);}
 }
});
