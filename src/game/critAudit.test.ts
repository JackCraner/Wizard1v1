import {expect,it} from 'vitest';
import {fighter,simulate} from './engine';
import {continuousCombatFrame} from './playback';

it('checks 0%, 10%, 50% and 100% crit rates for both sides over 1000 seeds',()=>{
 for(const side of ['player','bot'] as const) for(const chance of [0,.1,.5,1]){
  let crits=0;
  for(let i=0;i<1000;i++){
   const attacker=fighter('Attacker',['ember']);attacker.statuses.hotstreak=chance*10+1;
   const idle=fighter('Idle',['splash']);
   const b=side==='player'?simulate(attacker,idle,i*1009):simulate(idle,attacker,i*1009);
   const event=b.frames[1].events.find(e=>e.side===side)!;
   if(event.critical)crits++;
   expect(b.frames[1][side==='player'?'bot':'player'].health).toBe(event.critical?410:440);
  }
  console.log(side,Math.round(chance*100)+'% expected:',crits+'/1000 crits');
  expect(Math.abs(crits/1000-chance)).toBeLessThan(.035);
 }
});
it('Scorch does not retroactively use the Hotstreak that it grants',()=>{
 const b=simulate(fighter('A',['scorch','ember']),fighter('B',['splash']));
 expect(b.frames[1].player.statuses.hotstreak).toBe(2);
 expect(b.frames[1].events.find(e=>e.side==='player')?.details).toContain('Crit chance at resolution: 0% (0 Hotstreak stacks). Normal hit.');
 expect(b.frames[2].events.find(e=>e.side==='player')?.details?.some(d=>d.startsWith('Crit chance at resolution: 10% (1 Hotstreak stacks).'))).toBe(true);
});
it('normal casts use post-countdown stacks; Instant uses pre-countdown stacks',()=>{
 const normal=fighter('A',['ember']);normal.statuses.hotstreak=1;
 expect(simulate(normal,fighter('B',['splash'])).frames[1].events.find(e=>e.side==='player')?.details).toContain('Crit chance at resolution: 0% (0 Hotstreak stacks). Normal hit.');
 const instant=fighter('A',['mist']);instant.statuses.hotstreak=10;
 expect(simulate(instant,fighter('B',['splash'])).frames[1].damageEvents?.[0]).toMatchObject({critical:true,amount:30});
});
it('crit damage and its critical marker survive replay presentation, including Overheat',()=>{
 for(const overheat of [false,true]){
  const p=fighter('A',['ember']);p.statuses={hotstreak:11,...(overheat?{overheat:5}:{})};
  const b=simulate(p,fighter('B',['splash']));
  expect(continuousCombatFrame(b,1).damageEvents).toContainEqual(expect.objectContaining({side:'bot',critical:true,amount:overheat?120:90}));
 }
});
