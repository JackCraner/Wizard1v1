import {it,expect} from 'vitest';
import {fighter,simulate} from './engine';
import {equipmentModifiers} from './equipment';
import type {Session} from './model';
const p=(equipment:Session['equipment'],deck=['wrath'])=>fighter('A',deck,equipmentModifiers(equipment));
const foe=()=>fighter('B',['splash'],[{health:3000}]);
it('periodic stack bonuses apply once per Cycle and do not double passive stat bonuses',()=>{
 const b=simulate(p({weapon:'weapon_ancient_worldroot',ring:'ring_seed_of_the_worldtree'},['moonfire','moonfire']),foe());
 expect(b.frames[1].bot.statuses.moonfire).toBe(10);expect(b.frames[1].player.shield).toBe(5);expect(b.frames[2].bot.statuses.moonfire).toBe(14);
});
it('combat-start and low-health triggers have separate combat limits',()=>{
 const a=p({ring:'ring_ring_of_embers',armor:'armor_heartwood_plate'});a.health=100;
 const b=simulate(a,foe());expect(b.frames[0].player.statuses.hotstreak).toBe(2);expect(b.frames[1].player.statuses.growth).toBe(2);
 expect(b.frames[5].player.statuses.growth??0).toBe(0);
});
it('mana overflow and overhealing become Ward only up to their per-Cycle caps',()=>{
 const a=p({armor:'armor_overflow_robes',ring:'ring_overflow_band'},['regrowth','splash','regrowth','splash']);a.statuses={growth:5};
 const b=simulate(a,foe());expect(b.frames[4].player.shield).toBeLessThanOrEqual(50);expect(b.frames[4].player.shield).toBeGreaterThanOrEqual(40);
});
it('Veil bonus grants 7 mana, including on a guarded spell hit',()=>{
 const a=p({armor:'armor_deepsea_mantle'},['splash']);a.statuses.veil=3;a.mana=0;
 expect(simulate(a,fighter('B',['wrath'])).frames[1].player.mana).toBe(12);
});
it('spell sequencing only empowers the qualifying cast',()=>{
 const b=simulate(p({ring:'ring_ring_of_resonance'},['wrath','wrath','splash','wrath']),foe());
 const damage=b.frames.slice(1,5).map(f=>f.damageEvents?.filter(e=>e.side==='bot').reduce((n,e)=>n+e.amount,0));
 expect(damage).toEqual([21,23,0,21]);
});
it('Chronowand shortens only the first printed slow spell each Cycle',()=>{
 const b=simulate(p({weapon:'weapon_chronowand'},['seed-shot','seed-shot']),foe());
 expect(b.frames[1].events.some(e=>e.side==='player')).toBe(true);expect(b.frames[2].player.casting?.remaining).toBe(1);expect(b.frames[3].events.some(e=>e.side==='player')).toBe(true);
});
it('Archmage makes the first post-reshuffle spell Instant and adds mana to its start cost',()=>{
 const b=simulate(p({weapon:'weapon_archmage_staff'},['wrath']),foe());
 expect(b.frames[1].player.instantThisTick).toBeUndefined();expect(b.frames[4].player.instantThisTick).toBe('wrath');expect(b.frames[4].player.mana).toBe(90);
});
it('Quickstep discounts the next normal spell, preserving the discount through another Instant',()=>{
 const b=simulate(p({boots:'boots_quickstep_boots'},['mist','mist','ember']),foe());
 expect(b.frames[1].player.mana-b.frames[2].player.mana).toBe(5);expect(b.frames[3].events.find(e=>e.side==='player')?.mana).toBe(0);
});
it('Spellbreaker ignores the first interrupt; later ones skip without refund',()=>{
 const a=p({armor:'armor_spellbreaker_plate'},['pyroblast','pyroblast']);
 const b=simulate(a,fighter('B',['firekick','firekick','firekick']));
 expect(b.frames[2].player.casting).not.toBeNull();expect(b.frames[4].events).toContainEqual(expect.objectContaining({side:'player',status:'skipped'}));
});
it('fixed-tick items grant Ward exactly on their configured ticks',()=>{
 const b=simulate(p({armor:'armor_voidplate'},['splash']),foe());expect(b.frames[9].player.shield).toBe(0);expect(b.frames[10].player.shield).toBe(25);expect(b.frames[20].player.shield).toBe(50);
});
it('Guard blocks without spending Ward; Wardpiercer bypasses a fraction of the shield',()=>{
 const target=foe();target.shield=100;target.statuses.guard=2;
 const a=p({weapon:'weapon_wardpiercer'},['ember','ember']);const b=simulate(a,target);
 expect(b.frames[1].bot.shield).toBe(100);expect(b.frames[1].bot.health).toBe(target.health);
 expect(b.frames[2].bot.health).toBe(target.health-16);expect(b.frames[2].bot.shield).toBe(52);
});
it('negative health tradeoffs, Restoration and two-domain bonuses use the catalogue values',()=>{
 const a=p({weapon:'weapon_glass_wand',ring:'ring_twin_sigil'},['wrath','regrowth','splash']);a.health=100;
 const b=simulate(a,foe());expect(b.frames[0].player.maxHealth).toBe(460);expect(b.frames[1].damageEvents?.[0].amount).toBe(25);expect(b.frames[2].player.health).toBe(132);
});
