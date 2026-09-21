import { afterEach, expect, it, vi } from 'vitest';
import { SPELLS } from './engine';
import { LocalGameGateway } from '../services/localGateway';

afterEach(() => vi.unstubAllGlobals());

it('runs a complete session without browser crypto or structuredClone', async () => {
  vi.stubGlobal('crypto', undefined);
  vi.stubGlobal('structuredClone', undefined);
  const gateway = new LocalGameGateway();
  const first = await gateway.start();
  const bought = await gateway.execute(first.id, first.revision, { type: 'buy', spell: first.shop[0]! });
  const result = await gateway.execute(bought.id, bought.revision, { type: 'fight' });
  expect(result.battle?.frames.length).toBeGreaterThan(1);
  const next = await gateway.execute(result.id, result.revision, { type: 'next' });
  expect(next.round).toBe(2);
  expect(next.gold).toBe(20-SPELLS[first.shop[0]!].price);
});

it('rejects old sessions after starting again and isolates nested snapshots', async () => {
  const gateway = new LocalGameGateway();
  const first = await gateway.start();
  const second = await gateway.start();
  expect(first.id).not.toBe(second.id);
  await expect(gateway.execute(first.id, first.revision, { type: 'fight' })).rejects.toThrow('not found');
  const bought = await gateway.execute(second.id, second.revision, { type: 'buy', spell: second.shop[0]! });
  const result = await gateway.execute(bought.id, bought.revision, { type: 'fight' });
  result.spells.length = 0;
  result.battle!.frames[0].player.health = -100;
  const next = await gateway.execute(result.id, result.revision, { type: 'next' });
  expect(next.spells).toEqual([second.shop[0]!]);
});

