import { describe, expect, it } from 'vitest';
import { LocalGameGateway } from '../services/localGateway';
import { offersFor } from './shop';

describe('shop authority', () => {
  it('offers four spells and two equipment items; rerolls charge once and change offers', async () => {
    const g = new LocalGameGateway(); const first = await g.start();
    expect(first.shop).toHaveLength(4); expect(first.equipmentShop).toHaveLength(2);
    const next = await g.execute(first.id, first.revision, { type: 'reroll' });
    expect(next.gold).toBe(9); expect(next.rerolls).toBe(1);
    expect(next.shop).not.toEqual(first.shop); expect(next.equipmentShop).not.toEqual(first.equipmentShop);
    await expect(g.execute(first.id, first.revision, { type: 'reroll' })).rejects.toThrow('out of date');
    expect(offersFor(1, 1)).toEqual({ shop: next.shop, equipmentShop: next.equipmentShop });
  });
  it('rejects unavailable purchases and rerolls without gold', async () => {
    const g = new LocalGameGateway(); let s = await g.start();
    await expect(g.execute(s.id, s.revision, { type: 'buy', spell: 'spark' })).rejects.toThrow('unavailable');
    await expect(g.execute(s.id, s.revision, { type: 'buyEquipment', item: 'band' })).rejects.toThrow('unavailable');
    for (let i = 0; i < 2; i++) s = await g.execute(s.id, s.revision, { type: 'buy', spell: 'bolt' });
    await expect(g.execute(s.id, s.revision, { type: 'reroll' })).rejects.toThrow('gold');
    await expect(g.execute(s.id, s.revision, { type: 'buyEquipment', item: 'robe' })).rejects.toThrow('gold');
  });
  it('equips gear, prevents repeat charging, and applies stats to combat', async () => {
    const g = new LocalGameGateway(); let s = await g.start();
    s = await g.execute(s.id, s.revision, { type: 'buyEquipment', item: 'wand' });
    expect(s.gold).toBe(6); expect(s.equipment.weapon).toBe('wand');
    await expect(g.execute(s.id, s.revision, { type: 'buyEquipment', item: 'wand' })).rejects.toThrow('occupied');
    s = await g.execute(s.id, s.revision, { type: 'buyEquipment', item: 'robe' });
    expect(s.gold).toBe(2);
    s = await g.execute(s.id, s.revision, { type: 'fight' });
    expect(s.battle!.frames[0].player.health).toBe(115);
    expect(s.battle!.frames[0].player.mana).toBe(55);
    await expect(g.execute(s.id, s.revision, { type: 'reroll' })).rejects.toThrow('locked');
    await expect(g.execute(s.id, s.revision, { type: 'buyEquipment', item: 'robe' })).rejects.toThrow('locked');
    s = await g.execute(s.id, s.revision, { type: 'next' });
    expect(s.gold).toBe(12); expect(s.equipment.armor).toBe('robe'); expect(s.shop).toEqual(offersFor(2, 0).shop);
  });
  it('limits hands to ten spells and preserves their casting order', async () => {
    const g = new LocalGameGateway(); let s = await g.start();
    while (s.spells.length < 10) {
      const id = s.shop[0];
      // Earn enough gold between rounds; commands remain authoritative.
      if (s.gold < 5) {
        s = await g.execute(s.id, s.revision, { type: 'fight' });
        s = await g.execute(s.id, s.revision, { type: 'next' });
      } else s = await g.execute(s.id, s.revision, { type: 'buy', spell: id });
    }
    await expect(g.execute(s.id, s.revision, { type: 'buy', spell: s.shop[0] })).rejects.toThrow('full');
    const last = s.spells[9];
    s = await g.execute(s.id, s.revision, { type: 'move', from: 9, to: 0 });
    expect(s.spells[0]).toBe(last);
    await expect(g.execute(s.id, s.revision, { type: 'move', from: 0, to: 10 })).rejects.toThrow('Invalid');
    const expected = [...s.spells];
    s = await g.execute(s.id, s.revision, { type: 'fight' });
    expect(s.battle!.frames[0].player.spells).toEqual(expected);
  });
  it('keeps returned equipment snapshots isolated and resets rerolls each round', async () => {
    const g = new LocalGameGateway(); let s = await g.start();
    s.equipment.armor = 'robe';
    s = await g.execute(s.id, s.revision, { type: 'reroll' });
    expect(s.equipment).toEqual({});
    s = await g.execute(s.id, s.revision, { type: 'fight' });
    s = await g.execute(s.id, s.revision, { type: 'next' });
    expect(s.rerolls).toBe(0); expect(s.gold).toBe(19);
  });
});
