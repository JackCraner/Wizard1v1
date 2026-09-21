import { CARD_BY_ID } from '../../config/catalogue';
import type { Fighter } from '../../game/model';
const symbols:Record<string,string>={'seed-shot':'❧',moonfire:'☾',sunfire:'☀',wrath:'ϟ',mend:'✚',regrowth:'❧',photosynthesis:'☼',sap:'◒','lunar-strike':'☽',starsurge:'✦','moon-blast':'☾',greenfire:'♨','astral-power':'✧',splash:'≈',brine:'≋',mist:'☁','healing-surge':'✚','aqua-steal':'⇄',frostbolt:'❄',storm:'☂',riptide:'≈',deepwater:'≋',cleanse:'✧',whirlpool:'◎','flood-fury':'≋',downpour:'☂','water-heart':'♥',ember:'♨','from-ash':'✧','fire-bolt':'↯',emberstorm:'♨','lava-drain':'◒',pyroblast:'☄',conflagrate:'✹'};
export function spellVisual(id:string) {
  const card=CARD_BY_ID[id];
  return {glyph:symbols[id] ?? (card?.name.split(' ').map(s=>s[0]).join('').slice(0,2) || '?'),color:card?.domain==='nature'?'#a6d982':card?.domain==='water'?'#89d4ed':card?.domain==='holy'?'#ffe29b':card?.domain==='affliction'?'#cea5ef':'#f2a16d'};
}
export function statusSummary(fighter:Fighter) {
  const entries=Object.entries(fighter.statuses ?? {});
  return entries.length ? entries.map(([id,count])=>`${id.slice(0,2).toUpperCase()} ${count}`).join(' · ') : 'No effects';
}
