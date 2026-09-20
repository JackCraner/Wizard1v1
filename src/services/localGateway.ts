import { EQUIPMENT, offersFor, equipmentModifiers } from '../game/shop';
import { cloneSnapshot } from '../game/clone';
import { fighter, RULES, simulate, SPELLS } from '../game/engine';
import type { Command, GameGateway, Session, SpellId } from '../game/model';
const bots: SpellId[][] = [['spark', 'fireball', 'ward'], ['fireball', 'mend', 'spark', 'drain'], ['ward', 'bolt', 'spark', 'fireball']];
// IDs are local-only; a remote adapter receives its IDs from the server.
let nextSessionId = 0;
export class LocalGameGateway implements GameGateway {
  private session: Session | null = null;
  async start(): Promise<Session> {
    this.session = { id: `local-${++nextSessionId}`, revision: 0, round: 1, gold: RULES.gold, spells: ['spark', 'fireball'], ...offersFor(1, 0), rerolls: 0, equipment: {}, phase: 'shop', wins: 0, losses: 0, battle: null };
    return cloneSnapshot(this.session);
  }
  async execute(id: string, revision: number, command: Command): Promise<Session> {
    if (!this.session || this.session.id !== id) throw new Error('Session not found. Start a new run.');
    if (this.session.revision !== revision) throw new Error('This action is out of date. Please try again.');
    const s = cloneSnapshot(this.session);
    if (command.type === 'next') {
      if (s.phase !== 'result') throw new Error('Finish combat first.');
      s.phase = 'shop'; s.round++; s.gold += RULES.gold; s.battle = null; s.rerolls = 0; Object.assign(s, offersFor(s.round, 0));
    } else {
      if (s.phase !== 'shop') throw new Error('Your spell order is locked during combat.');
      if (command.type === 'reroll') {
        if (s.gold < 1) throw new Error('Not enough gold to reroll.');
        s.gold--; s.rerolls++; Object.assign(s, offersFor(s.round, s.rerolls));
      } else if (command.type === 'buyEquipment') {
        const item = EQUIPMENT[command.item];
        if (!item || !s.equipmentShop.includes(command.item)) throw new Error('Equipment unavailable.');
        if (s.equipment[item.slot]) throw new Error('That equipment slot is already occupied.');
        if (s.gold < item.price) throw new Error('Not enough gold.');
        s.gold -= item.price; s.equipment[item.slot] = item.id;
      } else if (command.type === 'buy') {
        const spell = SPELLS[command.spell];
        if (!spell || !s.shop.includes(command.spell)) throw new Error('Spell unavailable.');
        if (s.spells.length >= RULES.slots) throw new Error('Your spellbook is full.');
        if (s.gold < spell.price) throw new Error('Not enough gold.');
        s.gold -= spell.price; s.spells.push(spell.id);
      } else if (command.type === 'move') {
        const { from, to } = command;
        if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= s.spells.length || to >= s.spells.length) throw new Error('Invalid spell position.');
        const [spell] = s.spells.splice(from, 1); s.spells.splice(to, 0, spell);
      } else {
        if (!s.spells.length) throw new Error('Equip a spell first.');
        s.battle = simulate(fighter('You', s.spells, equipmentModifiers(s.equipment)), fighter('Training construct', bots[(s.round - 1) % bots.length]));
        s.phase = 'result';
        if (s.battle.outcome === 'victory') s.wins++;
        if (s.battle.outcome === 'defeat') s.losses++;
      }
    }
    s.revision++; this.session = s;
    return cloneSnapshot(s);
  }
}
