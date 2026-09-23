import {fighter,simulate} from './engine';
import type {GameGateway,Session} from './model';
import {LocalGameGateway} from '../services/localGateway';

/** Development-only, reproducible full-sequence previews through the normal game UI. */
export const COMBAT_FIXTURES={
 fire:{player:['ember','flare','flameshield','conflagrate','firefury','pyroblast'],bot:['ritual','dark-communication','soulbound','shadow-bolt','blood-offering','doomsday']},
 water:{player:['current','storm','whirlpool','deep-water','ocean-heart','tidal-power'],bot:['aegis','oath-restraint','prayer','consecration','divine-intervention','holy-light']},
 nature:{player:['moonblight','photosynthesis','bramble-wall','venom-bloom','astral-power','cycle-of-life'],bot:['ritual','agony','dark-communication','damnation','death-mark','nightmare']},
 holy:{player:['consecration','oath-restraint','aegis','oath-eye-for-an-eye','pyroblast','lay-on-hands'],bot:['ember','flare','emberstorm','conflagrate','blaze','phoenix-guard']},
} as const;
export function combatPreviewGateway(name:keyof typeof COMBAT_FIXTURES):GameGateway{
 const local=new LocalGameGateway();let session:Session;
 const start=async()=>{const base=await local.start('normal',7323),preset=COMBAT_FIXTURES[name];const player=fighter('You',[...preset.player],['opening-ward'],[3,3,3,3,3,3],[],5),bot=fighter('Training rival',[...preset.bot],[],[3,3,3,3,3,3],[],5);session={...base,level:5,spells:[...preset.player],spellXp:[3,3,3,3,3,3],phase:'result',battle:simulate(player,bot)};return session;};
 return {start,execute:async()=>start()};
}
