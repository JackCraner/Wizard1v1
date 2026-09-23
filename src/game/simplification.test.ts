import {expect,it} from 'vitest';
import {fighter,simulate,PLAYABLE_SPELLS,channelPower} from './engine';
import {cardAt} from './upgrades';
import {continuousCombatFrame} from './playback';
const duel=(deck:string[],xp:number[]=[])=>simulate(fighter('A',deck,[],xp),fighter('B',['current']));
it('resolves simultaneous lethal ordinary spells as a draw without mutating inputs',()=>{const a=fighter('A',['spark']),b=fighter('B',['spark']);a.health=b.health=45;expect(simulate(a,b).outcome).toBe('draw');expect(a.health).toBe(45);});
it('Poison and Regeneration use ten-point ticks with additive duration',()=>{
 const b=duel(['moonblight']);expect(b.frames[1].bot.statuses.poison).toBe(5);expect(b.frames[2].bot.health).toBe(490);expect(b.frames[2].bot.statuses.poison).toBe(4);
 const a=fighter('A',['regrowth']);a.health=400;const r=simulate(a,fighter('B',['current']));expect(r.frames[2].player.statuses.regeneration).toBe(5);expect(r.frames[3].player.health).toBe(410);
});
it('Ward keeps the larger shield and never adds repeated shields or augment shields',()=>{
 const b=duel(['barkskin','barkskin']);expect(b.frames[1].player.shield).toBe(40);expect(b.frames[2].player.shield).toBe(40);
 const a=fighter('A',['barkskin'],['opening-ward']);a.shield=110;expect(simulate(a,fighter('B',['current'])).frames[1].player.shield).toBe(110);
});
it('Channel caps at three matching copies and adds only the per-copy bonus',()=>{
 expect(channelPower(Array(4).fill('photosynthesis'),1)).toBe(3);expect(channelPower(Array(4).fill('photosynthesis'),3)).toBe(1);
 expect(duel(Array(4).fill('photosynthesis')).frames[1].player.statuses.regeneration).toBe(5);
 expect(duel(Array(4).fill('whirlpool')).frames[1].bot.health).toBe(430);
 expect(duel(Array(4).fill('whirlpool'),[3,3,3,3]).frames[1].bot.health).toBe(410);
});
it('Interrupt stops a 1T completion and cancels the remaining channel group',()=>{
 const b=simulate(fighter('A',['flamekick'],[],[3]),fighter('B',['spark']));expect(b.frames[1].player.health).toBe(500);expect(b.frames[1].bot.health).toBe(450);expect(b.frames[1].events.some(e=>e.side==='bot'&&e.status==='skipped')).toBe(true);
 const c=simulate(Object.assign(fighter('A',['disrupt']),{statuses:{slow:1}}),fighter('B',Array(4).fill('photosynthesis')));expect(c.frames[2].events.filter(e=>e.side==='bot'&&e.status==='skipped').map(e=>e.index)).toEqual([1,2]);expect(c.frames[3].events.some(e=>e.side==='bot'&&e.index===3)).toBe(true);
 const d=simulate(fighter('A',['flamekick'],[],[3]),fighter('B',['flamekick'],[],[3]));expect(d.frames[1].events.filter(e=>e.status==='cast')).toHaveLength(0);expect(d.frames[1].player.health).toBe(500);expect(d.frames[1].bot.health).toBe(500);
});
it('Instant heals before Poison and lethal Instant prevents normal completions',()=>{
 const a=fighter('A',['germination'],[],[3]);a.health=5;a.statuses.poison=1;const b=simulate(a,fighter('B',['current']));expect(b.frames[1].player.health).toBe(65);expect(b.frames[1].events[0].details).toContain('Instant');
 const c=fighter('B',['spark']);c.health=50;const result=simulate(fighter('A',['firebolt'],[],[3]),c);expect(result.frames[1].player.health).toBe(500);expect(result.frames[1].bot.health).toBe(0);expect(result.frames[1].events.filter(e=>e.side==='bot')).toHaveLength(0);
});
it('Instant upgrades fall back to 1T without their marked attunement',()=>{
 const b=simulate(fighter('A',['firebolt','wrath','current'],[],[3,0,0],[2,0,1]),fighter('B',['spark']));expect(b.frames[1].player.health).toBe(455);expect(b.frames[1].events.find(e=>e.side==='player')?.details).not.toContain('Instant');
});
it('Slow adds one tick to every new non-Instant cast during its duration',()=>{
 const b=simulate(fighter('A',['frostbolt','solar-beam']),fighter('B',['jet','jet','jet']));expect(b.frames[1].events.some(e=>e.side==='bot')).toBe(true);expect(b.frames[2].bot.casting?.totalTicks).toBe(2);expect(b.frames[2].bot.statuses.slow).toBe(2);expect(b.frames[4].bot.casting?.totalTicks).toBe(2);
});
it('Guard blocks damage throughout its duration, while Health costs bypass it',()=>{
 const a=fighter('A',['current']);a.statuses.guard=2;a.statuses.poison=3;const b=simulate(a,fighter('B',['spark','spark','spark']));expect(b.frames[1].player.health).toBe(500);expect(b.frames[2].player.health).toBe(500);expect(b.frames[3].player.health).toBe(445);
 const cost=fighter('A',['overheat']);cost.statuses.guard=3;expect(simulate(cost,fighter('B',['current'])).frames[1].player.health).toBe(250);
 const self=fighter('A',['flare']);self.statuses.guard=3;expect(simulate(self,fighter('B',['current'])).frames[1].player.health).toBe(500);
});
it('Resilience halves damage and upgraded Bear persists across cycles',()=>{
 const a=fighter('A',['current']);a.statuses.resilience=2;expect(simulate(a,fighter('B',['spark'])).frames[1].player.health).toBe(477);
 expect(duel(['transformation-bear'],[3]).frames[5].player.memory.permanentResilience).toBe(true);
});
it('Trap triggers once per completed spell, not once per Echo',()=>{
 const a=fighter('A',['jet']);a.statuses={trap:3,tidecaller:5};const b=simulate(a,fighter('B',['current']));expect(b.frames[1].player.health).toBe(490);expect(b.frames[1].events[0].repeats).toBe(2);
});
it('Tidecaller consumes five at cast start and echoes at half strength without recursion',()=>{
 const a=fighter('A',['jet']);a.statuses.tidecaller=7;const b=simulate(a,fighter('B',['current']));expect(b.frames[1].bot.health).toBe(432);expect(b.frames[1].player.statuses.tidecaller).toBe(2);expect(b.frames[1].events[0].details).toContain('Echo 50%');
 const generator=fighter('A',['current','jet']);generator.statuses.tidecaller=4;const c=simulate(generator,fighter('B',['current']));expect(c.frames[1].events[0].repeats).toBe(1);expect(c.frames[2].bot.health).toBe(432);
});
it('upgraded Crash doubles its Echo damage',()=>{
 const a=fighter('A',['crash'],[],[3]);a.statuses.tidecaller=5;expect(simulate(a,fighter('B',['current'])).frames[3].bot.health).toBe(60);
});
it('Heat consumes five for an exact 1T cast, without the former damage bonus',()=>{
 const a=fighter('A',['pyroblast']);a.statuses={heat:7,slow:3};const b=simulate(a,fighter('B',['current']));expect(b.frames[1].bot.health).toBe(230);expect(b.frames[1].player.statuses.heat).toBe(2);
});
it('Potency crits are seeded, capped, and use Eruption multipliers',()=>{
 const a=fighter('A',['spark']);a.statuses.potency=10;const b=simulate(a,fighter('B',['current']),77);expect(b.frames[1].bot.health).toBe(432);expect(b.frames[1].events[0].critical).toBe(true);expect(simulate(a,fighter('B',['current']),77)).toEqual(b);
 const eruption=fighter('A',['eruption','spark']);eruption.statuses.potency=10;expect(simulate(eruption,fighter('B',['current'])).frames[4].bot.health).toBe(410);
 const normal=duel(['spark']);expect(normal.frames[1].events[0].critical).toBe(false);
});
it('Sporeburst guarantees a crit on a debuff, and Starsurge counts unique debuffs',()=>{
 const b=fighter('B',['current']);b.statuses.slow=5;expect(simulate(fighter('A',['sporeburst']),b).frames[2].bot.health).toBe(425);
 const c=fighter('B',['current']);c.statuses={slow:5,trap:5};expect(simulate(fighter('A',['starsurge']),c).frames[2].bot.health).toBe(350);
});
it('Fury and Weaken are duration modifiers rather than stacking damage multipliers',()=>{
 const a=fighter('A',['spark']);a.statuses={fury:5,weaken:5};expect(simulate(a,fighter('B',['current'])).frames[1].bot.health).toBe(460);
});
it('Venom Bloom changes Poison potency, and Cultivate consumes remaining Regeneration once',()=>{
 const b=fighter('B',['current']);b.statuses.poison=5;expect(simulate(fighter('A',['venom-bloom']),b).frames[2].bot.health).toBe(472);
 const a=fighter('A',['cycle-of-life']);a.health=100;a.statuses.regeneration=5;const c=simulate(a,fighter('B',['current']));expect(c.frames[2].player.health).toBe(165);expect(c.frames[2].player.statuses.regeneration).toBeUndefined();
});
it('Flourish doubles regeneration only until reshuffle; Celestial Alignment doubles the next spell',()=>{
 const a=fighter('A',['flourish','thorn-lash'],[],[3,0]);a.health=100;a.statuses.regeneration=10;const b=simulate(a,fighter('B',['current']));expect(b.frames[1].player.health).toBe(110);expect(b.frames[2].player.health).toBe(130);expect(b.frames[4].player.memory.regenerationPower).toBe(1);
 expect(duel(['celestial-alignment','thorn-lash']).frames[3].bot.health).toBe(430);
});
it('Budding Life applies Regeneration to the enemy; Rejuvenation cleanses one debuff',()=>{
 const b=duel(['budding-life']);expect(b.frames[1].player.statuses.regeneration).toBe(5);expect(b.frames[1].bot.statuses.regeneration).toBe(5);
 const a=fighter('A',['rejuvenation'],[],[3]);a.statuses={poison:5,slow:5,trap:5};const c=simulate(a,fighter('B',['current']));expect(c.frames[3].player.statuses.poison).toBeUndefined();expect(c.frames[3].player.statuses.slow).toBeGreaterThan(0);expect(c.frames[3].player.statuses.trap).toBeGreaterThan(0);
});
it('preserves two reshuffle ticks and bounded replay presentation',()=>{const b=duel(['thorn-lash']);expect(b.frames[2].events.filter(e=>e.side==='player')).toHaveLength(0);expect(continuousCombatFrame(b,1).player.reshuffleRemaining).toBe(2);expect(b.frames[3].events.some(e=>e.side==='player')).toBe(false);expect(b.frames[4].events.some(e=>e.side==='player')).toBe(true);});
it.each(PLAYABLE_SPELLS)('%s and its upgrade produce deterministic bounded snapshots',id=>{for(const xp of [0,3]){const a=fighter('A',[id],[],[xp]),b=fighter('B',['current']);const result=simulate(a,b);expect(simulate(a,b)).toEqual(result);for(const frame of result.frames)for(const p of [frame.player,frame.bot]){expect(Number.isFinite(p.health)).toBe(true);expect(p.health).toBeGreaterThanOrEqual(0);expect(p.health).toBeLessThanOrEqual(p.maxHealth);expect(p.shield).toBeGreaterThanOrEqual(0);for(const n of Object.values(p.statuses))expect(n).toBeGreaterThanOrEqual(0);}expect(cardAt(id,xp).castTicks).toBeGreaterThanOrEqual(0);}});
