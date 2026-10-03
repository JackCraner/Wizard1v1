import {combatCard} from './combatCards';
import type {CombatFrame,Effect} from './model';

const hostile=(effects:Effect[]):boolean=>effects.some(e=>e.kind==='damage'||e.kind==='removeWard'||e.kind==='interrupt'||e.target==='enemy'&&e.kind!=='selfDamage');
/** Only completed casts launch cards. Periodic damage and triggered effects keep
 * their own feedback, rather than masquerading as another normal cast. */
export function spellFlights(frame:CombatFrame){
 return frame.events.filter(e=>e.status==='cast').filter((e,i,all)=>all.findIndex(x=>x.side===e.side&&x.index===e.index)===i).map(event=>{
  const card=combatCard(frame[event.side],event.index);
  const hits=(frame.damageEvents??[]).filter(e=>e.sourceSide===event.side&&e.sourceIndex===event.index&&e.kind==='hit'&&e.side!==event.side);
  const heals=(frame.healingEvents??[]).filter(e=>e.side===event.side&&e.sourceIndex===event.index&&e.kind==='heal');
  const offensive=hits.length>0||hostile(card.combat?.effects??[]);
  const target=event.side==='player'?'bot':'player';
  return {side:event.side,index:event.index,card,offensive,target:offensive?target:event.side,
   imp:offensive&&hits.length>0&&hits.every(e=>e.target==='imp'),
   impDamage:hits.filter(e=>e.target==='imp').reduce((sum,e)=>sum+e.amount,0),
   damage:hits.filter(e=>e.target!=='ward').reduce((sum,e)=>sum+e.amount,0),
   ward:hits.filter(e=>e.target==='ward').reduce((sum,e)=>sum+e.amount,0),
   healing:offensive?0:heals.reduce((sum,e)=>sum+e.amount,0),
   critical:hits.some(e=>e.critical),echo:(event.repeats??1)>1,
   returns:!frame[event.side].broken?.includes(event.index)};
 });
}
export type SpellFlight=ReturnType<typeof spellFlights>[number];
export function unclaimedFeedback(frame:CombatFrame):CombatFrame{
 const flights=spellFlights(frame);
 return {...frame,damageEvents:frame.damageEvents?.filter(e=>!flights.some(f=>f.side===e.sourceSide&&f.index===e.sourceIndex&&e.kind==='hit'&&e.side!==f.side)),
 healingEvents:frame.healingEvents?.filter(e=>!flights.some(f=>!f.offensive&&f.side===e.side&&f.index===e.sourceIndex&&e.kind==='heal'))};
}
