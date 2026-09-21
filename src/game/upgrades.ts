import { CARD_BY_ID, type CardDefinition } from '../config/catalogue';
export const UPGRADE_XP = 3;
// XP belongs to a slot's card, never to every copy of the same spell.
export function cardAt(id:string,xp=0):CardDefinition {
 const base=CARD_BY_ID[id];
 if(!base)throw new Error('Unknown spell.');
 return {...base,...(xp>=UPGRADE_XP?base.upgrade:{}),xp,upgraded:xp>=UPGRADE_XP};
}
export function deckXp(spells:readonly string[],xp:readonly number[]=[]):number[] {
 return spells.map((_,i)=>xp[i]??0);
}
export function validateXp(spells:readonly string[],xp:readonly number[]=[]) {
 if(xp.length && xp.length!==spells.length)throw new Error('Invalid card progress.');
 if(xp.some(n=>!Number.isInteger(n)||n<0||n>UPGRADE_XP))throw new Error('Invalid card XP.');
}
export function canMerge(spells:readonly string[],xp:readonly number[],from:number,to:number) {
 return Number.isInteger(from)&&Number.isInteger(to)&&from>=0&&to>=0&&from<spells.length&&to<spells.length&&from!==to&&spells[from]===spells[to]&&(xp[to]??0)<UPGRADE_XP&&(xp[from]??0)<UPGRADE_XP;
}
export function mergeCards(spells:string[],xp:number[],from:number,to:number) {
 if(!canMerge(spells,xp,from,to))throw new Error('Choose two matching, non-upgraded cards.');
 xp[to]++;spells.splice(from,1);xp.splice(from,1);
}
