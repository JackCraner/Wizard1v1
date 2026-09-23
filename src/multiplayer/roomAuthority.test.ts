import { describe, expect, it } from 'vitest';
import type { Command } from '../game/model';
import { RoomAuthority, mirrorBattle } from './roomAuthority';
import { MULTIPLAYER_PROTOCOL, type RoomRequest, type RoomSnapshot } from './protocol';
import { wifiInvitation, parseInvitation, gameInvitation } from './invitation';

async function room(botCount = 0) {
  let now = 1000, count = 0;
  const authority = new RoomAuthority({ hostToken: 'host-secret', guestToken: 'guest-secret', invite: 'invite-secret', seed: 1234, now: () => now });
  const send = (token: string, fields: Omit<RoomRequest, 'protocol' | 'token'>) => authority.handle({ protocol: MULTIPLAYER_PROTOCOL, token, requestId: `request-${++count}`, ...fields });
  const guest = await send('', { action: 'join', invite: 'invite-secret', joinKey: 'guest-client-key-long-enough', name: 'Friend' });
  const tokens = ['host-secret', guest.token!];
  await send(tokens[0], { action: 'configure', bots: botCount });
  await send(tokens[0], { action: 'start' });
  const state = (index: number) => send(tokens[index], { action: 'snapshot' });
  const command = async (index: number, command: Command) => {
    const s = (await state(index)).session!;
    return send(tokens[index], { action: 'command', sessionId: s.id, revision: s.revision, command });
  };
  const buy = async (index: number) => { const s = (await state(index)).session!; return command(index, { type: 'buy', spell: s.shop[0]!, shopSlot: 0 }); };
  const fight = async () => { await command(0, { type: 'fight' }); await command(1, { type: 'fight' }); return Promise.all([state(0), state(1)]); };
  return { authority, send, state, command, buy, fight, tokens, advanceClock: () => { now += 16000; } };
}

describe('authoritative local multiplayer', () => {
  it('waits for both players, locks ready hands, and publishes one mirrored battle', async () => {
    const r = await room(); await r.buy(0); await r.buy(1);
    const waiting = await r.command(0, { type: 'fight' });
    expect(waiting.session?.multiplayer?.ready).toBe(true);
    expect(waiting.session?.battle).toBeNull();
    await expect(r.command(0, { type: 'reroll' })).rejects.toThrow('locked');
    await r.command(1, { type: 'fight' });
    const [a, b] = await Promise.all([r.state(0), r.state(1)]);
    expect(a.session?.phase).toBe('result');
    expect(b.session?.battle).toEqual(mirrorBattle(a.session!.battle!));
    expect(a.session?.lobby.players.filter(p => p.human).map(p => p.id)).toEqual(['host']);
    expect(b.session?.lobby.players.filter(p => p.human).map(p => p.id)).toEqual(['guest']);
    expect(a.session?.lobby.players.map(p => p.trophies)).toEqual(b.session?.lobby.players.map(p => p.trophies));
  });
  it('validates protocol, commands, identity, phase, revisions and authority', async () => {
    const r = await room();
    await expect(r.authority.handle({ protocol: 99, action: 'snapshot' })).rejects.toThrow('versions');
    await expect(r.send('intruder', { action: 'snapshot' })).rejects.toThrow('verified');
    await expect(r.send(r.tokens[1], { action: 'configure', bots: 2 })).rejects.toThrow('host');
    await expect(r.command(0, { type: 'fight' })).rejects.toThrow('Equip');
    const before = (await r.state(0)).session!;
    await r.buy(0); await r.buy(1);
    await expect(r.send(r.tokens[0], { action: 'command', sessionId: before.id, revision: before.revision, command: { type: 'reroll' } })).rejects.toThrow('out of date');
    await expect(r.send(r.tokens[1], { action: 'command', sessionId: before.id, revision: 0, command: { type: 'reroll' } })).rejects.toThrow('out of date');
    await expect(r.authority.handle({ protocol: 1, token: r.tokens[0], action: 'command', requestId: 'invalid-command', sessionId: before.id, revision: 1, command: { type: 'giveGold' } })).rejects.toThrow('Invalid');
    await r.fight();
    await expect(r.command(0, { type: 'reroll' })).rejects.toThrow('locked');
  });
  it('deduplicates delivered purchases without spending twice', async () => {
    const r = await room(), s = (await r.state(0)).session!;
    const request: RoomRequest = { protocol: 1, token: r.tokens[0], requestId: 'purchase-once', action: 'command', sessionId: s.id, revision: s.revision, command: { type: 'buy', spell: s.shop[0]!, shopSlot: 0 } };
    const [first, retry] = await Promise.all([r.authority.handle(request), r.authority.handle(request)]);
    expect(retry.session).toEqual(first.session); expect(retry.session?.spells).toHaveLength(1);
    await expect(r.authority.handle({ ...request, command: { type: 'reroll' } })).rejects.toThrow('already used');
  });
  it('keeps shops private and copies every boundary', async () => {
    const r = await room(); await r.buy(0);
    const guest = await r.state(1);
    expect(guest.session?.lobby.players.find(p => p.id === 'host')?.deck).toEqual([]);
    guest.session!.gold = 9999; guest.room.bots = 6;
    expect((await r.state(1)).session?.gold).toBe(10);
    expect((await r.state(1)).room.bots).toBe(0);
  });
  it('omits unchanged sessions from polling replies and returns changes after a purchase', async () => {
    const r = await room();
    const initial = (await r.state(0)).session!;
    const same = await r.send(r.tokens[0], { action: 'snapshot', revision: initial.revision });
    expect(same.unchanged).toBe(true); expect(same.session).toBeNull();
    await r.buy(0);
    const changed = await r.send(r.tokens[0], { action: 'snapshot', revision: initial.revision });
    expect(changed.unchanged).toBe(false); expect(changed.session?.spells).toHaveLength(1);
  });
  it('allows cancelling ready and reconnecting without a new seat', async () => {
    const r = await room(); await r.buy(0); await r.buy(1);
    await r.command(0, { type: 'fight' });
    const cancelled = await r.send(r.tokens[0], { action: 'unready' });
    expect(cancelled.session?.multiplayer?.ready).toBe(false);
    r.advanceClock();
    await expect(r.command(0, { type: 'fight' })).rejects.toThrow('reconnect');
    const resumed = await r.send('', { action: 'join', invite: 'invite-secret', joinKey: 'guest-client-key-long-enough' });
    expect(resumed.token).toBe(r.tokens[1]); expect(resumed.session?.spells).toHaveLength(1);
    await r.fight();
  });
  it('rejects third players and bot changes during play', async () => {
    const r = await room();
    await expect(r.send('', { action: 'join', invite: 'invite-secret', joinKey: 'another-client-key-long-enough' })).rejects.toThrow('occupied');
    await expect(r.send(r.tokens[0], { action: 'configure', bots: 3 })).rejects.toThrow('locked');
    await expect(r.send(r.tokens[0], { action: 'configure', bots: 7 })).rejects.toThrow('0 and 6');
  });
  it.each([0, 1, 2, 5, 6])('resolves rounds and level-up rewards with %i bots', async count => {
    const r = await room(count); await r.buy(0); await r.buy(1);
    for (let round = 1; round <= 3; round++) {
      const states = await r.fight();
      for (const [index, snapshot] of states.entries()) {
        expect(snapshot.session?.round).toBe(round);
        expect(snapshot.session?.phase).toBe('result');
        expect(snapshot.session?.lobby.players).toHaveLength(count + 2);
        if (snapshot.session!.multiplayer!.bye) expect(snapshot.session?.battle).toBeNull();
        else expect(snapshot.session?.battle?.frames.length).toBeGreaterThan(1);
        const next = await r.command(index, { type: 'next' });
        if (round === 2) {
          expect(next.session?.phase).toBe('augment');
          await r.command(index, { type: 'chooseAugment', augment: next.session!.augmentOffers[0] });
          expect((await r.state(index)).session?.level).toBe(2);
        }
      }
    }
  });
  it('replays the same seed identically including bots', async () => {
    async function play(): Promise<RoomSnapshot[]> { const r = await room(2); await r.buy(0); await r.buy(1); return r.fight(); }
    expect(await play()).toEqual(await play());
  });
  it('closes the room for everyone when a player leaves during a game', async () => {
    const r = await room();
    expect((await r.send(r.tokens[1], { action: 'leave' })).room.stage).toBe('closed');
    expect((await r.state(0)).room.stage).toBe('closed');
  });
});

it('escapes Wi-Fi credentials and preserves game invitations', () => {
  expect(wifiInvitation('Wizard; LAN', 'p:a\\ss')).toBe('WIFI:T:WPA;S:Wizard\\; LAN;P:p\\:a\\\\ss;;');
  expect(parseInvitation(gameInvitation('http://192.168.1.5:8787', 'invite-code'))).toEqual({ origin: 'http://192.168.1.5:8787', invite: 'invite-code' });
  expect(() => parseInvitation('javascript:alert(1)')).toThrow();
});
