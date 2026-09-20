import { cloneSnapshot } from './clone';
import type { Battle, EquipmentModifier, Fighter, Spell, SpellId, Stats } from './model';
export const RULES = { health: 100, mana: 50, gold: 10, slots: 10, maxTicks: 60 } as const;
export const SPELLS: Record<SpellId, Spell> = {
  spark: { id: 'spark', name: 'Spark', kind: 'damage', power: 8, mana: 0, price: 2, description: 'Deal 8 damage. Always casts.' },
  fireball: { id: 'fireball', name: 'Fireball', kind: 'damage', power: 24, mana: 12, price: 4, description: 'Deal 24 damage to your opponent.' },
  mend: { id: 'mend', name: 'Mend', kind: 'heal', power: 20, mana: 10, price: 3, description: 'Restore up to 20 health.' },
  ward: { id: 'ward', name: 'Ward', kind: 'shield', power: 18, mana: 8, price: 3, description: 'Block the next 18 incoming damage.' },
  drain: { id: 'drain', name: 'Siphon', kind: 'drain', power: 12, mana: 8, price: 4, description: 'Deal 12 damage. Heal for damage dealt.' },
  bolt: { id: 'bolt', name: 'Arc bolt', kind: 'damage', power: 36, mana: 20, price: 5, description: 'Deal 36 damage. A costly burst.' },
};
export function deriveStats(modifiers: EquipmentModifier[] = []): Stats {
  return modifiers.reduce<Stats>((s, m) => ({ health: Math.max(1, s.health + (m.health ?? 0)), mana: Math.max(0, s.mana + (m.mana ?? 0)) }), { health: RULES.health, mana: RULES.mana });
}
export function fighter(name: string, spells: SpellId[], modifiers: EquipmentModifier[] = []): Fighter {
  const stats = deriveStats(modifiers);
  return { name, spells: [...spells], ...stats, maxHealth: stats.health, maxMana: stats.mana, shield: 0 };
}
// Pure, deterministic simulation. No clocks, React, network, or random state.
// Each tick resolves shields/healing, then simultaneous damage, then life steal.
export function simulate(playerInput: Fighter, botInput: Fighter): Battle {
  const player = cloneSnapshot(playerInput), bot = cloneSnapshot(botInput);
  const frames: Battle['frames'] = [{ tick: 0, player: cloneSnapshot(player), bot: cloneSnapshot(bot), messages: ['Both spell orders are locked.'] }];
  for (let tick = 0; tick < RULES.maxTicks && player.health > 0 && bot.health > 0; tick++) {
    const messages: string[] = [];
    const cast = (f: Fighter): Spell | undefined => {
      const id = f.spells[tick % f.spells.length];
      if (!id) return undefined;
      const s = SPELLS[id];
      if (s.mana > f.mana) { messages.push(`${f.name} skips ${s.name}: insufficient mana.`); return undefined; }
      f.mana -= s.mana;
      messages.push(`${f.name} casts ${s.name}.`);
      if (s.kind === 'shield') f.shield += s.power;
      if (s.kind === 'heal') f.health = Math.min(f.maxHealth, f.health + s.power);
      return s;
    };
    const a = cast(player), b = cast(bot);
    const hit = (target: Fighter, spell?: Spell) => {
      if (!spell || (spell.kind !== 'damage' && spell.kind !== 'drain')) return 0;
      const blocked = Math.min(target.shield, spell.power);
      target.shield -= blocked;
      const damage = Math.min(target.health, spell.power - blocked);
      target.health -= damage;
      return damage;
    };
    const aDamage = hit(bot, a), bDamage = hit(player, b);
    if (a?.kind === 'drain' && player.health > 0) player.health = Math.min(player.maxHealth, player.health + aDamage);
    if (b?.kind === 'drain' && bot.health > 0) bot.health = Math.min(bot.maxHealth, bot.health + bDamage);
    frames.push({ tick: tick + 1, player: cloneSnapshot(player), bot: cloneSnapshot(bot), messages });
  }
  return { frames, outcome: player.health <= 0 && bot.health <= 0 ? 'draw' : bot.health <= 0 ? 'victory' : player.health <= 0 ? 'defeat' : 'draw' };
}
