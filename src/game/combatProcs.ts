import type {CombatFrame} from './model';
import {SPELLS} from './engine';
export interface ProcCue {side:'player'|'bot';kind:'empowered'|'repeat';text:string}
export function combatProcCues(frame:CombatFrame):ProcCue[]{return frame.events.filter(e=>e.status==='cast').flatMap(e=>[
 ...(e.details?.includes('Empowered')?[{side:e.side,kind:'empowered' as const,text:SPELLS[e.spell].name+' · Empowered'}]:[]),
 ...((e.repeats??1)>1?[{side:e.side,kind:'repeat' as const,text:SPELLS[e.spell].name+' · Repeat ×'+e.repeats}]:[])
]);}
