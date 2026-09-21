import playbackConfig from '../config/playback.json';
import type { Battle, CombatFrame } from './model';
// Shared by replay advancement and cast-bar interpolation.
export const PLAYBACK_CONFIG = playbackConfig;
// Duration of a real tick; there is no automatic hold between ticks.
export const COMBAT_TICK_MS = PLAYBACK_CONFIG.tickDurationMs;

export type CombatBeat = 'cast' | 'hold';
// Presentation beats never create extra simulation ticks.
export function nextCombatBeat(frame:number,beat:CombatBeat,lastFrame:number):{frame:number;beat:CombatBeat} {
  return {frame:Math.min(frame+1,lastFrame),beat:'cast'};
}

// Completed frames remain intact for timeline inspection; only presentation
// splits periodic effects from spell resolution to avoid displaying them twice.
export function presentedCombatFrame(battle:Battle,frame:number,beat:CombatBeat):CombatFrame {
 const completed=battle.frames[frame];
 if(beat==='cast'&&battle.frames[frame+1]?.tickStart)return battle.frames[frame+1].tickStart!;
 const start=completed.tickStart;
 return {...completed,presentationPhase:'resolve',
  damageEvents:completed.damageEvents?.slice(start?.damageEvents?.length??0),
  healingEvents:completed.healingEvents?.slice(start?.healingEvents?.length??0),
  manaEvents:completed.manaEvents?.slice(start?.manaEvents?.length??0),
  notices:completed.notices?.slice(start?.notices?.length??0)};
}

// At the boundary, resolve the previous spell and start the next tick's
// periodic effects together, keeping both sets of feedback visible.
export function continuousCombatFrame(battle:Battle,frame:number):CombatFrame {
 const resolved=presentedCombatFrame(battle,frame,'hold');
 const start=battle.frames[frame+1]?.tickStart;
 if(!start)return resolved;
 return {...start,tick:frame,presentationPhase:'resolve',events:resolved.events,
  messages:[...resolved.messages,...start.messages],
  damageEvents:[...(resolved.damageEvents??[]),...(start.damageEvents??[])],
  healingEvents:[...(resolved.healingEvents??[]),...(start.healingEvents??[])],
  manaEvents:[...(resolved.manaEvents??[]),...(start.manaEvents??[])],
  notices:[...(resolved.notices??[]),...(start.notices??[])]};
}
