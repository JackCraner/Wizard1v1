import type {CombatFrame} from './model';
import {SPELLS} from './engine';
export interface ProcCue {side:'player'|'bot';kind:'combust'|'tidecaller';text:string}
export function combatProcCues(frame:CombatFrame):ProcCue[]{
 return [
  ...(frame.notices??[]).filter(n=>n.status==='combust-speed').map(n=>({side:n.side,kind:'combust' as const,text:n.text})),
  ...frame.events.filter(e=>e.status==='cast'&&e.repeats===2).map(e=>({side:e.side,kind:'tidecaller' as const,text:SPELLS[e.spell].name+' · Double cast'})),
 ];
}
