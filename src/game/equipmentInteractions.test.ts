import {it,expect} from 'vitest';
import {fighter,simulate} from './engine';
import {equipmentModifiers} from './equipment';
import type {ItemInventory,Fighter} from './model';
const p=(items:ItemInventory,deck=['wrath'],overrides:Partial<Fighter>={})=>({...fighter('A',deck,equipmentModifiers(items)),...overrides});
const foe=()=>fighter('B',['splash'],[{health:3000}]);
it('Moonstone and Sunseed add before DoT percentages; direct bonuses do not boost DoTs',()=>{
 const b=simulate(p({moonstone_chip:4,sunseed:2,thorn_seed:10,glass_pendant:1,arcane_splinter:100},['moonfire','sunfire']),foe());
 expect(b.frames[2].damageEvents?.find(e=>e.kind==='dot')?.amount).toBe(Math.round(14*1.37));expect(b.frames[3].damageEvents?.filter(e=>e.kind==='dot').map(e=>e.amount)).toEqual([Math.round(14*1.37),Math.round(24*1.37)]);
});
it('Lifebloom adds flat healing per remaining stack then sums healing and HoT bonuses',()=>{
 const f=simulate(p({lifebloom_petal:3,mossy_charm:5,silver_thread:2},['splash'],{health:100,statuses:{lifebloom:5}}),foe()).frames[1];
 expect(f.player.health).toBe(100+Math.round(13*5*1.16));
});
it('Holy healing bonus follows the source domain and healing received is a separate multiplier',()=>{
 const a=p({prayer_beads:10,silver_thread:10,rainstone:10},['holy_prayer','regrowth'],{health:100,statuses:{rain:10}}),b=simulate(a,foe());
 expect(b.frames[1].player.health).toBe(100+Math.round(25*1.5*1.3));expect(b.frames[2].player.health-b.frames[1].player.health).toBe(Math.round(30*1.3*1.3));
});
it('healing received cannot become negative with unlimited tradeoff items',()=>{
 const b=simulate(p({rotting_thorn:100},['regrowth'],{health:100}),foe());expect(b.frames[1].player.health).toBe(100);
});
it('Scorched Band reduces self damage but never Overheat health costs or enemy hits',()=>{
 const b=simulate(p({scorched_band:20},['from-ash','overheat']),fighter('B',['wrath']));expect(b.frames[1].player.health).toBe(480);expect(b.frames[2].player.health).toBe(240);
});
it('first slow mana discounts are committed once and consumed even when interrupted',()=>{
 const b=simulate(p({small_hourglass:2,cracked_hourglass:1,lucky_coin:99},['pyroblast','pyroblast']),fighter('B',['firekick']));
 expect(b.frames[1].player.mana).toBe(100);expect(b.frames[2].events.some(e=>e.side==='player'&&e.status==='skipped')).toBe(true);expect(b.frames[3].player.mana).toBe(90);
});
it('first-spell damage buffs expire on completion and reset after reshuffle',()=>{
 const b=simulate(p({war_banner:5,furnace_fragment:5},['ember','ember']),foe());
 expect(b.frames[1].damageEvents?.[0].amount).toBe(84);expect(b.frames[2].damageEvents?.[0].amount).toBe(60);expect(b.frames[5].damageEvents?.[0].amount).toBe(84);
});
it('critical Fire scaling is additive with other item percentages',()=>{
 const b=simulate(p({polished_lens:50,volcanic_glass:2,ember_shard:5},['ember']),foe());expect(b.frames[1].events[0].critical).toBe(true);expect(b.frames[1].damageEvents?.[0].amount).toBe(Math.round(Math.round(60*1.2)*1.5));
});
it('Conch grants capped bonus on Water spell mana gains, without proccing from item mana',()=>{
 const b=simulate(p({conch_shell:20,blue_coral:3},['splash','splash'],{mana:0}),foe());expect(b.frames[1].player.mana).toBe(18);expect(b.frames[2].player.mana).toBe(33);
 const n=simulate(p({conch_shell:20},['photosynthesis'],{mana:0}),foe());expect(n.frames[2].player.mana).toBe(15);
});
it('Arcane Battery restores after a skip but never retries that card in the same tick',()=>{
 const b=simulate(p({arcane_battery:3},['ember','ember'],{mana:0}),foe());expect(b.frames[1].player.mana).toBe(9);expect(b.frames[1].events[0].status).toBe('skipped');expect(b.frames[2].player.mana).toBe(4);
});
it('Clockwork restores once at shuffle start; Quill and Stone trigger after it completes',()=>{
 const b=simulate(p({clockwork_spring:2,scholars_quill:3,restoration_stone:2},['wrath'],{mana:0,health:100,penanceQueued:3}),foe());
 expect(b.frames[1].player.mana).toBe(6);expect(b.frames[5].player.mana).toBe(6);expect(b.frames[6].player.mana).toBe(12);expect(b.frames[6].player.health).toBe(110);
});
it('Chapel Bell only damages during the appended Penance ticks',()=>{
 const a=p({chapel_bell:3},['splash']),b={...foe(),penanceQueued:3};const battle=simulate(a,b);
 expect(battle.frames[1].bot.health).toBe(b.health);expect(battle.frames[3].bot.health).toBe(b.health);expect(battle.frames[4].bot.health).toBe(b.health-6);expect(battle.frames[6].bot.health).toBe(b.health-18);expect(battle.frames[7].bot.health).toBe(b.health-18);
});
it('Censer applies once per cycle with its own cap; Reliquary copies remain uncapped',()=>{
 const b=simulate(p({small_censer:20,sacred_reliquary:6},['holy_smite','holy_smite']),foe());expect(b.frames[1].bot.penanceActive).toBe(2);expect(b.frames[2].bot.penanceQueued).toBe(0);expect(b.frames[5].bot.penanceQueued).toBe(2); // Enemy has entered its shuffle between these casts.
});
it('Golden Chain caps each Slowness application and Battle Rosary heals per Guard grant',()=>{
 const b=simulate(p({golden_chain:20,battle_rosary:3},['holy_rebuke','holy_aegis'],{health:100}),foe());expect(b.frames[1].bot.statuses.consecration).toBe(3);expect(b.frames[2].player.health).toBe(106);
});
it('Templar Seal heals on successful Oaths only',()=>{
 const b=simulate(p({templar_seal:4},['holy_oath_of_patience','wrath','wrath','wrath'],{health:100}),foe());expect(b.frames[4].player.health).toBe(120);
 const failed=simulate(p({templar_seal:4},['holy_oath_of_patience','holy_prayer'],{health:100}),foe());expect(failed.frames[2].player.health).toBe(125);
});
it('Guard healing triggers at most once per tick even across DoTs and direct hits',()=>{
 const b=simulate(p({incense_burner:2},['splash'],{health:100,statuses:{guard:5,moonfire:5,sunfire:5}}),fighter('B',['wrath']));expect(b.frames[1].player.health).toBe(110);expect(b.frames[2].player.health).toBe(120);
});
it('mirrors do not trigger from self damage, DoTs or reflected hits and cannot loop',()=>{
 const a=p({mirror_shard:3,rusted_mirror:2},['wrath']),b=p({mirror_shard:3},['wrath']);b.name='B';const f=simulate(a,b).frames[1];expect(f.player.health).toBe(474);expect(f.bot.health).toBe(470);
 const dots=simulate(p({mirror_shard:100},['splash'],{statuses:{moonfire:3}}),foe());expect(dots.frames[1].bot.health).toBe(foe().health);
});
it('Ancient Bark caps reduction at 30% while a HoT is active; Stone only reduces the first hit of a cycle',()=>{
 const b=simulate(p({ancient_bark:99,stone_charm:1},['photosynthesis'],{statuses:{growth:5}}),fighter('B',['wrath','wrath']));expect(b.frames[1].player.health).toBe(492);expect(b.frames[2].player.health).toBe(486);
});
it('Ward absorbs damage and Guard prevents damage without spending Ward',()=>{
 const a=p({},['splash'],{shield:30,statuses:{guard:2}});const b=simulate(a,fighter('B',['wrath','wrath']));expect(b.frames[1].player.shield).toBe(30);expect(b.frames[2].player.shield).toBe(10);
});

it('conditional damage buckets use strict health thresholds and full missing-health intervals',()=>{
 const a=p({blood_vial:2,bloodstone:1,hematite_charm:2,smouldering_coal:1,ember_vial:1},['ember'],{health:149,statuses:{hotstreak:1}});
 // Normal resolution has aged Hotstreak away: 6+6+14+4 = 30%.
 expect(simulate(a,foe()).frames[1].damageEvents?.[0].amount).toBe(78);
 const atHalf=p({blood_vial:10},['wrath'],{health:250});expect(simulate(atHalf,foe()).frames[1].damageEvents?.[0].amount).toBe(20);
});
it('Burn and Starfall specific bonuses add to generic DoT bonuses',()=>{
 const a=p({charcoal_heart:10,star_fragment:5,thorn_seed:10},['splash']);const b=foe();b.statuses={burn:3,starfall:3};b.statusSources={burn:'player',starfall:'player'};
 expect(simulate(a,b).frames[1].damageEvents?.filter(e=>e.side==='bot').map(e=>e.amount)).toEqual([45,75]);
});
it('Tide Charm adds to Water damage for Tidecaller cards even if no repeat occurs',()=>{
 const b=simulate(p({tide_charm:10,tideglass:10},['tidal-burst']),foe());expect(b.frames[2].damageEvents?.[0].amount).toBe(128);expect(b.frames[2].events[0].repeats).toBe(1);
});
it('consuming DoTs includes flat and direct item bonuses in one additive bucket',()=>{
 const a=p({moonstone_chip:2,thorn_seed:10,arcane_splinter:10},['eclipse']),b=foe();b.statuses.moonfire=3;b.statusSources={moonfire:'player'};
 const f=simulate(a,b).frames[1];expect(f.damageEvents?.filter(e=>e.side==='bot').map(e=>e.amount)).toEqual([16,36]); // 1 DoT tick, then 2 remaining ticks ×12×1.5.
});
it('reflects once per tick even when a Tidecaller card hits twice',()=>{
 let found=false;for(let seed=1;seed<100;seed++){
  const a=p({mirror_shard:5},['splash']);const b=fighter('B',['tidal-burst']);b.statuses.tide=20;
  const f=simulate(a,b,seed).frames[2];if(f.events.some(e=>e.side==='bot'&&e.repeats===2)){expect(f.damageEvents?.filter(e=>e.side==='bot').map(e=>e.amount)).toEqual([10]);found=true;break;}
 }expect(found).toBe(true);
});

