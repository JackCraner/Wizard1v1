import type { Battle } from './model';
export function castsAt(battle: Battle, tick: number, side: 'player'|'bot', visibleTick: number) {
  if(tick<1 || tick>visibleTick) return [];
  return battle.frames[tick]?.events.filter(event=>event.side===side) ?? [];
}
export function castAt(battle: Battle, tick: number, side: 'player'|'bot', visibleTick: number) {
  const event=castsAt(battle,tick,side,visibleTick).at(-1);
  return event ? {...event,skipped:event.status==='skipped'} : null;
}
