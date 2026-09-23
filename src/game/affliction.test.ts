import {expect,it} from 'vitest';
import {fighter,simulate} from './engine';
const idle=()=>fighter('B',['current']);
it('summons after damage on either side, so the summon tick hits the wizard',()=>{
 for (const swap of [false,true]) {
  const summoner=fighter('Summoner',['ritual']),attacker=fighter('Attacker',['radiant-bolt']);
  const r=simulate(swap?attacker:summoner,swap?summoner:attacker);
  const side=swap?'bot':'player';
  expect(r.frames[2][side].health).toBe(450);
  expect(r.frames[2][side].imp).toEqual({health:50,maxHealth:50,guard:0});
  expect(r.frames[2].damageEvents?.some(e=>e.target==='imp')).toBe(false);
 }
});
it('clears a defeated Imp on the following tick and allows a later summon',()=>{
 const a=fighter('A',['current','ritual']);a.imp={health:20,maxHealth:80,guard:0};
 const r=simulate(a,fighter('B',['spark']));
 expect(r.frames[1].player.imp?.health).toBe(0);
 expect(r.frames[2].player.imp).toBeUndefined();
 expect(r.frames[3].player.imp).toEqual({health:50,maxHealth:50,guard:0});
});
it('reinforces after damage and replaces an Imp defeated during the summon tick',()=>{
 const a=fighter('A',['ritual']);a.imp={health:20,maxHealth:80,guard:0};
 const r=simulate(a,fighter('B',['radiant-bolt']));
 expect(r.frames[2].player.health).toBe(470);
 expect(r.frames[2].player.imp).toEqual({health:50,maxHealth:50,guard:0});
 expect(r.frames[2].damageEvents?.filter(e=>e.target==='imp')).toMatchObject([{amount:20}]);
});
it('grows a living Imp and replaces a defeated Imp without mutating inputs',()=>{
 const a=fighter('A',['ritual']);a.imp={health:20,maxHealth:50,guard:0};
 expect(simulate(a,idle()).frames[2].player.imp).toEqual({health:70,maxHealth:100,guard:0});
 expect(a.imp.health).toBe(20);a.imp.health=0;
 expect(simulate(a,idle()).frames[2].player.imp).toEqual({health:50,maxHealth:50,guard:0});
});
it('Imp intercepts spell damage with overflow, but not poison or self damage',()=>{
 const a=fighter('A',['flare']);a.imp={health:30,maxHealth:30,guard:0};a.statuses.poison=1;
 const r=simulate(a,fighter('B',['spark'])).frames[1];
 expect(r.player.imp?.health).toBe(0);expect(r.player.health).toBe(465);
 expect(r.damageEvents?.filter(e=>e.side==='player'&&e.target==='imp')).toMatchObject([{amount:30,kind:'hit'}]);
 expect(r.damageEvents?.filter(e=>e.side==='player'&&e.target!=='imp').map(e=>e.amount)).toEqual([10,10,15]);
});
it('applied Poison stays on the wizard and ticks past a living Imp',()=>{
 const a=fighter('A',['current']);a.imp={health:50,maxHealth:50,guard:0};
 const r=simulate(a,fighter('B',['agony']));
 expect(r.frames[1].player.statuses.poison).toBe(5);
 expect(r.frames[2].player.imp?.health).toBe(50);
 expect(r.frames[2].player.health).toBe(490);
 expect(r.frames[2].damageEvents?.some(e=>e.target==='imp')).toBe(false);
});
it('an Imp killed in combat respawns at full summon health on the next Ritual',()=>{
 const a=fighter('A',['ritual']);a.imp={health:20,maxHealth:80,guard:0};
 const r=simulate(a,fighter('B',['spark']));
 expect(r.frames[1].player.imp?.health).toBe(0);
 expect(r.frames[1].damageEvents?.filter(e=>e.target==='imp')).toMatchObject([{amount:20}]);
 expect(r.frames[2].player.imp).toEqual({health:50,maxHealth:50,guard:0});
 expect(r.frames[4].player.imp?.health).toBe(5);
 expect(r.frames[4].damageEvents?.filter(e=>e.target==='imp')).toMatchObject([{amount:45}]);
});
it('Imp Guard blocks entire spell hits and expires after its full duration',()=>{
 const a=fighter('A',['blood-pact','current','current','current']);a.imp={health:50,maxHealth:50,guard:0};
 const r=simulate(a,fighter('B',['spark']));
 expect(r.frames[1].player.health).toBe(450);expect(r.frames[1].player.imp?.guard).toBe(2);
 expect(r.frames[3].player.imp?.health).toBe(50);expect(r.frames[3].player.imp?.guard).toBe(0);
 expect(r.frames[5].player.imp?.health).toBe(5);
});
it('Empowered Imp is a persistent combat upgrade and attacks once per completion, not echo',()=>{
 const a=fighter('A',['empowered-imp','current']);a.imp={health:50,maxHealth:50,guard:0};a.statuses.tidecaller=5;
 const r=simulate(a,idle());expect(r.frames[2].bot.health).toBe(460);expect(r.frames[3].bot.health).toBe(420);
 expect(r.frames[2].player.memory.impDamage).toBe(40);
});
it('Blood Offering pays half health and summons scaled health; Doomsday sacrifices only once',()=>{
 const a=fighter('A',['blood-offering'],[],[3]);a.statuses.guard=5;
 const r=simulate(a,idle()).frames[1];expect(r.player.health).toBe(250);expect(r.player.imp?.health).toBe(375);
 const d=fighter('A',['doomsday'],[],[3]);d.imp={health:20,maxHealth:100,guard:0};d.statuses.tidecaller=5;
 const s=simulate(d,idle()).frames[1];expect(s.bot.health).toBe(300);expect(s.player.imp?.health).toBe(0);
});
it('Shadow Bolt bonus needs both Affliction attunement and a living Imp',()=>{
 const a=fighter('A',['shadow-bolt'],[],[3]);a.imp={health:50,maxHealth:50,guard:0};
 expect(simulate(a,idle()).frames[1].bot.health).toBe(340);a.attuned=[];
 expect(simulate(a,idle()).frames[1].bot.health).toBe(420);
});
it('Curse persists and damages on the new cycle after a reshuffle, including Reckless Loop',()=>{
 const a=fighter('A',['current']);a.statuses.curse=2;
 const r=simulate(a,idle());expect(r.frames[1].player.health).toBe(500);expect(r.frames[3].player.health).toBe(480);expect(r.frames[6].player.health).toBe(460);
 const b=fighter('A',['current'],['reckless-loop']);b.statuses.curse=2;
 expect(simulate(b,idle()).frames[1].player.health).toBe(455);
});
it('Stun pauses an existing cast and reshuffle while over-time effects continue',()=>{
 const a=fighter('A',['brine']);a.casting={spell:'brine',index:0,totalTicks:3,remaining:2};a.statuses={stun:2,poison:3};
 const r=simulate(a,idle());expect(r.frames[2].player.casting?.remaining).toBe(2);expect(r.frames[2].player.health).toBe(480);expect(r.frames[4].events.some(e=>e.side==='player'&&e.status==='cast')).toBe(true);
 a.casting=null;a.reshuffleRemaining=1;
 const s=simulate(a,idle());expect(s.frames[2].player.reshuffleRemaining).toBe(1);expect(s.frames[3].player.cycle).toBe(2);
});
it('SoulBound pauses both sides for five following ticks without discarding their rotation',()=>{
 const r=simulate(fighter('A',['soulbound','spark']),idle());
 expect(r.frames[1].player.statuses.stun).toBe(5);
 for(let t=2;t<=6;t++)expect(r.frames[t].events).toHaveLength(0);
 expect(r.frames[7].events.some(e=>e.spell==='spark')).toBe(true);
});
it('Nightmare consumes remaining enemy Poison; Death Mark leaves it active',()=>{
 const b=idle();b.statuses.poison=5;
 const r=simulate(fighter('A',['nightmare'],[],[3]),b).frames[2];expect(r.bot.health).toBe(435);expect(r.bot.statuses.poison).toBeUndefined();
 const d=simulate(fighter('A',['death-mark']),b).frames[1];expect(d.bot.health).toBe(450);expect(d.bot.statuses.poison).toBe(4);
});
it('Rupture checks Curse at cast start and then applies Slow; Eldritch doubles once for any debuff',()=>{
 const a=fighter('A',['rupture'],[],[3]),b=idle();b.statuses.curse=1;a.statuses.slow=1;
 expect(simulate(a,b).frames[1].player.casting?.remaining).toBe(1);
 const c=idle();c.statuses={curse:1,slow:3};
 expect(simulate(fighter('A',['eldritch-bolt'],[],[3]),c).frames[2].bot.health).toBe(340);
});
it('Corrupt Ward strips only enemy Ward and Channel scales both Life Drain effects',()=>{
 const a=fighter('A',['corrupt-ward']),b=idle();a.shield=30;b.shield=90;
 const r=simulate(a,b).frames[1];expect(r.player.shield).toBe(30);expect(r.bot.shield).toBe(0);
 const c=fighter('A',Array(3).fill('life-drain'),[],[3,3,3]);c.health=100;
 const d=simulate(c,idle()).frames[1];expect(d.player.health).toBe(190);expect(d.bot.health).toBe(420);
});
