import { describe, expect, it } from 'vitest';
import { criticalDamage, deriveStats, fighter, PLAYABLE_SPELLS, RULES, simulate, SPELLS } from './engine';
import { CARDS } from '../config/catalogue';

describe('catalogue combat rules',()=>{
  it('uses only catalogue spells and the requested base stats',()=>{
    expect(deriveStats()).toEqual({health:500,mana:100});
    expect(deriveStats([{health:15,mana:5}])).toEqual({health:515,mana:105});
    expect(Object.keys(SPELLS)).toEqual(CARDS.map(c=>c.id));
    expect(PLAYABLE_SPELLS.every(id=>CARDS.some(c=>c.id===id))).toBe(true);
    expect(()=>fighter('A',['fireball'])).toThrow('unavailable');
    expect(()=>fighter('A',['immolate'])).not.toThrow();
  });
  it('takes the configured ticks to cast and pays mana exactly once at the start',()=>{
    const result=simulate(fighter('A',['seed-shot','wrath']),fighter('B',['splash']));
    expect(result.frames[1].player.mana).toBe(95);
    expect(result.frames[1].player.casting?.remaining).toBe(1);
    expect(result.frames[1].bot.health).toBe(500);
    expect(result.frames[1].events.filter(e=>e.side==='player')).toHaveLength(0);
    expect(result.frames[2].bot.health).toBe(430);
    expect(result.frames[2].player.mana).toBe(95);
    expect(result.frames[3].bot.health).toBe(410);
  });
  it('counts down fresh Moonfire from 5 through 1, dealing exactly five periodic hits',()=>{
    const result=simulate(fighter('A',['moonfire','pyroblast']),fighter('B',['splash']));
    expect(result.frames.slice(1,7).map(f=>f.bot.statuses.moonfire??0)).toEqual([5,4,3,2,1,0]);
    expect(result.frames[1].bot.health).toBe(500);
    expect(result.frames[2].bot.health).toBe(490);
    expect(result.frames[6].bot.health).toBe(250); // 5 × 10 DoT + Pyroblast 200
  });
  it('ages every existing effect, including during multi-tick casts',()=>{
    const player=fighter('A',['pyroblast']);player.health=300;player.statuses={growth:3,rain:2,tide:1};
    const result=simulate(player,fighter('B',['splash']));
    expect(result.frames[1].player.statuses).toEqual({growth:2,rain:1});
    expect(result.frames[2].player.statuses).toEqual({growth:1});
    expect(result.frames[3].player.statuses).toEqual({});
    expect(result.frames[3].player.health).toBe(330);
    expect(result.frames[3].player.casting?.remaining).toBe(2);
  });
  it('adds reapplied duration while still aging the previous effect once',()=>{
    const result=simulate(fighter('A',['moonfire','moonfire']),fighter('B',['splash']));
    expect(result.frames[2].bot.statuses.moonfire).toBe(9);
    expect(result.frames[2].bot.health).toBe(490);
  });
  it('uses 150% critical damage for conditional critical hits',()=>{
    expect(criticalDamage(80)).toBe(120);
    const result=simulate(fighter('A',['moonfire','lunar-strike']),fighter('B',['splash']));
    expect(result.frames[3].events.find(e=>e.side==='player')?.critical).toBe(true);
    expect(result.frames[3].bot.health).toBe(405); // two Moonfire ticks and 75 damage
  });
  it('ends at 50 ticks and compares actual health; equal totals draw',()=>{
    const p=fighter('A',['splash']),b=fighter('B',['splash']);p.health=400;b.health=300;
    const result=simulate(p,b);
    expect(result.frames).toHaveLength(51);expect(result.frames.at(-1)?.tick).toBe(50);
    expect(result.outcome).toBe('victory');expect(result.endReason).toBe('timeout');
    expect(simulate(b,p).outcome).toBe('defeat');
    expect(simulate(p,p).outcome).toBe('draw');
  });
  it('resolves simultaneous knockouts as draws, including lethal periodic effects',()=>{
    const a=fighter('A',['wrath']),b=fighter('B',['wrath']);a.health=40;b.health=40;
    const result=simulate(a,b);
    expect(result.frames.at(-1)?.tick).toBe(4);expect(result.outcome).toBe('draw');
    const p=fighter('A',['wrath']);p.health=10;p.statuses.moonfire=1;
    const dots=simulate(p,p);expect(dots.outcome).toBe('draw');expect(dots.frames[1].events).toHaveLength(0);
  });
  it('allows only one Instant per fighter per tick',()=>{
    const result=simulate(fighter('A',['mist','rejuvenation']),fighter('B',['splash']));
    expect(result.frames[1].events.filter(e=>e.side==='player').map(e=>e.spell)).toEqual(['mist']);
    expect(result.frames.length).toBeLessThanOrEqual(RULES.maxTicks+1);
    const next=simulate(fighter('A',['conflagrate','seed-shot','wrath']),fighter('B',['splash']));
    expect(next.frames[2].events.filter(e=>e.side==='player').map(e=>e.spell)).toEqual(['seed-shot']);
  });
  it('skips unaffordable casts, caps resources, and remains deterministic without mutation',()=>{
    const p=fighter('A',['pyroblast','wrath']);p.mana=5;
    const b=fighter('B',['regrowth','splash']);const before=structuredClone(p);
    const result=simulate(p,b);
    expect(result.frames[1].events[0].status).toBe('skipped');
    expect(result.frames[2].events.find(e=>e.side==='player')?.spell).toBe('wrath');
    expect(result.frames.every(f=>[f.player,f.bot].every(x=>x.mana>=0&&x.mana<=x.maxMana&&x.health>=0&&x.health<=x.maxHealth))).toBe(true);
    expect(simulate(p,b)).toEqual(result);expect(p).toEqual(before);
  });
});

it('resolves simultaneous mana steals without player-order bias',()=>{
  const result=simulate(fighter('A',['aqua-steal']),fighter('B',['aqua-steal']));
  expect(result.frames[2].player.mana).toBe(95);expect(result.frames[2].bot.mana).toBe(95);
});
it('snapshots conditional crits before a simultaneous cleanse',()=>{
  const c=fighter('Cleanser',['cleanse']);c.statuses.moonfire=3;
  const a=fighter('Caster',['lunar-strike']);a.casting={spell:'lunar-strike',index:0,remaining:1,mana:5,tidecaller:false};
  const first=simulate(c,a),second=simulate(a,c);
  expect(first.frames[1].events.find(e=>e.side==='bot')?.critical).toBe(true);
  expect(second.frames[1].events.find(e=>e.side==='player')?.critical).toBe(true);
  expect(first.frames[1].player.health).toBe(second.frames[1].bot.health);
});

it('uses 200% total crit damage during Overheat, then returns to 150%',()=>{
 const a=fighter('A',['lunar-strike','lunar-strike']);a.statuses.overheat=3;
 const b=fighter('B',['splash']);b.statuses.moonfire=10;
 const result=simulate(a,b);
 expect(result.frames[2].bot.health).toBe(380); // 20 periodic + 100 critical
 expect(result.frames[3].player.statuses.overheat).toBeUndefined();
 expect(result.frames[4].bot.health).toBe(285); // 20 periodic + 75 critical
});
