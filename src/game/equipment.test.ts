import {it,expect} from 'vitest';
import {EQUIPMENT,equipmentModifiers,rerollCost} from './equipment';
import {fighter,simulate,RULES} from './engine';
import {offersFor} from './shop';
import {LocalGameGateway} from '../services/localGateway';
const geared=(id:string,deck=['wrath'])=>fighter('Gear',deck,equipmentModifiers({[EQUIPMENT[id].slot]:id}));
const idle=()=>fighter('Idle',['splash'],[{health:3000}]);
it('imports 155 distinct items and prices each at its rank',()=>{
 expect(Object.keys(EQUIPMENT)).toHaveLength(155);
 for(const e of Object.values(EQUIPMENT)){expect(e.price).toBe(e.stars);expect(e.stars).toBeGreaterThanOrEqual(1);expect(e.stars).toBeLessThanOrEqual(5);if(e.slot==='armor'||e.slot==='boots'){expect(e.stats.maxHealth).toBeGreaterThan(0);expect(e.stats.maxMana).toBeGreaterThan(0);}}
});
it('all equipment simulates deterministically with finite resources and no input mutation',()=>{
 for(const e of Object.values(EQUIPMENT)){
  const p=geared(e.id,['overheat','immolate','firekick','splash','tidal-burst','mistveil']);p.health=200;p.statuses={rain:10,tide:10,growth:5,burn:5};
  const before=JSON.stringify(p),b=simulate(p,idle(),897);
  expect(JSON.stringify(p),e.id).toBe(before);expect(b,e.id).toEqual(simulate(p,idle(),897));
  for(const f of b.frames)for(const side of ['player','bot'] as const){expect(Number.isFinite(f[side].health),e.id).toBe(true);expect(f[side].health,e.id).toBeGreaterThanOrEqual(0);expect(f[side].mana,e.id).toBeGreaterThanOrEqual(0);expect(f[side].mana,e.id).toBeLessThanOrEqual(f[side].maxMana);expect(f[side].shield,e.id).toBeGreaterThanOrEqual(0);}
 }
});
it('rank one equipment only at round one; rank odds are not weighted by item counts',()=>{
 let rank5=0;for(let i=0;i<2000;i++){
  expect(offersFor(1,i).equipmentShop.every(id=>EQUIPMENT[id!].stars===1)).toBe(true);
  rank5+=offersFor(10,i).equipmentShop.filter(id=>EQUIPMENT[id!].stars===5).length;
 }
 expect(rank5/4000).toBeGreaterThan(.07);expect(rank5/4000).toBeLessThan(.13);
});
it('Spell Power applies once to direct damage and Restoration to healing, not mana',()=>{
 const p=geared('weapon_apprentices_wand',['ember']);expect(simulate(p,idle()).frames[1].damageEvents?.[0].amount).toBe(63);
 const healer=geared('ring_emerald_ring',['regrowth']);healer.health=100;
 expect(simulate(healer,idle()).frames[1].player.health).toBe(133);
});
it('Ward absorbs damage, stacks, and does not count down',()=>{
 const p=geared('armor_warded_robes',['splash']);const b=simulate(p,fighter('B',['wrath','wrath']));
 expect(b.frames[0].player.shield).toBe(30);expect(b.frames[1].player.shield).toBe(10);expect(b.frames[1].player.health).toBe(p.health);
 expect(b.frames[2].player.shield).toBe(0);expect(b.frames[2].player.health).toBe(p.health-10);
 const waiting=simulate(p,idle());expect(waiting.frames[5].player.shield).toBe(30);
});
it('Cycle ends after reshuffle and refreshes first-spell triggers',()=>{
 const b=simulate(geared('weapon_ember_twig',['ember']),idle());
 expect(b.frames[1].bot.statuses.burn).toBe(1);expect(b.frames[2].player.cycle).toBe(1);expect(b.frames[3].player.cycle).toBe(2);
 expect(b.frames[4].bot.statuses.burn).toBe(1);
});
it('reshuffle equipment changes timing and only grants after-reshuffle effects on completion',()=>{
 const b=simulate(geared('boots_reshufflers_boots'),idle());expect(b.frames[2].player.cycle).toBe(2);expect(b.frames[3].events.some(e=>e.side==='player')).toBe(true);
 const p=geared('ring_ouroboros');p.mana=0;const r=simulate(p,idle());expect(r.frames[2].player.shield).toBe(0);expect(r.frames[3].player.shield).toBe(15);expect(r.frames[3].player.mana).toBe(10);
});
it('equipment mana reduction is paid once and next Water discount waits for a reshuffle',()=>{
 const p=geared('weapon_deepcurrent_sceptre',['brine']);const b=simulate(p,idle());expect(b.frames[1].player.mana).toBe(p.mana-2);expect(b.frames[5].player.mana).toBe(p.mana-2);
});
it('equipment can increase crit chance and crit power without Hotstreak',()=>{
 const p=geared('weapon_volcanic_focus',['ember']);p.statuses.hotstreak=11;
 const b=simulate(p,idle());expect(b.frames[1].events.find(e=>e.side==='player')?.critMultiplier).toBe(1.75);expect(b.frames[1].player.health).toBe(p.health-10);
});
it('Eye restores 5 mana on Water Tidecaller and Heart preserves the first Tide consumption',()=>{
 for(const id of ['ring_eye_of_the_storm','ring_heart_of_the_tide']){
  const p=fighter('A',['tidal-burst'],equipmentModifiers({ring:id,weapon:'weapon_leviathan_sceptre'}));p.statuses.tide=10;p.mana=50;
  const b=simulate(p,idle());expect(b.frames[2].events.find(e=>e.side==='player')?.repeats).toBe(2);
  expect(b.frames[2].player.statuses.tide).toBe(id==='ring_heart_of_the_tide'?8:3);
  if(id==='ring_eye_of_the_storm')expect(b.frames[2].player.mana).toBe(50);
 }
});
it('equipment purchases consume offers, replace gear and reject stale commands',async()=>{
 const g=new LocalGameGateway();let s=await g.start();const internal=(g as any).session;internal.equipmentShop=['weapon_apprentices_wand','weapon_ember_twig'];
 s=await g.execute(s.id,s.revision,{type:'buyEquipment',item:'weapon_apprentices_wand'});expect(s.gold).toBe(9);expect(s.equipmentShop[0]).toBeNull();
 await expect(g.execute(s.id,s.revision,{type:'buyEquipment',item:'weapon_apprentices_wand'})).rejects.toThrow('unavailable');
 s=await g.execute(s.id,s.revision,{type:'buyEquipment',item:'weapon_ember_twig'});expect(s.equipment.weapon).toBe('weapon_ember_twig');expect(s.gold).toBe(8);
 await expect(g.execute(s.id,s.revision-1,{type:'reroll'})).rejects.toThrow('out of date');
});
it('Merchant Signet makes only the first reroll free',async()=>{
 expect(rerollCost({ring:'ring_merchants_signet'},0)).toBe(0);expect(rerollCost({ring:'ring_merchants_signet'},1)).toBe(1);
 const g=new LocalGameGateway();let s=await g.start();(g as any).session.equipment.ring='ring_merchants_signet';s=await g.execute(s.id,s.revision,{type:'reroll'});expect(s.gold).toBe(10);s=await g.execute(s.id,s.revision,{type:'reroll'});expect(s.gold).toBe(9);
});
