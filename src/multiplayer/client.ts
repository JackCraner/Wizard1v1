import type { Command, GameGateway, Session } from '../game/model';
import { MULTIPLAYER_PROTOCOL, type RoomReply, type RoomRequest, type RoomSnapshot, type RoomTransport } from './protocol';

export class HttpRoomTransport implements RoomTransport {
  constructor(private origin: string) {}
  async request(request: RoomRequest): Promise<RoomSnapshot> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${this.origin}/api/room`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request), signal: controller.signal });
      const reply = await response.json() as RoomReply;
      if (!reply.ok) throw new Error(reply.error || 'The host could not complete that action.');
      if (reply.snapshot.protocol !== MULTIPLAYER_PROTOCOL) throw new Error('Game versions differ. Update both devices.');
      return reply.snapshot;
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error instanceof TypeError)) throw new Error('Host unreachable. Check Wi-Fi and keep the host app open.');
      throw error;
    } finally { clearTimeout(timer); }
  }
}

/** The same game gateway works with an in-process host, LAN HTTP or a future online transport. */
export class MultiplayerClient implements GameGateway {
  snapshot: RoomSnapshot | null = null;
  connectionError = '';
  private listeners = new Set<(session: Session) => void>();
  private watchers = new Set<() => void>();
  private sequence = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private stopped = true;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private transport: RoomTransport, public token: string, private clientId: string) {}
  watch(listener: () => void) { this.watchers.add(listener); return () => { this.watchers.delete(listener); }; }
  subscribe(listener: (session: Session) => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  private publish(snapshot: RoomSnapshot) {
    if (snapshot.unchanged) snapshot = { ...snapshot, session: this.snapshot?.session ?? null };
    this.snapshot = snapshot; this.connectionError = '';
    if (snapshot.token) this.token = snapshot.token;
    this.watchers.forEach(fn => fn());
    if (snapshot.session) this.listeners.forEach(fn => fn(snapshot.session!));
    return snapshot;
  }
  send(fields: Omit<RoomRequest, 'protocol'>): Promise<RoomSnapshot> {
    const request: RoomRequest = { protocol: MULTIPLAYER_PROTOCOL, token: this.token, ...(fields.action === 'snapshot' ? { revision: this.snapshot?.session?.revision } : {}), ...fields, requestId: `${this.clientId}-${++this.sequence}` };
    const run = this.queue.then(async () => {
      try { const result = await this.transport.request(request); return this.publish(result); }
      catch (cause) { if (fields.action === 'snapshot') { this.connectionError = cause instanceof Error ? cause.message : 'Connection lost.'; this.watchers.forEach(fn => fn()); } throw cause; }
    });
    this.queue = run.catch(() => undefined);
    return run;
  }
  async start() {
    const snapshot = await this.send({ action: 'snapshot' });
    if (!snapshot.session) throw new Error('Wait for the host to start.');
    return snapshot.session;
  }
  async execute(sessionId: string, revision: number, command: Command) {
    const snapshot = await this.send({ action: 'command', sessionId, revision, command });
    if (!snapshot.session) throw new Error('The room has closed.');
    return snapshot.session;
  }
  async cancelReady() {
    const snapshot = await this.send({ action: 'unready' });
    if (!snapshot.session) throw new Error('The room has closed.');
    return snapshot.session;
  }
  connect() {
    if (!this.stopped) return;
    this.stopped = false;
    const poll = async () => {
      if (this.stopped) return;
      try { await this.send({ action: 'snapshot' }); } catch { /* The lobby and game expose connectionError. */ }
      if (!this.stopped) this.timer = setTimeout(poll, 1000);
    };
    void poll();
  }
  disconnect() { this.stopped = true; if (this.timer) clearTimeout(this.timer); }
}
