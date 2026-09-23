import { DOMAIN_SOFT } from '../../theme';
import { CARD_BY_ID } from '../../config/catalogue';
const symbols:Record<string,string>={'seed-shot':'❧',moonfire:'☾',sunfire:'☀',wrath:'ϟ',mend:'✚',regrowth:'❧',photosynthesis:'☼',sap:'◒','lunar-strike':'☽',starsurge:'✦','moon-blast':'☾',greenfire:'♨','astral-power':'✧',splash:'≈',brine:'≋',mist:'☁','healing-surge':'✚','aqua-steal':'⇄',frostbolt:'❄',storm:'☂',riptide:'≈',deepwater:'≋',cleanse:'✧',whirlpool:'◎','flood-fury':'≋',downpour:'☂','water-heart':'♥',ember:'♨','from-ash':'✧','fire-bolt':'↯',emberstorm:'♨','lava-drain':'◒',pyroblast:'☄',conflagrate:'✹'};
export function spellVisual(id:string) {
  const card=CARD_BY_ID[id];
  return {glyph:symbols[id] ?? (card?.name.split(' ').map(s=>s[0]).join('').slice(0,2) || '?'),color:DOMAIN_SOFT[card?.domain??'fire']};
}
