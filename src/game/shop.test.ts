import { describe, expect, it } from 'vitest';
import { LocalGameGateway } from '../services/localGateway';
import { offersFor } from './shop';
import { PLAYABLE_SPELLS, SPELLS } from './engine';
describe('catalogue shop authority',()=>{
 it('uses catalogue-only loadouts and offers, with star-based purchases',async()=>{
  const g=new LocalGameGateway();let s=await g.start();expect(s.spells).toEqual([]);
  for(let round=1;round<=20;round++) for(let roll=0;roll<4;roll++) expect(offersFor(round,roll).shop.every(id=>PLAYABLE_SPELLS.includes(id))).toBe(true);
  const id=s.shop[0];s=await g.execute(s.id,s.revision,{type:'buy',spell:id});expect(s.gold).toBe(10-SPELLS[id].stars);
  await expect(g.execute(s.id,s.revision,{type:'buy',spell:'fireball'})).rejects.toThrow('unavailable');
  await expect(g.execute(s.id,s.revision,{type:'buy',spell:'immolate'})).rejects.toThrow('unavailable');
 });
 it('charges rerolls once and rejects stale commands',async()=>{
  const g=new LocalGameGateway();const first=await g.start();const s=await g.execute(first.id,first.revision,{type:'reroll'});
  expect(s.gold).toBe(9);expect(s.shop).not.toEqual(first.shop);expect(s.shop).toEqual(offersFor(1,1).shop);
  await expect(g.execute(first.id,first.revision,{type:'reroll'})).rejects.toThrow('out of date');
 });
 it('applies equipment to the new base stats and locks purchases during combat',async()=>{
  const g=new LocalGameGateway();let s=await g.start();(g as unknown as {session:{gold:number}}).session.gold=30;
  s=await g.execute(s.id,s.revision,{type:'buyEquipment',item:'wand'});s=await g.execute(s.id,s.revision,{type:'buyEquipment',item:'robe'});
  await expect(g.execute(s.id,s.revision,{type:'buyEquipment',item:'robe'})).rejects.toThrow('occupied');
  s=await g.execute(s.id,s.revision,{type:'buy',spell:s.shop.find(id=>SPELLS[id].price<=s.gold)!});
  const goldBeforeFight=s.gold;
  s=await g.execute(s.id,s.revision,{type:'fight'});expect(s.battle!.frames[0].player.maxHealth).toBe(515);expect(s.battle!.frames[0].player.maxMana).toBe(105);
  await expect(g.execute(s.id,s.revision,{type:'buy',spell:'seed-shot'})).rejects.toThrow('locked');
  s=await g.execute(s.id,s.revision,{type:'next'});expect(s.gold).toBe(goldBeforeFight+10);expect(s.equipment.armor).toBe('robe');
 });
 it('limits loadouts, validates reorder and isolates returned state',async()=>{
  const g=new LocalGameGateway();let s=await g.start();(g as unknown as {session:{shop:string[]}}).session.shop=['seed-shot'];for(let i=0;i<10;i++) s=await g.execute(s.id,s.revision,{type:'buy',spell:'seed-shot'});
  await expect(g.execute(s.id,s.revision,{type:'buy',spell:'seed-shot'})).rejects.toThrow('full');
  s=await g.execute(s.id,s.revision,{type:'move',from:9,to:0});expect(s.spells[0]).toBe('seed-shot');
  await expect(g.execute(s.id,s.revision,{type:'move',from:0,to:10})).rejects.toThrow('Invalid');
  s.equipment.armor='robe';s=await g.execute(s.id,s.revision,{type:'fight'});expect(s.battle!.frames[0].player.maxHealth).toBe(500);
 });
});

it('mixes domains deterministically and starts with no spells',async()=>{
 const g=new LocalGameGateway();const s=await g.start();expect(s.spells).toEqual([]);
 await expect(g.execute(s.id,s.revision,{type:'fight'})).rejects.toThrow('Equip a spell');
 for(let roll=0;roll<20;roll++) {
  const offers=offersFor(1,roll).shop;
  expect(new Set(offers.map(id=>SPELLS[id].domain)).size).toBe(3);
  expect(new Set(offers).size).toBe(4);
  expect(offersFor(1,roll).shop).toEqual(offers);
  expect(new Set(offersFor(1,roll,['ember','splash']).shop.map(id=>SPELLS[id].domain))).toEqual(new Set(['fire','water']));
 }
});
