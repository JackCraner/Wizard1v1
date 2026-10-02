import {expect,it} from 'vitest';
import {fighter,simulate} from './engine';
import type {Fighter} from './model';
const idle=()=>({...fighter('Idle',['germination']),broken:[0]});
const prepared=(deck:string[],augments:string[])=>{const a=fighter('A',deck,augments);a.health=500;a.maxHealth=10000;a.memory.cards=Object.fromEntries(deck.map((_,i)=>[i,{armed:true}]));return a;};
const trio=['resonance','rising-tide','reactive-barrier'];
it.each([false,true])('Resonance boosts only Trigger payloads, with rounding and Imp interception (swap=%s)',swap=>{
 const a=prepared(['healing-seed','backdraft','aegis'],['resonance']),b=idle();
 b.imp={health:100,maxHealth:100,guard:0};
 const result=simulate(...(swap?[b,a]:[a,b]) as [Fighter,Fighter]);
 const side=swap?'bot':'player',enemy=swap?'player':'bot',f=result.frames[1];
 expect(f[enemy].imp?.health).toBe(85);
 expect(f[side].health).toBe(531); // ordinary heal 25 plus floor(5 * 1.25)
 expect(f[side].shield).toBe(18); // floor(15 * 1.25)
 const notices=f.notices!.filter(n=>n.side===side&&n.status==='trigger');
 expect(notices).toHaveLength(3);
 expect(notices.find(n=>n.index===0)?.parentTriggerId).toBe(notices.find(n=>n.index===1)?.triggerId);
});
it('Resonance scales echoed Retriggers but Retriggers grant neither Tide nor barrier rewards',()=>{
 const a=prepared(['whirlpool','backdraft'],trio);a.statuses.tide=3;
 a.memory.triggerHistory=[{index:1,effects:[{kind:'damage',amount:12}],cycle:1,eventAmount:25}];
 const f=simulate(a,idle()).frames[1];
 expect(f.bot.health).toBe(396); // 55 + 27 normal damage, 15 + 7 Retrigger damage
 expect(f.player.statuses.tide).toBe(1); // only the normal Water completion
 expect(f.player.shield).toBe(0);
 expect(f.notices!.filter(n=>n.status==='retrigger')).toHaveLength(2);
 expect(f.notices!.filter(n=>n.status==='trigger')).toHaveLength(0);
});
it.each([false,true])('Rising Tide counts independent activations across ticks (swap=%s)',swap=>{
 const a=prepared(['healing-seed','backdraft','healing-seed','aegis','judicator','healing-seed'],['rising-tide']),b=idle();
 const r=simulate(...(swap?[b,a]:[a,b]) as [Fighter,Fighter]),side=swap?'bot':'player';
 expect(r.frames[1].notices!.filter(n=>n.side===side&&n.status==='trigger')).toHaveLength(6);
 expect(r.frames[1][side].statuses.tide).toBe(2);
 expect(r.frames[2].notices!.filter(n=>n.side===side&&n.status==='trigger')).toHaveLength(5);
 expect(r.frames[2][side].statuses.tide).toBe(3);
});
it('Reactive Barrier rewards once per tick and its Ward can causally fire an armed Ward Trigger',()=>{
 const a=prepared(['healing-seed','backdraft','judicator'],['reactive-barrier']);
 a.memory.rules={addWard:1};
 const r=simulate(a,idle());
 expect(r.frames[1].player.shield).toBe(40);
 expect(r.frames[2].player.shield).toBe(80);
 const ns=r.frames[1].notices!.filter(n=>n.status==='trigger');
 expect(ns.map(n=>n.index)).toEqual([1,0,2]);
 expect(ns.find(n=>n.index===2)?.parentTriggerId).toBe(ns.find(n=>n.index===1)?.triggerId);
});
it('Reactive Barrier uses normal non-stacking Ward and respects fatal Fragile resolution',()=>{
 const a=prepared(['divine-intervention','spark'],trio);a.health=10;a.cursor=1;
 const f=simulate(a,fighter('B',['spark'])).frames[1];
 expect(f.player.health).toBe(1);
 expect(f.player.shield).toBe(375); // upgraded by Resonance, not stacked with 40
 expect(f.player.broken).toContain(0);
 expect(f.notices!.filter(n=>n.side==='player'&&n.status==='trigger')).toHaveLength(1);
});
it('all three augments preserve deterministic bounded chains for both fighters',()=>{
 const a=prepared(['healing-seed','backdraft','aegis','judicator','whirlpool'],trio);
 const b=prepared(['healing-seed','backdraft','aegis','judicator','whirlpool'],trio);
 const r=simulate(a,b);expect(r).toEqual(simulate(a,b));
 for(const f of r.frames)for(const side of ['player','bot'] as const){const ns=f.notices!.filter(n=>n.side===side&&n.status==='trigger');expect(new Set(ns.map(n=>n.index)).size).toBe(ns.length);expect(f[side].health).toBeGreaterThanOrEqual(0);}
 expect(a.memory.triggerHistory).toBeUndefined();
});
