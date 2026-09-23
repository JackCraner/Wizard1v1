import {expect,it} from 'vitest';
import {fighter,simulate} from './engine';
import {continuousCombatFrame} from './playback';

it('presents two complete animated reshuffle ticks before casting the next cycle',()=>{
 const battle=simulate(fighter('A',['wrath','wrath']),fighter('B',['riptide']));
 const shuffle=continuousCombatFrame(battle,2);
 expect(shuffle.player.reshuffleRemaining).toBe(2);
 expect(shuffle.player.casting).toBeNull();
 expect(shuffle.player.cycle).toBe(1);
 expect(battle.frames[3].events.filter(e=>e.side==='player')).toHaveLength(0);
 expect(battle.frames[4].events.filter(e=>e.side==='player')).toHaveLength(0);
 expect(continuousCombatFrame(battle,3).player.reshuffleRemaining).toBe(1);
 const resumed=continuousCombatFrame(battle,4);
 expect(resumed.player.reshuffleRemaining).toBe(0);
 expect(resumed.player.casting?.spell).toBe('wrath');
 expect(resumed.player.cycle).toBe(2);
 expect(battle.frames[5].events.filter(e=>e.side==='player')).toHaveLength(1);
 // Each fighter shuffles independently; single-card opponents pause earlier.
 expect(continuousCombatFrame(battle,1).bot.reshuffleRemaining).toBe(2);
});
it('preserves Reckless Loop as the explicit paid exception to the pause',()=>{
 const battle=simulate(fighter('A',['wrath'],['reckless-loop']),fighter('B',['riptide']));
 expect(continuousCombatFrame(battle,1).player.reshuffleRemaining).toBe(0);
 expect(continuousCombatFrame(battle,1).player.casting?.spell).toBe('wrath');
 expect(battle.frames[1].player.health).toBe(475);
 expect(battle.frames[2].events.some(e=>e.side==='player')).toBe(true);
});
