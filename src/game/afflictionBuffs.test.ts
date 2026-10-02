import { expect, it } from 'vitest';
import { fighter, simulate } from './engine';

it.each([0, 3])('Dual Hex retains self-Poison while improving enemy pressure at XP %i', xp => {
    const a = fighter('A', ['dual-hex'], [], [xp]);
    const b = fighter('B', ['healing-seed']);
    const frame = simulate(a, b).frames[1];
    expect(frame.player.statuses.poison).toBe(3);
    expect(frame.bot.statuses.poison).toBe(xp ? 6 : 5);
    expect(frame.bot.statuses.curse ?? 0).toBe(xp ? 2 : 0);
    const reversed = simulate(b, a).frames[1];
    expect(reversed.bot.statuses).toEqual(frame.player.statuses);
    expect(reversed.player.statuses).toEqual(frame.bot.statuses);
});

it.each([0, 3])('Nightmare cashes out the remaining Poison after two periodic ticks at XP %i', xp => {
    const a = fighter('A', ['nightmare'], [], [xp]), b = fighter('B', ['healing-seed']);
    b.statuses.poison = 5;
    const frame = simulate(a, b).frames[2];
    expect(frame.bot.statuses.poison ?? 0).toBe(0);
    expect(frame.damageEvents?.filter(e => e.sourceSide === 'player' && e.sourceIndex === 0).reduce((n, e) => n + e.amount, 0)).toBe(3 * (xp ? 20 : 16));
});

it.each([0, 3])('Bloodletting keeps its Health cost and Ritual grows an existing Imp at XP %i', xp => {
    const b = fighter('B', ['healing-seed']);
    const f = simulate(fighter('A', ['bloodletting'], [], [xp]), b).frames[1];
    expect(f.player.health).toBe(490);
    expect(f.bot.health).toBe(500 - (xp ? 80 : 60));
    const summoner = fighter('A', ['ritual'], [], [xp]);
    summoner.imp = { health: 10, maxHealth: 20, guard: 0 };
    const imp = simulate(summoner, b).frames[2].player.imp!;
    expect(imp.health).toBe(10 + (xp ? 120 : 90));
    expect(imp.maxHealth).toBe(20 + (xp ? 120 : 90));
});

it.each([0, 3])('Corrupt Ward rewards breaking Ward once, then its Echo deals baseline damage at XP %i', xp => {
    const a = fighter('A', ['corrupt-ward'], [], [xp]), b = fighter('B', ['healing-seed']);
    // Instant upgraded casts cannot reserve Tide; the base spell can.
    if (!xp) a.statuses.tide = 3;
    b.shield = 200;
    b.imp = { health: 20, maxHealth: 20, guard: 0 };
    const frame = simulate(a, b).frames[1];
    expect(frame.bot.shield).toBe(0);
    expect(frame.bot.imp?.health).toBe(0);
    const damage = frame.damageEvents?.filter(e => e.sourceSide === 'player' && e.sourceIndex === 0).reduce((n, e) => n + e.amount, 0);
    expect(damage).toBe(xp ? 140 : 130);
    expect(frame.player.broken).toContain(0);
});

it('Corrupt Ward keeps useful baseline damage without Ward or Affliction attunement', () => {
    const a = fighter('A', ['corrupt-ward'], [], [3]);
    a.attuned = [];
    const b = fighter('B', ['healing-seed']);
    b.shield = 100;
    const frame = simulate(a, b).frames[1];
    expect(frame.damageEvents?.filter(e => e.sourceSide === 'player').reduce((n, e) => n + e.amount, 0)).toBe(80);
    b.shield = 0;
    expect(simulate(a, b).frames[1].damageEvents?.filter(e => e.sourceSide === 'player').reduce((n, e) => n + e.amount, 0)).toBe(80);
});
