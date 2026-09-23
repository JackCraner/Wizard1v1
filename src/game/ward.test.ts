import {expect,it} from 'vitest';
import {fighter,simulate} from './engine';
it.each([false,true])('50 damage lands before a simultaneous 50 Ward grant (swap=%s)',swap=>{
 const defender=fighter('Defender',['barkskin']),attacker=fighter('Attacker',['undercurrent']);
 const frame=simulate(...(swap?[attacker,defender]:[defender,attacker]) as [typeof defender,typeof attacker]).frames[1];
 expect(frame[swap?'bot':'player']).toMatchObject({health:450,shield:50,wardCapacity:50});
});
it('healing saves the caster before damage, then fresh Ward is granted',()=>{
 const player=fighter('A',['blessing'],[],[3]);player.health=30;
 expect(simulate(player,fighter('B',['undercurrent'])).frames[1].player).toMatchObject({health:10,shield:50,wardCapacity:50});
});
it('old Ward absorbs damage before the new grant replaces it',()=>{
 const player=fighter('A',['barkskin']);player.shield=20;player.wardCapacity=100;
 expect(simulate(player,fighter('B',['undercurrent'])).frames[1].player).toMatchObject({health:470,shield:50,wardCapacity:50});
});
it('pending Ward cannot save a caster from lethal damage',()=>{
 const player=fighter('A',['barkskin']);player.health=50;
 expect(simulate(player,fighter('B',['undercurrent'])).frames[1].player).toMatchObject({health:0,shield:0});
});
it('a 40 Ward grant replaces the remaining 20 of a 100 Ward shield',()=>{
 const player=fighter('A',['healing-seed'],['tough-skin']);
 player.shield=20;player.wardCapacity=100;player.statuses.guard=1;
 const frame=simulate(player,fighter('B',['char'])).frames[1];
 expect(frame.player).toMatchObject({shield:40,wardCapacity:40,health:500});
});
it('new Ward arrives after simultaneous direct damage',()=>{const a=fighter('A',['barkskin']);const r=simulate(a,fighter('B',['char'])).frames[1];expect(r.player).toMatchObject({shield:50,wardCapacity:50,health:465});expect(r.damageEvents?.filter(e=>e.side==='player')).toMatchObject([{target:'wizard',amount:35}]);});
it('direct damage overflows Ward, but poison damage bypasses it',()=>{const a=fighter('A',['healing-seed']);a.shield=40;const r=simulate(a,fighter('B',['penance'])).frames[1];expect(r.player.health).toBe(480);expect(r.damageEvents?.filter(e=>e.side==='player')).toMatchObject([{target:'ward',amount:40},{target:'wizard',amount:20}]);const b=fighter('A',['aegis']);b.shield=40;b.statuses.poison=1;const q=simulate(b,fighter('B',['healing-seed'])).frames[1];expect(q.player.health).toBe(490);expect(q.damageEvents?.filter(e=>e.side==='player')).toMatchObject([{kind:'dot',target:'wizard',amount:10}]);});
it('fresh Ward capacity equals its granted value; weaker grants never stack',()=>{const a=fighter('A',['barkskin']);a.shield=10;a.wardCapacity=75;expect(simulate(a,fighter('B',['healing-seed'])).frames[1].player).toMatchObject({shield:50,wardCapacity:50});a.shield=60;expect(simulate(a,fighter('B',['healing-seed'])).frames[1].player).toMatchObject({shield:60,wardCapacity:75});});
