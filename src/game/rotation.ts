import type {Fighter} from './model';

/** Keep original slot indexes stable for XP, acquisition order and replay events. */
export function activeSpellIndices(fighter: Pick<Fighter,'spells'|'broken'>): number[] {
    return fighter.spells.map((_,index)=>index).filter(index=>!fighter.broken?.includes(index));
}
