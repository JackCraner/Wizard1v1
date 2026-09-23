import { expect, it } from 'vitest';
import { MultiplayerClient } from './client';
import { RoomAuthority } from './roomAuthority';

it('retains the current game across lightweight polls and delivers room closure', async () => {
  const authority = new RoomAuthority({ hostToken: 'host', guestToken: 'guest', invite: 'invite', seed: 42 });
  const transport = { request: authority.handle.bind(authority) };
  const host = new MultiplayerClient(transport, 'host', 'host-browser');
  const guest = new MultiplayerClient(transport, '', 'guest-browser');
  await guest.send({ action: 'join', invite: 'invite', joinKey: 'guest-reconnection-key-12345' });
  await host.send({ action: 'start' });
  const initial = await guest.start();
  const purchased = await guest.execute(initial.id, initial.revision, { type: 'buy', spell: initial.shop[0]!, shopSlot: 0 });
  const poll = await guest.send({ action: 'snapshot' });
  expect(poll.unchanged).toBe(true);
  expect(poll.session).toEqual(purchased);
  expect(poll.session?.spells).toHaveLength(1);
  await host.send({ action: 'close' });
  const closed = await guest.send({ action: 'snapshot' });
  expect(closed.room.stage).toBe('closed');
  expect(closed.session).toBeNull();
});
