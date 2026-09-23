import {expect,it} from 'vitest';
import {fighter,simulate} from './engine';
import {continuousCombatFrame} from './playback';
it('presents one full reshuffle tick with no cast before the next cycle',()=>{const r=simulate(fighter('A',['spark']),fighter('B',['healing-seed']));expect(continuousCombatFrame(r,1).player.reshuffleRemaining).toBe(1);expect(r.frames[2].events.filter(e=>e.side==='player')).toHaveLength(0);expect(r.frames[3].events.some(e=>e.side==='player')).toBe(true);});
it('Reckless Loop still pays to skip the normal pause',()=>{const r=simulate(fighter('A',['spark'],['reckless-loop']),fighter('B',['healing-seed']));expect(r.frames[1].player.health).toBe(475);expect(r.frames[2].events.some(e=>e.side==='player')).toBe(true);});
