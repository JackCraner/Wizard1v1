import {fighter,simulate} from './engine';
import type {GameGateway,Session} from './model';
import {LocalGameGateway} from '../services/localGateway';

/** Development-only, reproducible full-sequence previews through the normal game UI. */
export const COMBAT_FIXTURES={
 'mixed-heat':{player:['ember','spark','spark','aegis','brine','leech'],bot:['photosynthesis']},
 heat:{player:['spark','spark','spark','spark','spark','pyroblast'],bot:['photosynthesis']},
 branches:{player:['healing-seed','backdraft','healing-seed','radiance','spark','whirlpool'],bot:['ritual','soul-tithe','leech','empowered-imp','radiance','blood-pact']},
 chains:{player:['healing-seed','backdraft','cinder','flashover','flare','whirlpool'],bot:['ritual','soul-tithe','leech','empowered-imp','radiance','blood-pact']},
 ward:{player:['transformation-bear','judicator','aegis','blessing','flameshield','ember'],bot:['briarheart','toxic-growth','moonblight','riptide','undercurrent','maelstrom']},
 signals:{player:['storm'],bot:['photosynthesis']},
 fire:{player:['ember','flare','flameshield','conflagrate','firefury','pyroblast'],bot:['ritual','dark-communication','soulbound','shadow-bolt','blood-offering','doomsday']},
 water:{player:['current','storm','whirlpool','deep-water','ocean-heart','tidal-power'],bot:['aegis','oath-restraint','prayer','consecration','divine-intervention','holy-light']},
 nature:{player:['moonblight','photosynthesis','bramble-wall','venom-bloom','astral-power','cycle-of-life'],bot:['ritual','agony','dark-communication','damnation','death-mark','nightmare']},
 holy:{player:['consecration','oath-restraint','aegis','oath-eye-for-an-eye','pyroblast','lay-on-hands'],bot:['ember','flare','emberstorm','conflagrate','blaze','phoenix-guard']},
} as const;
export function combatPreviewGateway(name:keyof typeof COMBAT_FIXTURES):GameGateway{
 const local=new LocalGameGateway();let session:Session;
 const start=async()=>{const base=await local.start('normal',7323),preset=COMBAT_FIXTURES[name];const player=fighter('You',[...preset.player],['opening-ward'],preset.player.map(()=>3),[],5),bot=fighter('Training rival',[...preset.bot],[],preset.bot.map(()=>3),[],5);session={...base,level:5,spells:[...preset.player],spellXp:preset.player.map(()=>3),phase:'result',battle:simulate(player,bot)};return session;};
 return {start,execute:async()=>start()};
}
