import type { Command, Session } from '../game/model';

export const MULTIPLAYER_PROTOCOL = 1;
export type RoomAction = 'join' | 'snapshot' | 'configure' | 'start' | 'command' | 'unready' | 'leave' | 'close';
export interface RoomRequest {
  protocol: number;
  action: RoomAction;
  token?: string;
  requestId?: string;
  invite?: string;
  name?: string;
  joinKey?: string;
  bots?: number;
  revision?: number;
  sessionId?: string;
  command?: Command;
}
export interface RoomSnapshot {
  unchanged?: boolean;
  protocol: number;
  playerId: string;
  token?: string;
  room: {
    stage: 'lobby' | 'playing' | 'closed';
    bots: number;
    players: { id: string; name: string; connected: boolean; ready: boolean }[];
  };
  session: Session | null;
}
export type RoomReply = { ok: true; snapshot: RoomSnapshot } | { ok: false; error: string };
export interface RoomTransport { request(request: RoomRequest): Promise<RoomSnapshot>; }

const integer = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
export function validCommand(value: unknown): value is Command {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  switch (c.type) {
    case 'reroll': case 'fight': case 'next': return true;
    case 'rerollAugment': return integer(c.slot);
    case 'chooseAugment': return typeof c.augment === 'string' && c.augment.length <= 80;
    case 'buy': return typeof c.spell === 'string' && c.spell.length <= 80 && (c.shopSlot === undefined || integer(c.shopSlot)) && (c.target === undefined || integer(c.target));
    case 'trash': return integer(c.index);
    case 'move': case 'merge': return integer(c.from) && integer(c.to);
    default: return false;
  }
}
export function parseRequest(value: unknown): RoomRequest {
  if (!value || typeof value !== 'object') throw new Error('Invalid request.');
  const r = value as RoomRequest;
  if (r.protocol !== MULTIPLAYER_PROTOCOL) throw new Error('Game versions differ. Update both devices.');
  if (!['join', 'snapshot', 'configure', 'start', 'command', 'unready', 'leave', 'close'].includes(r.action)) throw new Error('Unknown room action.');
  for (const field of ['token', 'requestId', 'invite', 'name', 'joinKey', 'sessionId'] as const) {
    if (r[field] !== undefined && (typeof r[field] !== 'string' || r[field]!.length > 200)) throw new Error('Invalid request field.');
  }
  if (r.action === 'command' && (!validCommand(r.command) || !integer(r.revision) || !r.sessionId)) throw new Error('Invalid game action.');
  if (r.action === 'configure' && (!integer(r.bots) || r.bots! > 6)) throw new Error('Choose between 0 and 6 bots.');
  if (r.action !== 'snapshot' && (!r.requestId || r.requestId.length < 8)) throw new Error('Missing request ID.');
  return r;
}
