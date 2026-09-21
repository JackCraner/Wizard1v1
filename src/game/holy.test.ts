import {describe,it,expect} from 'vitest';
import {fighter,simulate,SPELLS,validateDeck} from './engine';
import {CARDS,KEYWORDS} from '../config/catalogue';
import {cardAt} from './upgrades';
import {offersFor} from './shop';
import type {Fighter} from './model';

const idle=()=>fighter('Opponent',Array(10).fill('photosynthesis'));
const run=(deck:string[],opponent=idle(),setup:Partial<Fighter>={})=>simulate({...fighter('You',deck),...setup},opponent);
const frame=(deck:string[],tick:number,setup:Partial<Fighter>={},opponent=idle())=>run(deck,opponent,setup).frames[tick];
describe('Holy catalogue and integration',()=>{
 it('makes all 27 supplied spells playable with literal upgraded costs and Unique finishers',()=>{
  const cards=CARDS.filter(c=>c.domain==='holy');expect(cards).toHaveLength(27);
  expect([1,2,3,4,5].map(n=>cards.filter(c=>c.stars===n).length)).toEqual([6,6,6,6,3]);
  for(const c of cards){expect(c.combat?.blockedReason).toBeUndefined();expect(SPELLS[c.id].price).toBe(c.stars);expect(cardAt(c.id,3).mana).toBe(Math.floor(Number(c.mana)*.8));expect(c.notes).toEqual([]);c.keywords.forEach(k=>expect(KEYWORDS[k]).toBeDefined());expect(()=>validateDeck([c.id])).not.toThrow();}
  expect(()=>validateDeck(['holy_citadel','holy_citadel'])).toThrow('Unique');
  expect(()=>validateDeck(['holy_smite','wrath','ember'])).toThrow('2 domains');
 });
 it('offers Holy at the right rank alongside the existing domains',()=>{
  for(let roll=0;roll<30;roll++){
   const offers=offersFor(1,roll).shop.map(id=>SPELLS[id]);expect(offers.some(c=>c.domain==='holy')).toBe(true);expect(offers.every(c=>c.stars===1)).toBe(true);
   expect(offersFor(8,roll,['holy_smite','splash']).shop.every(id=>['holy','water'].includes(SPELLS[id].domain))).toBe(true);
  }
 });
});
describe('Consecration and uncapped Penance',()=>{
 it('persists partial stacks instead of counting them down',()=>{
  const b=run(['holy_consecrate',...Array(9).fill('photosynthesis')]);
  expect(b.frames[1].bot.statuses.consecration).toBe(2);expect(b.frames[8].bot.statuses.consecration).toBe(2);
 });
 it('consumes every five stacks without a cap and applies them to a simultaneous reshuffle on either side',()=>{
  const a={...fighter('A',['holy_smite']),statuses:{consecration:23}};const b=fighter('B',['holy_consecrate']);
  const first=simulate(a,b).frames[1];expect(first.player.reshuffleRemaining).toBe(7);expect(first.player.penanceActive).toBe(5);expect(first.player.statuses.consecration).toBeUndefined();
  const reverse=simulate(b,a).frames[1];expect(reverse.bot.reshuffleRemaining).toBe(7);expect(reverse.bot.penanceActive).toBe(5);
 });
 it('keeps effects and damage running during Penance and resumes after all extra ticks',()=>{
  const b=run(['holy_smite'],idle(),{penanceQueued:4,statuses:{moonfire:20}});
  expect(b.frames[1].player.reshuffleRemaining).toBe(6);
  for(let tick=2;tick<=7;tick++){expect(b.frames[tick].player.health).toBe(500-tick*10);expect(b.frames[tick].events.filter(e=>e.side==='player')).toHaveLength(0);}
  expect(b.frames[8].events.some(e=>e.side==='player'&&e.status==='cast')).toBe(true);
 });
 it('banks Penance gained during an existing reshuffle for the following shuffle',()=>{
  const target={...fighter('You',['holy_smite']),reshuffleRemaining:4};const enemy={...fighter('Enemy',['holy_condemn']),mana:1000,maxMana:1000};
  const b=simulate(target,enemy);expect(b.frames[2].player.reshuffleRemaining).toBe(2);expect(b.frames[2].player.penanceQueued).toBe(1);expect(b.frames[5].player.penanceActive).toBe(1);expect(b.frames[5].player.reshuffleRemaining).toBe(3);
 });
 it('cleanses unconverted Consecration but preserves queued Penance',()=>{
  const f=frame(['holy_purify','photosynthesis'],1,{statuses:{consecration:4},penanceQueued:2});expect(f.player.statuses.consecration).toBeUndefined();expect(f.player.penanceQueued).toBe(2);
 });
});
describe('Oaths',()=>{
 it('does not count its own Instant cast and rewards three completed non-Instant cards',()=>{
  const b=run(['holy_oath_of_patience','wrath','wrath','wrath']);
  expect(b.frames[1].player.oath?.remaining).toBe(3);expect(b.frames[3].player.oath?.remaining).toBe(1);expect(b.frames[4].player.oath).toBeUndefined();expect(b.frames[4].player.statuses.guard).toBe(2);
 });
 it('breaks Patience when the next card is actually Instant',()=>{
  const b=run(['holy_oath_of_patience','holy_prayer']);expect(b.frames[2].player.oath).toBeUndefined();expect(b.frames[2].notices?.some(n=>n.text.includes('broken'))).toBe(true);expect(b.frames[2].player.statuses.guard).toBeUndefined();
 });
 it('counts a Tidecaller repeated card only once',()=>{
  let doubled=false;
  for(let seed=1;seed<100;seed++){
   const a=fighter('You',['holy_oath_of_patience','tidal-burst','tidal-burst','tidal-burst']);a.statuses.tide=100;
   const b=simulate(a,idle(),seed);const cast=b.frames.find(f=>f.events.some(e=>e.side==='player'&&e.spell==='tidal-burst'))!;
   if(cast.events.some(e=>e.side==='player'&&e.repeats===2)){expect(cast.player.oath?.remaining).toBe(2);doubled=true;break;}
  }
  expect(doubled).toBe(true);
 });
 it('rewards Mercy after three harmless completed cards',()=>{
  const b=run(['holy_oath_of_mercy','holy_prayer','holy_prayer','holy_prayer'],idle(),{health:100});const f=b.frames[4];
  expect(f.player.health).toBe(255);expect(f.player.oath).toBeUndefined();expect(f.bot.statuses.consecration).toBe(3);
 });
 it('breaks Mercy on actual direct damage before awarding the final completion',()=>{
  const f=frame(['holy_oath_of_mercy','holy_prayer','holy_prayer','holy_smite'],4,{health:100});expect(f.player.health).toBe(150);expect(f.player.oath).toBeUndefined();expect(f.bot.statuses.consecration).toBeUndefined();
 });
 it('allows DoTs and fully absorbed damage while Mercy is active',()=>{
  const enemy=idle();enemy.shield=1000;
  const b=run(['holy_oath_of_mercy','moonfire','wrath','wrath'],enemy,{health:100});expect(b.frames[4].player.health).toBe(180);expect(b.frames[4].notices?.some(n=>n.text.includes('fulfilled'))).toBe(true);
 });
 it('replaces the previous Oath rather than combining rewards',()=>{
  const b=run(['holy_oath_of_patience','holy_oath_of_mercy','holy_prayer']);expect(b.frames[2].player.oath?.id).toBe('mercy');expect(b.frames[2].player.oath?.remaining).toBe(3);
 });
 it('rewards Resolve at reshuffle start and breaks on insufficient mana',()=>{
  const a=frame(['holy_oath_of_resolve','holy_smite'],2);expect(a.player.statuses.guard).toBe(3);expect(a.bot.penanceQueued).toBe(1);expect(a.player.oath).toBeUndefined();
  const b=frame(['holy_oath_of_resolve','holy_smite'],2,{mana:35});expect(b.player.statuses.guard).toBeUndefined();expect(b.player.oath).toBeUndefined();expect(b.notices?.some(n=>n.text.includes('insufficient mana'))).toBe(true);
 });
 it('Salvation grants its reward at the next reshuffle and fails on damage',()=>{
  const success=frame(['holy_oath_of_salvation','holy_prayer'],2,{health:100});expect(success.player.health).toBe(275);expect(success.player.statuses.guard).toBe(3);expect(success.bot.penanceQueued).toBe(2);
  const failure=frame(['holy_oath_of_salvation','holy_smite'],2,{health:100});expect(failure.player.health).toBe(100);expect(failure.player.statuses.guard).toBeUndefined();
 });
 it('does not count an interrupted card as a completed Oath card',()=>{
  const a={...fighter('You',['holy_oath_of_patience','seed-shot','wrath']),mana:100};
  // An already-running cast can be interrupted before it completes.
  a.oath={id:'patience',remaining:3,requirement:'nonInstant',rewards:[{kind:'status',status:'guard',amount:2}]};
  a.spells=['seed-shot','wrath'];a.spellXp=[0,0];
  const interrupter=fighter('Enemy',['holy_intercession']);a.casting={spell:'seed-shot',index:0,remaining:2,totalTicks:2,mana:5,tidecaller:false};
  const f=simulate(a,interrupter).frames[1];expect(f.player.oath?.remaining).toBe(3);expect(f.player.cursor).toBe(1);
 });
});
describe('Holy spell effects',()=>{
 it('Judgment adds Consecration only while an opposing cast is still in progress',()=>{
  const a=frame(['holy_judgment'],1);expect(a.bot.statuses.consecration).toBe(1);expect(a.bot.health).toBe(445);
  const b=frame(['holy_judgment'],1,{},fighter('Enemy',['holy_smite']));expect(b.bot.statuses.consecration).toBeUndefined();
 });
 it('Intercession falls back to Guard when no cast can be interrupted',()=>{
  const f=frame(['holy_intercession'],1);expect(f.notices?.some(n=>n.status==='interrupt')).toBe(false);expect(f.events.find(e=>e.side==='player')?.details).toContain('No spell interrupted.');
  // Its single Guard stack is available during the Instant/DoT phase.
  const protectedFrame=frame(['holy_intercession'],1,{statuses:{moonfire:3}});expect(protectedFrame.player.health).toBe(500);
 });
 it('Inquisition interrupts ongoing casts and applies Consecration only on success',()=>{
  const a=frame(['holy_inquisition'],2,{},fighter('Enemy',Array(10).fill('pyroblast')));expect(a.bot.penanceQueued).toBe(1);expect(a.events.some(e=>e.side==='bot'&&e.status==='skipped')).toBe(true);
  const b=frame(['holy_inquisition'],2,{},fighter('Enemy',['holy_smite']));expect(b.bot.penanceQueued??0).toBe(0);
 });
 it('Divine Intervention uses the strict current-health threshold without stacking both rewards',()=>{
  expect(frame(['holy_divine_intervention'],1,{health:149}).player.statuses.guard).toBe(4);
  expect(frame(['holy_divine_intervention'],1,{health:150}).player.statuses.guard).toBe(2);
 });
 it('Exorcism counts removed effects rather than stacks and caps its base healing',()=>{
  const f=frame(['holy_exorcism'],2,{health:1500,maxHealth:2000,statuses:{moonfire:20,sunfire:20,burn:20,consecration:4,trap:20}});
  expect(f.player.statuses).toEqual({});expect(f.healingEvents?.filter(e=>e.side==='player')).toEqual([{side:'player',amount:100,kind:'heal'}]);
 });
 it('Templar stance reduces incoming damage and its own direct damage',()=>{
  const f=frame(['holy_smite'],1,{statuses:{'templars-oath':5}},fighter('Enemy',['holy_smite']));expect(f.player.health).toBe(472);expect(f.bot.health).toBe(468);
 });
 it('Sanctuary reduces damage and increases healing received',()=>{
  const f=frame(['holy_prayer'],1,{health:100,statuses:{sanctuary:5}},fighter('Enemy',['holy_smite']));expect(f.player.health).toBe(110); // +31 healing, -21 damage
 });
 it('Retribution triggers on direct Health damage, once a tick, without feedback loops',()=>{
  const enemy={...fighter('Enemy',['holy_smite']),statuses:{retribution:5}};
  const f=frame(['holy_smite'],1,{statuses:{retribution:5}},enemy);expect(f.player.health).toBe(450);expect(f.bot.health).toBe(450);
  const warded=frame(['holy_smite'],1,{shield:100,statuses:{retribution:5}},fighter('Enemy',['holy_smite']));expect(warded.bot.health).toBe(465);
 });
 it('Citadel retaliates with Consecration only after direct HP damage',()=>{
  const f=frame(['photosynthesis'],1,{statuses:{citadel:5}},fighter('Enemy',['holy_smite']));expect(f.player.health).toBe(475);expect(f.bot.statuses.consecration).toBe(1);
  const g=frame(['photosynthesis'],1,{statuses:{citadel:5,guard:5}},fighter('Enemy',['holy_smite']));expect(g.bot.statuses.consecration).toBeUndefined();
 });
 it('Holy Ground heals per tick and triggers only when a new opposing cast starts',()=>{
  const b=run(['holy_holy_ground','photosynthesis'],fighter('Enemy',Array(10).fill('photosynthesis')),{health:100});
  expect(b.frames[3].player.health).toBe(115);expect(b.frames[3].bot.statuses.consecration).toBe(1);expect(b.frames[4].bot.statuses.consecration).toBe(1);expect(b.frames[5].bot.statuses.consecration).toBe(2);
 });
 it('Divine Decree applies its debuffs even when interrupt fails',()=>{
  const f=frame(['holy_divine_decree'],2,{},fighter('Enemy',['holy_smite']));expect(f.bot.statuses.slowness).toBe(2);expect(f.bot.penanceQueued).toBe(2);
 });
});

