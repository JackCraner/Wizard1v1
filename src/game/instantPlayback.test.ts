import {expect,it} from 'vitest';
import {fighter,simulate} from './engine';
import {continuousCombatFrame} from './playback';

it('shows a complete 1T Instant cast before its healing resolves',()=>{
 const player=fighter('A',['holy-light']);player.health=100;
 const battle=simulate(player,fighter('B',['healing-seed']));
 const start=continuousCombatFrame(battle,0);
 expect(start.player.casting).toMatchObject({spell:'holy-light',instant:true,totalTicks:1,remaining:1});
 expect(start.player.health).toBe(100);
 expect(start.healingEvents).toHaveLength(0);
 expect(battle.frames[1].player.health).toBe(180);
 expect(continuousCombatFrame(battle,1).healingEvents).toContainEqual(expect.objectContaining({side:'player',amount:80}));
});

it.each([false,true])('Instant damage beats ordinary healing without losing its cast window (swap=%s)',swap=>{
 const attacker=fighter('A',['firefury']);attacker.memory.previousHeat=true;
 const defender=fighter('B',['healing-seed']);defender.health=40;
 const battle=simulate(...(swap?[defender,attacker]:[attacker,defender]) as [typeof attacker,typeof defender]);
 expect(continuousCombatFrame(battle,0)[swap?'bot':'player'].casting).toMatchObject({instant:true,totalTicks:1,remaining:1});
 expect(battle.frames[1][swap?'player':'bot'].health).toBe(0);
 expect(battle.frames[1].healingEvents).toHaveLength(0);
});
