import playbackConfig from '../config/playback.json';
import type { Battle, CombatFrame, Fighter } from './model';
// Shared by replay advancement and cast-bar interpolation.
export const PLAYBACK_CONFIG = playbackConfig;
// Duration of a real tick; there is no automatic hold between ticks.
export const COMBAT_TICK_MS = PLAYBACK_CONFIG.tickDurationMs;
// Recover the original wait from snapshots, including when seeking mid-reshuffle.
export function reshuffleDuration(battle:Battle,frame:number,side:'player'|'bot',fighter:Fighter):number {
 let duration=fighter.reshuffleRemaining;
 if(!duration)return 0;
 for(let index=frame;index>=0;index--){
  const previous=battle.frames[index][side];
  if(previous.cycle!==fighter.cycle||!previous.reshuffleRemaining)break;
  duration=Math.max(duration,previous.reshuffleRemaining);
 }
 return duration;
}
export const nextPlaybackSpeed=(speed:number)=>{
 const speeds=PLAYBACK_CONFIG.speedMultipliers;
 return speeds[(speeds.indexOf(speed)+1)%speeds.length];
};

export type CombatBeat = 'cast' | 'hold';
// Presentation beats never create extra simulation ticks.
export function nextCombatBeat(frame:number,_beat:CombatBeat,lastFrame:number):{frame:number;beat:CombatBeat} {
  return {frame:Math.min(frame+1,lastFrame),beat:'cast'};
}

// Completed frames remain intact for timeline inspection; only presentation
// separates cast-start feedback from resolution without displaying effects twice.
export function presentedCombatFrame(battle:Battle,frame:number,beat:CombatBeat):CombatFrame {
 const completed=battle.frames[frame];
 if(beat==='cast'&&battle.frames[frame+1]?.tickStart)return battle.frames[frame+1].tickStart!;
 const start=completed.tickStart;
 return {...completed,presentationPhase:'resolve',events:completed.events.slice(start?.events.length??0),
  damageEvents:completed.damageEvents?.slice(start?.damageEvents?.length??0),
  healingEvents:completed.healingEvents?.slice(start?.healingEvents?.length??0),
  notices:completed.notices?.slice(start?.notices?.length??0)};
}

// At the boundary, resolve the previous spell and start the next tick's
// cast-start feedback together, keeping both sets of feedback visible.
export function continuousCombatFrame(battle:Battle,frame:number):CombatFrame {
 const resolved=presentedCombatFrame(battle,frame,'hold');
 const start=battle.frames[frame+1]?.tickStart;
 if(!start)return resolved;
 // Starting the next simulation tick clears dead Imps. Retain the just-defeated
 // copy for this presentation tick only; a new summon always takes precedence.
 const presentedFighter=(side:'player'|'bot')=>!start[side].imp&&resolved[side].imp?.health===0
  ?{...start[side],imp:{...resolved[side].imp!}}:start[side];
 return {...start,player:presentedFighter('player'),bot:presentedFighter('bot'),tick:frame,presentationPhase:'resolve',events:[...resolved.events,...start.events],
  messages:[...resolved.messages,...start.messages],
  damageEvents:[...(resolved.damageEvents??[]),...(start.damageEvents??[])],
  healingEvents:[...(resolved.healingEvents??[]),...(start.healingEvents??[])],
  notices:[...(resolved.notices??[]),...(start.notices??[])]};
}
