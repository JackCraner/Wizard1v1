import { cloneSnapshot } from '../game/clone';
import { fighter, simulate, RULES } from '../game/engine';
import { attunedDomains } from '../game/attunement';
import { createBotStates, grantBotAugment, prepareBot, type BotStates } from '../game/botAI';
import { createLobby, roundPairings } from '../game/tournament';
import type { Battle, Lobby, LobbyPlayer, Session } from '../game/model';
import { LocalGameGateway } from '../services/localGateway';
import { MULTIPLAYER_PROTOCOL, parseRequest, type RoomRequest, type RoomSnapshot } from './protocol';

interface Member { id: string; name: string; token: string; seen: number; ready: boolean; gateway: LocalGameGateway; }
interface RoomOptions { hostToken: string; guestToken: string; invite: string; seed: number; now?: () => number; }

/** One authoritative room, independent of HTTP, Android, React and storage. */
export class RoomAuthority {
  private members: Member[];
  private stage: RoomSnapshot['room']['stage'] = 'lobby';
  private bots = 0;
  private botStates: BotStates = {};
  private lobby: Lobby = createLobby();
  private joinKey = '';
  private queue: Promise<unknown> = Promise.resolve();
  private completed = new Map<string, string>();
  private now: () => number;
  constructor(private options: RoomOptions) {
    this.now = options.now ?? Date.now;
    this.members = [{ id: 'host', name: 'Host', token: options.hostToken, seen: this.now(), ready: false, gateway: new LocalGameGateway(true) }];
  }
  handle(input: unknown): Promise<RoomSnapshot> {
    const operation = this.queue.then(() => this.apply(parseRequest(input)));
    this.queue = operation.catch(() => undefined);
    return operation;
  }
  private async apply(r: RoomRequest): Promise<RoomSnapshot> {
    if (this.stage === 'closed') {
      const member = this.members.find(m => m.token === r.token);
      if (r.action === 'snapshot' && member) return this.view(member);
      throw new Error('The host closed this room.');
    }
    if (r.action === 'join') {
      if (r.invite !== this.options.invite || !r.joinKey || r.joinKey.length < 24) throw new Error('Invalid invitation. Scan the host’s game code again.');
      let guest = this.members.find(m => m.id === 'guest');
      if (guest && this.joinKey !== r.joinKey) throw new Error('Both player seats are occupied.');
      if (!guest) {
        if (this.stage !== 'lobby') throw new Error('This game has already started.');
        const name = r.name?.trim().slice(0, 24) || 'Guest';
        guest = { id: 'guest', name, token: `${this.options.guestToken}.${r.joinKey}`, seen: this.now(), ready: false, gateway: new LocalGameGateway(true) };
        this.members.push(guest); this.joinKey = r.joinKey;
      }
      guest.seen = this.now();
      return { ...this.view(guest), token: guest.token };
    }
    const member = this.members.find(m => m.token === r.token);
    if (!member) throw new Error('Your seat could not be verified. Rejoin using the host’s invitation.');
    member.seen = this.now();
    if (r.action === 'snapshot') return this.view(member, r.revision);
    const key = `${member.id}:${r.requestId}`;
    const fingerprint = JSON.stringify(r);
    if (this.completed.has(key)) {
      if (this.completed.get(key) !== fingerprint) throw new Error('Request ID was already used.');
      return this.view(member);
    }
    if (['configure', 'start', 'close'].includes(r.action) && member.id !== 'host') throw new Error('Only the host can do that.');
    switch (r.action) {
      case 'configure':
        if (this.stage !== 'lobby') throw new Error('Bot count is locked after the game starts.');
        this.bots = r.bots!;
        break;
      case 'start':
        if (this.stage !== 'lobby') throw new Error('Game already started.');
        if (this.members.length !== 2 || this.members.some(m => !this.connected(m))) throw new Error('Wait for the second player to connect.');
        await this.start();
        break;
      case 'command': await this.command(member, r); break;
      case 'unready':
        if (this.stage !== 'playing' || member.gateway.snapshot().phase !== 'shop') throw new Error('Combat has already started.');
        member.ready = false; this.bump(member); break;
      case 'leave':
        if (member.id === 'host' || this.stage === 'playing') this.stage = 'closed';
        else { this.members = this.members.filter(m => m !== member); this.joinKey = ''; }
        break;
      case 'close': this.stage = 'closed'; break;
    }
    this.completed.set(key, fingerprint);
    if (this.completed.size > 128) this.completed.delete(this.completed.keys().next().value!);
    return this.view(member);
  }
  private connected(member: Member) { return this.now() - member.seen < 15000; }
  private bump(member: Member) {
    const s = member.gateway.snapshot(); s.revision++; member.gateway.restore(s);
  }
  private async start() {
    const template = createLobby();
    this.lobby = { ...template, players: [
      ...this.members.map(m => ({ ...cloneSnapshot(template.players[0]), id: m.id, name: m.name })),
      ...template.players.slice(1, 1 + this.bots),
    ] };
    this.botStates = createBotStates(this.lobby.players.filter(p => !p.human).map(p => p.id));
    for (const [i, member] of this.members.entries()) {
      const s = await member.gateway.start('normal', (this.options.seed + i * 104729) >>> 0);
      s.id = `${this.options.invite.slice(0, 12)}-${member.id}`;
      s.lobby = this.personalLobby(member.id);
      member.gateway.restore(s);
    }
    this.stage = 'playing';
  }
  private personalLobby(id: string): Lobby {
    const lobby = cloneSnapshot(this.lobby);
    // Existing presentation uses `human` to identify the local viewer.
    for (const p of lobby.players) { p.human = p.id === id; p.deck = [...p.lastCombatDeck]; }
    return lobby;
  }
  private view(member: Member, sinceRevision?: number): RoomSnapshot {
    let session: Session | null = null;
    const unchanged = this.stage === 'playing' && sinceRevision !== undefined && sinceRevision === member.gateway.revision;
    if (this.stage === 'playing' && !unchanged) {
      session = member.gateway.snapshot();
      session.lobby = this.personalLobby(member.id);
      session.multiplayer = {
        ready: member.ready,
        waitingFor: this.members.filter(m => !m.ready).map(m => m.name),
        bye: session.phase === 'result' && !session.battle,
      };
    }
    return cloneSnapshot({ protocol: MULTIPLAYER_PROTOCOL, playerId: member.id, unchanged,
      room: { stage: this.stage, bots: this.bots, players: this.members.map(m => ({ id: m.id, name: m.name, connected: this.connected(m), ready: m.ready })) }, session });
  }
  private async command(member: Member, r: RoomRequest) {
    if (this.stage !== 'playing') throw new Error('Wait for the host to start.');
    const s = member.gateway.snapshot(), command = r.command!;
    if (s.id !== r.sessionId || s.revision !== r.revision) throw new Error('This action is out of date. Try again.');
    if (this.lobby.finished) throw new Error('This game is complete.');
    if (member.ready) throw new Error('Your hand is locked. Cancel ready to make changes.');
    if (command.type !== 'fight') { await member.gateway.execute(s.id, s.revision, command); return; }
    if (s.phase !== 'shop' || !s.spells.length || s.spells.length > RULES.slots) throw new Error(`Equip between 1 and ${RULES.slots} spells before readying up.`);
    if (this.members.some(m => !this.connected(m))) throw new Error('Wait for the other player to reconnect.');
    member.ready = true; this.bump(member);
    if (this.members.every(m => m.ready)) this.resolveRound();
  }
  private resolveRound() {
    const sessions = new Map(this.members.map(m => [m.id, m.gateway.snapshot()]));
    const first = sessions.get('host')!;
    if ([...sessions.values()].some(s => s.round !== first.round || s.level !== first.level || s.phase !== 'shop')) throw new Error('Players must finish the same round before battling.');
    const lobby = cloneSnapshot(this.lobby), bots = cloneSnapshot(this.botStates);
    for (const [i, p] of lobby.players.entries()) {
      const s = sessions.get(p.id);
      p.level = first.level;
      if (s) { p.deck = [...s.spells]; p.deckXp = [...(s.spellXp ?? [])]; p.deckAcquired = [...(s.spellAcquired ?? [])]; p.augments = [...s.augments]; }
      else {
        if (first.round > 1) grantBotAugment(bots[p.id], p.deck, first.round - 1, i, this.options.seed);
        p.deck = prepareBot(bots[p.id], p.deck, first.round, i, first.difficulty, this.options.seed);
        p.deckXp = [...bots[p.id].spellXp]; p.deckAcquired = [...bots[p.id].spellAcquired]; p.augments = [...bots[p.id].augments];
      }
      p.lastCombatDeck = [...p.deck]; p.lastCombatXp = [...p.deckXp!]; p.lastCombatAugments = [...p.augments];
      p.lastCombatAttuned = attunedDomains(p.deck, p.deckAcquired); p.lastCombatRound = first.round;
    }
    const ids = lobby.players.map(p => p.id);
    if (ids.length % 2) ids.push('bye');
    const battles = new Map<string, Battle>();
    for (const [aId, bId] of roundPairings(ids, first.round)) {
      if (aId === 'bye' || bId === 'bye') continue;
      const a = lobby.players.find(p => p.id === aId)!, b = lobby.players.find(p => p.id === bId)!;
      const makeFighter = (p: LobbyPlayer) => fighter(p.name, p.deck, p.augments, p.deckXp, p.deckAcquired, p.level);
      const battle = simulate(makeFighter(a), makeFighter(b), this.options.seed + first.round * 101 + lobby.players.indexOf(a) * 17);
      battles.set(aId, battle); battles.set(bId, mirrorBattle(battle));
      if (battle.outcome === 'draw') { a.draws++; b.draws++; }
      else { const winner = battle.outcome === 'victory' ? a : b, loser = winner === a ? b : a; winner.wins++; winner.trophies += winner.level; loser.losses++; }
    }
    lobby.winnerIds = lobby.players.filter(p => p.trophies >= lobby.trophiesToWin).map(p => p.id);
    lobby.finished = lobby.winnerIds.length > 0;
    this.lobby = lobby; this.botStates = bots;
    for (const member of this.members) {
      const s = sessions.get(member.id)!, p = lobby.players.find(p => p.id === member.id)!;
      s.battle = battles.get(member.id) ?? null; s.phase = 'result'; s.revision++;
      s.wins = p.wins; s.losses = p.losses; s.trophies = p.trophies; s.lobby = this.personalLobby(member.id);
      member.ready = false; member.gateway.restore(s);
    }
  }
}

/** Preserve one simulation's causal IDs, event ordering and RNG on both screens. */
export function mirrorBattle(battle: Battle): Battle {
  const swap = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(swap);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key === 'player' ? 'bot' : key === 'bot' ? 'player' : key,
      (key === 'side' || key === 'sourceSide') && (item === 'player' || item === 'bot') ? item === 'player' ? 'bot' : 'player' : swap(item)]));
  };
  return { ...swap(battle) as Battle, outcome: battle.outcome === 'draw' ? 'draw' : battle.outcome === 'victory' ? 'defeat' : 'victory' };
}
