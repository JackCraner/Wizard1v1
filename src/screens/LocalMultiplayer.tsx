import { useEffect, useRef, useState } from 'react';
import { BackHandler, DeviceEventEmitter, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameApp } from '../GameApp';
import { JoinQr } from '../components/JoinQr';
import { FullscreenButton } from '../components/FullscreenButton';
import { HttpRoomTransport, MultiplayerClient } from '../multiplayer/client';
import { canHostOnPhone, startPhoneHost, type HostInfo } from '../multiplayer/hosting';
import { gameInvitation, parseInvitation, wifiInvitation } from '../multiplayer/invitation';
import { palette, typography } from '../theme';
import { useOrientation } from '../useOrientation';

function browserLink() { return Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.href : ''; }
export function hasLocalInvitation() { return /#(?:join|host)=/.test(browserLink()); }
function clientKey() {
  if (Platform.OS === 'web') return Array.from(crypto.getRandomValues(new Uint8Array(24)), n => n.toString(16).padStart(2, '0')).join('');
  return `native-${Date.now()}-${++nextClient}`;
}
let nextClient = 0;
function storedJoinKey(invite: string) {
  const key = `wizard-join-${invite}`;
  try {
    const previous = sessionStorage.getItem(key);
    if (previous) return previous;
    const value = clientKey(); sessionStorage.setItem(key, value); return value;
  } catch { return clientKey(); }
}

export function LocalMultiplayer({ onBack }: { onBack: () => void }) {
  const [client, setClient] = useState<MultiplayerClient | null>(null);
  const [info, setInfo] = useState<HostInfo | null>(null);
  const [origin, setOrigin] = useState('');
  const [inviteLink, setInviteLink] = useState(browserLink().includes('#join=') ? browserLink() : '');
  const [name, setName] = useState('Guest');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'room' | 'game'>('room');
  const [, refresh] = useState(0);
  const stopHost = useRef<(() => Promise<void>) | null>(null);
  const mounted = useRef(true);
  const lastStage = useRef('lobby');
  const { width, height } = useWindowDimensions();
  useOrientation(true);
  const compact = height < 500;
  const snapshot = client?.snapshot;
  const host = snapshot?.playerId === 'host';
  const stopped = snapshot?.room.stage === 'closed';
  const link = info ? gameInvitation(origin || info.origin, info.invite) : '';

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; void stopHost.current?.(); };
  }, []);
  useEffect(() => {
    if (!client) return;
    const update = () => {
      if (client.snapshot?.room.stage === 'playing' && lastStage.current !== 'playing') setView('game');
      lastStage.current = client.snapshot?.room.stage ?? 'lobby';
      refresh(n => n + 1);
    };
    const unwatch = client.watch(update);
    update(); client.connect();
    return () => { unwatch(); client.disconnect(); };
  }, [client]);
  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('LocalMultiplayerStopped', (message: string) => { setError(message); setView('room'); });
    return () => listener.remove();
  }, []);
  const run = async (operation: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError('');
    try { await operation(); } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : 'Unable to connect.'); }
    finally { if (mounted.current) setBusy(false); }
  };
  async function hostRoom(hotspot: boolean) {
    await run(async () => {
      if (canHostOnPhone) {
        const hosted = await startPhoneHost(hotspot);
        if (!mounted.current) { await hosted.stop(); return; }
        stopHost.current = hosted.stop; setInfo(hosted.info); setOrigin(hosted.info.origin);
        const c = new MultiplayerClient(hosted.transport, hosted.info.hostToken, clientKey());
        await c.send({ action: 'snapshot' }); setClient(c);
      } else {
        const url = new URL(browserLink()), token = new URLSearchParams(url.hash.slice(1)).get('host');
        if (!token) throw new Error('Host from the Android app. This browser can join a host’s game.');
        const response = await fetch(`${url.origin}/api/bootstrap`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
        if (!response.ok) throw new Error('The host link has expired. Restart the local server.');
        const details = await response.json() as HostInfo;
        setInfo(details); setOrigin(details.origin);
        const c = new MultiplayerClient(new HttpRoomTransport(url.origin), token, clientKey());
        await c.send({ action: 'snapshot' }); setClient(c);
      }
    });
  }
  async function join() {
    await run(async () => {
      const invitation = parseInvitation(inviteLink);
      if (Platform.OS !== 'web') { await Linking.openURL(inviteLink); return; }
      if (new URL(browserLink()).origin !== invitation.origin) { await Linking.openURL(inviteLink); return; }
      const c = new MultiplayerClient(new HttpRoomTransport(invitation.origin), '', clientKey());
      await c.send({ action: 'join', invite: invitation.invite, name, joinKey: storedJoinKey(invitation.invite) });
      setClient(c);
    });
  }
  const autoJoined = useRef(false);
  useEffect(() => {
    if (!autoJoined.current && browserLink().includes('#join=')) { autoJoined.current = true; void join(); }
  }, []);
  async function leave() {
    await run(async () => {
      try { if (client && !stopped) await client.send({ action: host ? 'close' : 'leave' }); }
      finally {
        client?.disconnect(); await stopHost.current?.(); stopHost.current = null;
        setClient(null); setInfo(null); onBack();
      }
    });
  }
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!busy) { if (client && view === 'game') setView('room'); else void leave(); }
      return true;
    });
    return () => listener.remove();
  }, [busy, client, view]);
  const button = (title: string, action: () => void, disabled = false) => <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={busy || disabled} onPress={action} style={[s.button, (busy || disabled) && s.disabled]}><Text style={s.buttonText}>{title}</Text></Pressable>;
  const disconnected = !!client?.connectionError || !!snapshot?.room.players.some(p => !p.connected);
  return <View style={s.root}>
    {snapshot?.session && !stopped && <View style={{ flex: 1, display: view === 'game' ? 'flex' : 'none' }}>
      <GameApp gateway={client!} initialSession={snapshot.session} onMultiplayer={() => setView('room')} multiplayer />
      {disconnected && <View style={s.connection}><Text style={s.text}>{client?.connectionError || 'Waiting for the other phone to reconnect…'}</Text>{button('Local room', () => setView('room'))}</View>}
    </View>}
    {(view === 'room' || stopped || !snapshot?.session) && <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={[s.page, { padding: compact ? 12 : 24 }]}>
        <View style={s.heading}><View style={{ flex: 1 }}><Text accessibilityRole="header" style={s.title}>Multiplayer <Text style={s.local}>· Local</Text></Text><Text style={s.muted}>{client ? 'Keep the host app open · No internet needed' : 'Two phones, one Wi-Fi network'}</Text></View><FullscreenButton />{button(client ? 'Leave room' : 'Back', client ? () => void leave() : onBack)}</View>
        {!client ? <View style={[s.columns, width < 650 && s.stacked]}>
          <View style={s.panel}><Text style={s.subtitle}>Host a game</Text><Text style={s.text}>One Android phone runs the room. Your friend plays in their browser.</Text>
            {canHostOnPhone ? <>{button('Create hotspot & host', () => void hostRoom(true))}{button('Host on existing Wi-Fi', () => void hostRoom(false))}</> : browserLink().includes('#host=') ? button('Host local game', () => void hostRoom(false)) : <Text style={s.muted}>Open the installed Android app to host.</Text>}
          </View>
          <View style={s.panel}><Text style={s.subtitle}>Join a game</Text><Text style={s.text}>Scan the host’s Wi-Fi code first, then the game code. Already on the same Wi-Fi? Scan only the game code.</Text>
            <TextInput accessibilityLabel="Player name" placeholder="Your name" placeholderTextColor={palette.goldMuted} value={name} maxLength={24} onChangeText={setName} style={s.input} />
            <TextInput accessibilityLabel="Game invitation link" placeholder="Paste the host’s game link" placeholderTextColor={palette.goldMuted} value={inviteLink} onChangeText={setInviteLink} autoCapitalize="none" style={s.input} />
            {button('Join local game', () => void join(), !inviteLink.trim())}
          </View>
        </View> : stopped ? <View style={s.panel}><Text style={s.subtitle}>Room closed</Text><Text style={s.text}>A player left or the host ended the game. Create or join a new room to play again.</Text></View> : <View style={[s.columns, width < 650 && s.stacked]}>
          {host && info && <View style={[s.panel, { flex: 1.5 }]}>
            <View style={s.qrs}>
              {info.ssid && info.password && <View style={s.qr}><Text style={s.subtitle}>1 · Join Wi-Fi</Text><JoinQr value={wifiInvitation(info.ssid, info.password)} size={compact ? 122 : 170} label="Scan to join the host hotspot" /><Text selectable style={s.muted}>{info.ssid}</Text><Text selectable style={s.muted}>Password: {info.password}</Text></View>}
              <View style={s.qr}><Text style={s.subtitle}>{info.ssid ? '2 · Open game' : 'Scan to join game'}</Text><JoinQr value={link} size={compact ? 122 : 170} label="Scan to open the game in your browser" /><Text style={s.muted}>Open in your phone’s browser</Text></View>
            </View>
            <Text selectable style={s.link}>{link}</Text>
            {info.addresses.length > 1 && <View style={s.qrs}>{info.addresses.map(address => <Pressable key={address} accessibilityRole="button" accessibilityLabel={`Use address ${address}`} onPress={() => setOrigin(address)}><Text style={[s.muted, origin === address && s.selected]}>{address}</Text></Pressable>)}</View>}
          </View>}
          <View style={s.panel}><Text style={s.subtitle}>Players</Text>{snapshot?.room.players.map(player => <View key={player.id} style={s.player}><Text style={s.text}>{player.name}{player.id === snapshot.playerId ? ' · You' : ''}</Text><Text style={s.muted}>{player.connected ? player.ready ? 'Ready' : 'Connected' : 'Reconnecting…'}</Text></View>)}
            {snapshot?.room.players.length === 1 && <Text style={s.muted}>Waiting for your friend to join…</Text>}
            <View style={s.botRow}><Text style={s.text}>Bots: {snapshot?.room.bots ?? 0}</Text>{host && snapshot?.room.stage === 'lobby' && <>{button('− Bot', () => void run(async () => { await client.send({ action: 'configure', bots: snapshot.room.bots - 1 }); }), snapshot.room.bots === 0)}{button('+ Bot', () => void run(async () => { await client.send({ action: 'configure', bots: snapshot.room.bots + 1 }); }), snapshot.room.bots === 6)}</>}</View>
            <Text style={s.muted}>Up to 8 players · Odd totals rotate a rest round · Bots play at Normal difficulty</Text>
            {snapshot?.room.stage === 'playing' ? button('Resume game', () => setView('game')) : host ? button('Start game', () => void run(async () => { await client.send({ action: 'start' }); }), snapshot?.room.players.length !== 2 || disconnected) : <Text style={s.text}>Waiting for the host to start…</Text>}
          </View>
        </View>}
        {!!(error || client?.connectionError) && <Text accessibilityRole="alert" style={s.error}>{error || client?.connectionError}</Text>}
        {busy && <Text style={s.muted}>Connecting…</Text>}
      </ScrollView>
    </SafeAreaView>}
  </View>;
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.darkSurface }, page: { gap: 12, flexGrow: 1 }, heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { color: palette.parchment, fontFamily: typography.serif, fontSize: 24 }, local: { color: palette.gold, fontSize: 17 }, subtitle: { color: palette.gold, fontSize: 15, fontWeight: '700' },
  columns: { flexDirection: 'row', gap: 12 }, stacked: { flexDirection: 'column' }, panel: { flex: 1, gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#756447', backgroundColor: '#172326' },
  button: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#8e805c', borderRadius: 7, backgroundColor: '#304b40', justifyContent: 'center', alignItems: 'center' }, buttonText: { color: palette.parchment, fontSize: 13, fontWeight: '600' }, disabled: { opacity: .4 },
  text: { color: palette.parchment, fontSize: 13, lineHeight: 18 }, muted: { color: palette.goldMuted, fontSize: 11, lineHeight: 15 }, input: { color: palette.parchment, borderWidth: 1, borderColor: '#756447', borderRadius: 6, padding: 10, minHeight: 42 },
  qrs: { flexDirection: 'row', justifyContent: 'space-around', gap: 12, flexWrap: 'wrap' }, qr: { alignItems: 'center', gap: 5 }, link: { color: '#b6dfd0', fontSize: 11 }, selected: { color: palette.gold },
  player: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, botRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, error: { color: '#ffc6aa', fontSize: 12 },
  connection: { position: 'absolute', top: 0, left: 0, right: 0, padding: 8, backgroundColor: '#492b22', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
});
