import {describe,expect,it} from 'vitest';
import {fighter,simulate} from './engine';
import {CARDS} from '../config/catalogue';
import type {CombatFrame,Fighter} from './model';

// A legal opponent whose last Fragile spell has already broken isolates effect timing.
const idle=()=>({...fighter('Idle',['germination']),broken:[0]});
const wounded=(spells:string[],xp:number[]=[])=>{const f=fighter('A',spells,[],xp);f.maxHealth=10000;f.health=5000;return f;};
const triggers=(f:CombatFrame,side='player')=>(f.notices??[]).filter(n=>n.side===side&&n.status==='trigger');
const armed=(f:Fighter,...indices:number[])=>{f.memory.cards=Object.fromEntries(indices.map(i=>[i,{armed:true}]));return f;};

describe('armed event chains',()=>{
 it('has exactly 26 spells per domain, all with useful base effects',()=>{
  for(const d of ['fire','water','nature','affliction','holy'])expect(CARDS.filter(c=>c.domain===d)).toHaveLength(26);
  for(const c of CARDS)expect(c.combat?.effects?.some(e=>!['trigger','awaken'].includes(e.kind))).toBe(true);
 });
 it('finishes the first cast chain before arming; later casts can trigger themselves',()=>{
  const r=simulate(wounded(['healing-seed','backdraft','firebolt']),idle());
  expect(triggers(r.frames[1])).toHaveLength(0);
  expect(r.frames[1].player.memory.cards?.[0].armed).toBe(true);
  expect(triggers(r.frames[2]).map(n=>n.index)).toEqual([0]);
  expect(r.frames[2].player.memory.cards?.[1].armed).toBe(true);
  expect(triggers(r.frames[3]).map(n=>n.index)).toEqual([0,1]);
  expect(triggers(r.frames[3])[1].origin).toEqual({side:'player',kind:'spell',index:0});
  expect(triggers(r.frames[6]).map(n=>n.index)).toEqual([0,1]);
 });
 it('resets each tick, keeps copies independent, and follows sequence order',()=>{
  const a=armed(wounded(['healing-seed','backdraft','healing-seed','radiance','spark']),0,1,2,3);
  const r=simulate(a,idle());
  expect(triggers(r.frames[1]).map(n=>n.index)).toEqual([1,3,0,2]);
  for(const f of r.frames){const ns=triggers(f);expect(new Set(ns.map(n=>n.index)).size).toBe(ns.length);}
  expect(triggers(r.frames[2]).length).toBeGreaterThan(0);
 });
 it('an interrupted first cast remains Dormant',()=>{
  const r=simulate(wounded(['flameshield']),fighter('B',['disrupt']));
  expect(r.frames[1].player.memory.cards?.[0]?.armed).not.toBe(true);
  expect(r.frames[1].events.find(e=>e.side==='player')?.status).toBe('skipped');
 });
 it('Ward Gain uses the actual increase and ignores equal or smaller Ward',()=>{
  const a=armed(wounded(['judicator','aegis']),0);a.cursor=1;a.shield=50;
  expect(triggers(simulate(a,idle()).frames[1])).toHaveLength(0);
  a.shield=30;
  expect(triggers(simulate(a,idle()).frames[1]).map(n=>n.index)).toEqual([0]);
  const bear=armed(wounded(['transformation-bear','aegis'],[3,0]),0);bear.cursor=1;bear.shield=30;
  expect(simulate(bear,idle()).frames[1].healingEvents?.map(e=>e.amount)).toEqual([7]);
 });
 it('Heal requires positive restored health; overhealing cannot start a chain',()=>{
  const a=armed(fighter('A',['backdraft','holy-light']),0);a.cursor=1;
  expect(triggers(simulate(a,idle()).frames[1])).toHaveLength(0);
  a.health-=1;expect(triggers(simulate(a,idle()).frames[1]).map(n=>n.index)).toEqual([0]);
 });
 it('Tide and Heat consumption emit events, free activations do not',()=>{
  const a=armed(wounded(['undercurrent','jet']),0);a.cursor=1;a.statuses.tide=3;
  expect(triggers(simulate(a,idle()).frames[1]).map(n=>n.index)).toEqual([0]);
  const b=armed(wounded(['cinder','spark']),0);b.cursor=1;b.statuses.heat=3;b.memory.rules={freeHeat:1};
  expect(triggers(simulate(b,idle()).frames[1])).toHaveLength(0);
  b.memory.rules={};expect(triggers(simulate(b,idle()).frames[1]).map(n=>n.index)).toEqual([0]);
 });
 it('Imp Attack chains into Curse, healing and Fire with the correct origins',()=>{
  const a=armed(wounded(['soul-tithe','leech','backdraft','spark']),0,1,2);a.cursor=3;a.imp={health:100,maxHealth:100,guard:0};a.memory.rules={impDamage:40};
  const ns=triggers(simulate(a,idle()).frames[1]);
  expect(ns.map(n=>n.index)).toEqual([0,1,2]);
  expect(ns[0].origin).toEqual({side:'player',kind:'imp'});
  expect(ns[1].origin).toEqual({side:'player',kind:'spell',index:0});
 });
 it('Poison damage can heal then apply Poison without dealing another periodic tick',()=>{
  const a=armed(wounded(['briarheart','toxic-growth','pyroblast']),0,1);a.cursor=2;const b=idle();b.statuses.poison=2;
  const f=simulate(a,b).frames[1];expect(triggers(f).map(n=>n.index)).toEqual([0,1]);
  expect(f.damageEvents?.filter(e=>e.kind==='dot')).toHaveLength(1);expect(f.bot.statuses.poison).toBe(2);
 });
 it('Retrigger repeats the last payload without adding history or chaining',()=>{
  const a=armed(wounded(['healing-seed','backdraft','whirlpool']),0,1);a.cursor=2;
  a.memory.triggerHistory=[{index:0,cycle:1,effects:[{kind:'heal',amount:5}]}];
  const f=simulate(a,idle()).frames[1];
  expect(f.notices?.find(n=>n.status==='retrigger')).toMatchObject({index:2,targetIndex:0});
  expect(triggers(f).map(n=>n.index)).toEqual([0,1]);
  expect(f.player.memory.triggerHistory).toHaveLength(3);
  const b=wounded(['healing-seed','whirlpool']);b.cursor=1;b.memory.triggerHistory=a.memory.triggerHistory;
  expect(simulate(b,idle()).frames[1].notices?.some(n=>n.status==='retrigger')).toBe(false);
 });
 it('a broken Trigger cannot activate or be Retriggered',()=>{
  const a=armed(wounded(['divine-intervention','whirlpool']),0);a.broken=[0];a.cursor=1;a.memory.triggerHistory=[{index:0,cycle:1,effects:[{kind:'ward',amount:300}]}];
  expect(simulate(a,idle()).frames[1].notices?.some(n=>['trigger','retrigger'].includes(n.status))).toBe(false);
 });
 it('Fragile retains sequence damage bonuses through its Echo, then leaves',()=>{
  const a=fighter('A',['doomsday'],['first-strike']);a.statuses.tide=3;
  const f=simulate(a,idle()).frames[1];
  expect(f.damageEvents?.filter(e=>e.side==='bot').map(e=>e.amount)).toEqual([120,60]);
  expect(f.player.broken).toEqual([0]);
 });
 it('completion chains finish before Reckless Loop clears the old Cycle history',()=>{
  const a=armed(wounded(['soul-tithe']),0);a.augments=['reckless-loop'];a.memory.rules={impDamage:40};a.imp={health:100,maxHealth:100,guard:0};
  const f=simulate(a,idle()).frames[1];expect(triggers(f).map(n=>n.index)).toEqual([0]);
  expect(f.player.cycle).toBe(2);expect(f.player.memory.triggerHistory).toEqual([]);
 });
});

describe('revised conditional and permanent spells',()=>{
 it('Downpour remembers Tide before consumption, not the remaining counter',()=>{
  const a=fighter('A',['downpour']);a.statuses.tide=3;
  const f=simulate(a,idle()).frames[2];expect(f.damageEvents?.filter(e=>e.side==='bot').map(e=>e.amount)).toEqual([120,60]);
 });
 it('Photosynthesis checks existing Regeneration before adding its base amount',()=>{
  const a=fighter('A',['photosynthesis']);expect(simulate(a,idle()).frames[1].player.statuses.regeneration).toBe(4);
  a.statuses.regeneration=2;expect(simulate(a,idle()).frames[1].player.statuses.regeneration).toBe(7);
 });
 it('Echo-only Brine, Undertow and Ripple rewards use their full printed values',()=>{
  const a=wounded(['brine']);a.statuses.tide=3;expect(simulate(a,idle()).frames[3].player.statuses.tide).toBe(2);
  const b=wounded(['undertow']);b.statuses.tide=3;expect(simulate(b,idle()).frames[2].player.statuses.tide).toBe(3);
  const c=wounded(['ripple']);c.statuses.tide=3;expect(simulate(c,idle()).frames[1].healingEvents?.map(e=>e.amount)).toEqual([30]);
 });
 it('Living Flame gives only the first non-Instant Fire spell a free activation per Cycle',()=>{
  const a=wounded(['holy-light','spark','pyroblast']);a.memory.rules={livingFlame:1,livingFlameHeat:2};a.statuses.heat=3;
  const r=simulate(a,idle());expect(r.frames[2].notices?.find(n=>n.status==='heat')?.text).toBe('FREE · EMPOWERED');
  expect(r.frames[2].player.statuses.heat).toBe(6);expect(r.frames[3].player.memory.heatConsumed).toBe(1);
 });
 it('Maelstrom reserves one free Echo on the first cast without spending Tide',()=>{
  const a=wounded(['holy-light','jet']);a.memory.rules={cycleEcho:.75};a.statuses.tide=3;
  const r=simulate(a,idle());expect(r.frames[1].events[0].repeats).toBe(2);expect(r.frames[1].player.statuses.tide).toBe(3);
  expect(r.frames[2].notices?.find(n=>n.status==='tide')?.resource?.spent).toBe(3);
 });
 it('Firebolt chooses conditional Instant before casting; Firefury uses previous Heat consumption',()=>{
  const a=fighter('A',['firebolt'],[],[3]);expect(simulate(a,idle()).frames[1].events[0].details).toContain('Instant');
  a.statuses.heat=3;expect(simulate(a,idle()).frames[1].events[0].details).not.toContain('Instant');
  const b=fighter('A',['spark','firefury']);b.statuses.heat=3;expect(simulate(b,idle()).frames[2].events[0].details).toContain('Instant');
 });
 it('Heatwave only buffs the next Fire spell and its bonus expires at the Cycle boundary',()=>{
  const a=fighter('A',['heatwave','radiant-bolt','spark']);const r=simulate(a,idle());
  expect(r.frames[4].damageEvents?.find(e=>e.side==='bot')?.amount).toBe(85);
  const b=fighter('A',['heatwave']);expect(simulate(b,idle()).frames[3].damageEvents?.find(e=>e.side==='bot')?.amount).toBe(50);
 });
 it('cast-start Ward conditions survive later changes to Ward',()=>{
  const a=fighter('A',['sacred-group']);a.shield=1;const r=simulate(a,fighter('B',['spark','pyroblast']));
  expect(r.frames[3].player.statuses.guard).toBe(1);
  const b=fighter('A',['radiant-bolt']);b.statuses.poison=1;expect(simulate(b,idle()).frames[2].player.shield).toBe(25);
 });
});
